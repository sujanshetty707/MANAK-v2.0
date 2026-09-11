# Technical Architecture Document

## MANAK — Legal Metrology Compliance Checker App

Companion to the PRD. This document specifies the system at implementation level: data model, API contracts, pipeline internals, and deployment topology. Written against the confirmed pilot scope — one state, 10–50 officers, <10s online turnaround, offline as the exception path.

---

## 1. Component Overview

```
┌────────────────────┐   ┌────────────────────┐   ┌─────────────────────┐
│ Officer PWA (React) │   │ Consumer PWA(React) │   │ Browser Extension    │
│ IndexedDB offline   │   │ IndexedDB offline   │   │ (content script,     │
│ queue               │   │ queue               │   │ platform-scoped)     │
└──────────┬──────────┘   └──────────┬──────────┘   └──────────┬───────────┘
           │                          │                          │
           └──────────────┬───────────┴──────────────────────────┘
                           ▼
            ┌───────────────────────────────┐
            │ Supabase Auth                  │
            │ officer: email/ID + password   │
            │ consumer: phone OTP            │
            └───────────────┬─────────────────┘
                           ▼
            ┌───────────────────────────────┐
            │ Supabase Edge Functions (API)   │
            │ /scan  /url-check  /report      │
            │ /sync  /history  /chat          │
            └──┬──────────┬───────────┬────────┘
               ▼          ▼           ▼
     ┌─────────────┐ ┌──────────┐ ┌───────────────┐
     │ Extraction   │ │ Rule     │ │ RAG Explain    │
     │ Service      │ │ Engine   │ │ Service        │
     │ (Gemini      │ │ (pure    │ │ (pgvector +    │
     │ Vision OCR)  │ │ TS/JS,   │ │ Gemini)        │
     │              │ │ no LLM)  │ │                │
     └──────┬───────┘ └────┬─────┘ └───────┬─────────┘
            └────────────────┬─────────────┘
                              ▼
              ┌─────────────────────────────┐
              │ Postgres (Supabase)          │
              │ + Supabase Storage (images)  │
              └───────────────┬───────────────┘
                              ▼
              ┌─────────────────────────────┐
              │ Report Generator               │
              │ PDF (server-side) + eSign      │
              │ integration (Documenso/DigiLocker) │
              └─────────────────────────────┘
```

**Design invariant carried through every layer:** extraction (OCR/LLM) produces structured, uncertain data; the rule engine is deterministic code operating on that structured data; nothing that determines pass/fail or severity is an LLM call. The RAG service only ever generates human-readable explanation text attached *after* a decision has already been made by the rule engine — it cannot alter the decision.

---

## 2. Data Model

Postgres, via Supabase. All tables use `uuid` primary keys unless noted. RLS (row-level security) enforced per-role — detailed in §7.

```sql
-- Users & roles
users (
  id uuid pk,
  role text check (role in ('officer','consumer')),
  auth_id uuid references auth.users,       -- Supabase auth link
  full_name text,
  phone text,                                -- consumer login
  employee_id text,                          -- officer login
  department text,
  created_at timestamptz default now()
)

-- Product / inspection subject
products (
  id uuid pk,
  source_type text check (source_type in ('store','ecommerce')),
  ecommerce_platform text,                   -- 'amazon' | 'flipkart' | null
  ecommerce_url text,
  title text,
  category text,
  manufacturer_raw text,                     -- as extracted, unnormalized
  created_at timestamptz default now()
)

-- One inspection = one scan/check event
inspections (
  id uuid pk,
  product_id uuid references products,
  performed_by uuid references users,
  mode text check (mode in ('scan','url_check')),
  status text check (status in ('provisional','verified','failed')),
  geo_lat numeric,
  geo_lng numeric,
  device_timestamp timestamptz,
  server_timestamp timestamptz default now(),
  extraction_result jsonb,                   -- raw structured extraction, see §4
  compliance_result jsonb,                   -- rule engine output, see §5
  synced_at timestamptz                      -- null while queued offline
)

-- One row per rule violated in an inspection
violations (
  id uuid pk,
  inspection_id uuid references inspections,
  rule_id text,                              -- e.g. 'rule_6_1_c' (net quantity)
  severity text check (severity in ('critical','major','minor')),
  status text check (status in ('missing','incorrect','partial')),
  expected text,
  found text,
  explanation text,                          -- from RAG explanation service
  rule_citation text                         -- verbatim clause reference
)

-- Evidence images (metadata only — binary lives in Supabase Storage)
evidence_images (
  id uuid pk,
  inspection_id uuid references inspections,
  storage_path text,                         -- bucket path, not blob
  captured_at timestamptz,
  is_primary boolean default false
)

-- Signed report artifact
reports (
  id uuid pk,
  inspection_id uuid references inspections,
  pdf_storage_path text,
  signed boolean default false,
  signature_provider text,                   -- 'documenso' | 'digilocker'
  signed_at timestamptz,
  signed_by uuid references users
)

-- Consumer-submitted reports, routed to officer queue
consumer_reports (
  id uuid pk,
  inspection_id uuid references inspections,
  submitted_by uuid references users,
  description text,
  status text check (status in ('under_review','reviewed','dismissed')),
  reviewed_by uuid references users,
  reviewed_at timestamptz,
  created_at timestamptz default now()
)

-- Rule lookup table — the deterministic engine's data, not code
compliance_rules (
  rule_id text pk,                           -- 'rule_6_1_c'
  rule_source text,                          -- '2011 Rules, Rule 6(1)(c)'
  category text,                             -- 'net_quantity' | 'mrp' | 'manufacturer' ...
  requirement_name text,
  check_type text,                           -- 'presence' | 'format' | 'numeric_range'
  validation_spec jsonb,                     -- machine-checkable spec, see §5
  severity_default text,
  penalty_amount numeric,                    -- from Rule 32 fixed fines where applicable
  applies_to jsonb                           -- which categories/exemptions this applies to
)

-- Heatmap aggregation view (materialized, refreshed periodically)
manufacturer_violation_summary (
  manufacturer_raw text,
  violation_count int,
  last_violation_at timestamptz,
  approx_lat numeric,
  approx_lng numeric
)
```

**Storage bucket layout (Supabase Storage):**
```
evidence/{inspection_id}/{image_id}.jpg   -- encrypted at rest, private bucket
reports/{report_id}.pdf                    -- private bucket, signed URL access only
```

---

## 3. API Contract (Edge Functions)

All endpoints require a Supabase Auth JWT. Officer-only endpoints additionally check `role = 'officer'` via RLS policy, not just app-layer logic.

### `POST /scan`
Officer/consumer submits a captured label image.
```jsonc
// Request
{ "image_base64": "...", "mode": "store", "geo": {"lat":..,"lng":..}, "device_timestamp":"..." }

// Response (200)
{
  "inspection_id": "uuid",
  "status": "verified",              // or "provisional" if served from on-device fallback
  "extraction": { ... },              // see §4
  "compliance": { ... },              // see §5
  "violations": [ { "rule_id":"rule_6_1_e", "severity":"critical", ... } ]
}
```

### `POST /url-check`
Officer/consumer submits structured data captured by the browser extension (not a raw URL — see §6).
```jsonc
// Request
{
  "platform": "amazon",
  "url": "https://www.amazon.in/dp/XXXXXXXXXX",
  "dom_extract": {
     "title": "...", "mrp_text": "...", "net_quantity_text": "...",
     "manufacturer_text": "...", "images": ["data:image/..."]
  }
}
// Response: same shape as /scan
```

### `POST /report/{inspection_id}/generate`
Officer-only. Generates PDF and initiates signature flow.
```jsonc
// Response
{ "report_id": "uuid", "pdf_url": "signed-url", "signature_status": "pending" }
```

### `POST /sync`
Drains the client's offline queue.
```jsonc
// Request
{ "queued_inspections": [ { "local_id":"...", "image_base64":"...", "captured_at":"..." }, ... ] }

// Response — one result per queued item, matched by local_id
{ "results": [ { "local_id":"...", "inspection_id":"uuid", "status":"verified" }, ... ] }
```

### `POST /consumer-report`
```jsonc
{ "inspection_id":"uuid", "description":"optional text", "extra_image_base64": null }
```

### `GET /history?status=&mode=&from=&to=&q=`
Officer-only, paginated.

### `POST /chat`
Advisory-only rule Q&A. Never returns a compliance verdict for a specific product — routes those requests back to `/scan` or `/url-check`.

---

## 4. Extraction Pipeline

Input: image (label photo) or `dom_extract` object (e-commerce). Output: a normalized structured object, regardless of source — this is what makes the rule engine source-agnostic.

```jsonc
{
  "manufacturer": { "value": "ABC Foods Pvt Ltd, Pune 411001", "source": "ocr", "confidence": 0.91 },
  "net_quantity": { "value": "500", "unit": "g", "source": "ocr", "confidence": 0.88 },
  "mrp": { "value": 149.00, "currency": "INR", "format_raw": "MRP Rs.149/- incl. of all taxes", "source": "ocr", "confidence": 0.95 },
  "mfg_date": { "value": "2026-03", "source": "ocr", "confidence": 0.74 },
  "consumer_care": { "value": null, "source": "ocr", "confidence": 0.0 },
  "numeral_height_mm": { "value": null, "note": "no reference object detected in frame" },
  "secondary_source": {                      -- present for /url-check and /scan-with-metadata
    "manufacturer": { "value": "ABC Foods", "source": "listing_metadata" },
    "net_quantity": { "value": "500 g", "source": "listing_metadata" }
  }
}
```

Steps:
1. **Store scan:** image → Gemini Vision OCR → raw text blocks with bounding boxes.
2. **URL check:** `dom_extract` fields arrive already-structured from the extension — OCR is only invoked on product images within `dom_extract.images` if a field (e.g. MRP) isn't present in the page's text DOM.
3. **Entity parsing:** raw OCR text → structured fields above, via prompted extraction (LLM call, extraction only — not a compliance judgment).
4. **Cross-source reconciliation:** where a `secondary_source` exists, a field is marked `present` if found in either source; only marked `missing` if absent from both (§9.3 of PRD).
5. **Numeral height:** measured only if a reference object (coin/card) is detected in-frame; otherwise explicitly `null`, not assumed compliant — the rule engine treats `null` as "unable to verify," a distinct status from pass/fail, surfaced to the officer rather than silently skipped.

---

## 5. Rule Engine

Pure function, no model call. Reads `compliance_rules` table, evaluates each rule's `validation_spec` against the extraction output.

```ts
type ValidationSpec =
  | { check_type: "presence"; field: string }
  | { check_type: "format"; field: string; pattern: string }       // e.g. MRP rounding rule
  | { check_type: "numeric_range"; field: string; min?: number; max?: number }
  | { check_type: "conditional"; condition: string; then: ValidationSpec }; // e.g. Rule 5 standard pack sizes

function evaluateRule(rule: ComplianceRule, extraction: ExtractionResult): ViolationResult | null {
  const field = extraction[rule.validation_spec.field];
  if (field?.value == null || field.value === "") {
    if (extraction.secondary_source?.[rule.validation_spec.field]?.value) return null; // present in secondary source
    return { rule_id: rule.rule_id, status: "missing", severity: rule.severity_default };
  }
  switch (rule.validation_spec.check_type) {
    case "format":
      return matchesPattern(field.value, rule.validation_spec.pattern)
        ? null
        : { rule_id: rule.rule_id, status: "incorrect", severity: rule.severity_default, found: field.value };
    // ...numeric_range, conditional handled the same way — fixed logic, fixed severity
  }
  return null;
}
```

`compliance_rules` is seeded directly from the Rules PDF — e.g.:

| rule_id | rule_source | check_type | pattern/spec | severity | penalty |
|---|---|---|---|---|---|
| `rule_6_1_e_mrp_format` | Rule 6(1)(e) + definitions (m) | format | `^(Maximum|Max\.?) [Rr]etail [Pp]rice.*incl.*taxes` | critical | ₹2000 (Rule 32(2)) |
| `rule_6_1_c_net_qty` | Rule 6(1)(c) | presence | field: net_quantity | critical | ₹2000 |
| `rule_6_1_d_mfg_date` | Rule 6(1)(d) | presence | field: mfg_date, with exemptions per proviso (bidis, LPG cylinders) | major | ₹2000 |
| `rule_7_numeral_height` | Rule 7(2), Table I/II | numeric_range | depends on declared quantity band | major | ₹2000 |
| `rule_6_2_consumer_care` | Rule 6(2) | presence | field: consumer_care | minor | ₹2000 |

This table is the actual artifact to build out fully during implementation — it operationalizes Rules 6, 7, 9–17 from the PDF into machine-checkable specs. Exemptions (Rule 3, Rule 26 — packages under 10g/10ml, industrial/institutional consumers, food articles deferring to other Acts) are represented as `applies_to` filters evaluated before a rule fires.

---

## 6. E-commerce Capture (Browser Extension)

Rejecting server-side scraping per the earlier design review (fragile, no anti-bot handling in reference implementations). Instead:

- **Manifest scope:** `content_scripts` matching only the 2–3 pilot platforms (e.g. `*.amazon.in`, `*.flipkart.com`), `run_at: document_end`.
- **Content script responsibility:** on a detected product page, read the rendered DOM for title, MRP, net quantity, manufacturer/packer text, and product images — using platform-specific selectors maintained per adapter (this is the piece that needs upkeep as marketplace layouts change, not a scraping/anti-bot problem).
- **No raw URL is sent to the backend for re-fetching.** The extension posts the already-extracted `dom_extract` object (see §3, `/url-check`) directly. The backend never fetches the listing page itself.
- **Auth:** extension holds the officer/consumer's Supabase session token (via `chrome.storage`, not raw credentials), attached to the `/url-check` call.
- **Adapter maintenance:** each platform's selector set lives in a versioned config (`adapters/amazon.json`, `adapters/flipkart.json`), not hardcoded in the content script — allows updating selectors without a full extension re-release.

---

## 7. Auth & Security

- **Officer:** Supabase Auth, email/employee-ID + password, `role='officer'` claim.
- **Consumer:** Supabase Auth phone OTP, `role='consumer'` claim.
- **RLS policies** (illustrative):
  - `inspections`: officers can read/write all rows; consumers can read/write only rows where `performed_by = auth.uid()`.
  - `consumer_reports`: consumers can insert and read their own; only officers can update `status`/`reviewed_by`.
  - `compliance_rules`: read-only for all authenticated roles; writable only via a service-role migration, never from the client.
- **Secrets:** all API keys (Gemini, signature provider) in environment variables on the Edge Function runtime — no in-code fallback values, per the anti-pattern flagged during the MetaMark review.
- **Evidence integrity:** images hashed on upload; hash stored alongside `evidence_images` row to support tamper-evidence claims for court admissibility (Evidence Act §65B).

---

## 8. Offline Sync

**Client (IndexedDB) schema:**
```jsonc
{
  "local_id": "uuid-generated-client-side",
  "image_blob": "...",
  "captured_at": "...",
  "geo": {...},
  "sync_status": "queued" | "syncing" | "synced" | "failed",
  "provisional_result": { ... }   // from on-device OCR fallback, shown immediately
}
```

**Flow:**
1. Capture happens regardless of connectivity. If online, image is sent to `/scan` immediately (skip queue).
2. If offline: on-device OCR (ML Kit / Tesseract WASM) runs against the image for a `provisional_result`, shown to the officer with a visible "Provisional — unsynced" badge. Item enters IndexedDB queue with `sync_status: queued`.
3. On reconnect, a background sync process calls `/sync` with all `queued` items in batch.
4. Server processes each with the full cloud pipeline (§4–5), returns `verified` results keyed by `local_id`.
5. Client updates local record: `sync_status: synced`, replaces provisional result with verified result, clears the "unsynced" badge.
6. **Conflict handling:** since `local_id` is client-generated and idempotent, a retried sync (e.g. app killed mid-request) is safe to resend — server upserts on `local_id`, never creates a duplicate inspection.

---

## 9. Report Generation & Signing

1. Officer reviews compliance result, taps "Generate Report."
2. Server renders PDF: officer details, geo/timestamp, product image, violation table (rule citation + explanation from RAG service), signature block.
3. PDF uploaded to `reports/{report_id}.pdf` in private storage.
4. Signature request sent to Documenso (self-hosted, open-source) or DigiLocker integration, per department preference.
5. On signature completion, `reports.signed = true`, PDF becomes immutable (subsequent edits require a new report version, not an overwrite) — this immutability is what §7's evidence-integrity requirement depends on.

---

## 10. Deployment Topology

| Component | Host | Notes |
|---|---|---|
| Officer/Consumer PWA | Vercel | Static build, PWA manifest + service worker for offline shell |
| Edge Functions | Supabase | Same project as DB, colocated for latency |
| Postgres + Storage + Auth | Supabase | Free tier sufficient for pilot scale (10–50 officers) |
| Browser extension | Chrome Web Store (or unpacked for pilot) | Separate release cycle from the PWA |
| Vector store (RAG) | Supabase `pgvector` extension | Avoids standing up a separate vector DB |
| Signature service | Self-hosted Documenso or DigiLocker API | |
| Monitoring | Sentry (errors), Postlog (logs) | Free tiers |

**Environments:** `dev` and `pilot` as two separate Supabase projects — no shared database between development and the live pilot, to avoid test data contaminating officer-facing reports.

---

## 11. Latency Budget (target: <10s online, in-store scan)

| Stage | Budget |
|---|---|
| Image capture → upload | ~1s |
| OCR (Gemini Vision) | ~3–4s |
| Entity parsing | ~1s |
| Rule engine evaluation | <0.1s (pure function, no network) |
| RAG explanation retrieval + generation | ~2s |
| Response round-trip + render | ~1s |
| **Total** | **~8–9s** |

Rule engine and cross-source reconciliation are effectively free relative to the two model calls (OCR, RAG explanation) — those two are the actual latency risk and the first place to optimize if the pilot misses the target (e.g. generating explanation text asynchronously after the pass/fail result is already shown).

---

## 12. Suggested Repo Structure

```
/apps
  /officer-pwa
  /consumer-pwa
  /extension
/services
  /edge-functions
    scan.ts
    url-check.ts
    report.ts
    sync.ts
    chat.ts
  /rule-engine        -- pure TS, unit-testable independent of any API
  /extraction          -- OCR + entity parsing wrappers
  /rag-explain
/db
  /migrations
  /seed
    compliance_rules.seed.sql   -- the operationalized 2011 Rules
/adapters
  amazon.json
  flipkart.json
```

The `rule-engine` package having zero dependency on the API layer or any model client is deliberate — it should be unit-testable against known extraction fixtures without touching Gemini or Supabase at all, since it's the piece an auditor or court would actually scrutinize.
