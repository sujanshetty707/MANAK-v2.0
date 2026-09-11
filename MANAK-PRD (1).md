# Product Requirements Document

## MANAK — Legal Metrology Compliance Checker App

**Smart India Hackathon 2026 | Problem Statement SIH26034**
**Team TAG**

| Field | Value |
|---|---|
| Document status | Draft v1.0 |
| Governing regulation | The Legal Metrology (Packaged Commodities) Rules, 2011 |
| Ministry | Consumer Affairs, Food & Public Distribution |
| Target scope | Pilot — single state, 10–50 officers |

---

## 1. Problem Statement

Packaged commodities sold through retail stores and e-commerce platforms in India are legally required to carry mandatory declarations (manufacturer/packer/importer details, net quantity, MRP, date of manufacture, consumer care info) under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011. Manual inspection by enforcement officers is slow, inconsistent, and cannot scale to the volume and variety of products in the market. Missing declarations, incorrect font sizes, and improper MRP formatting frequently go undetected.

## 2. Goals

- Let officers check physical products (label scan) and online listings (URL check) against the 2011 Rules in near real-time.
- Generate audit-ready, digitally signed compliance reports usable as evidence.
- Let consumers self-check a product and report suspected violations, routed to officers for verification.
- Build entirely on free-tier / open-source infrastructure suitable for a state-level pilot budget.

## 3. Non-Goals (out of scope for pilot)

- Hardware-based physical verification (weight/dimension sensors) — noted in research as a possible v2 differentiator, not part of this scope.
- National-scale rollout, multi-state load, or arbitrary e-commerce URL support beyond named pilot platforms.
- Consumer reward/gamification systems.
- Automated legal action / penalty issuance — the app produces evidence and reports; enforcement decisions remain with the officer.

## 4. Target Users

| User | Needs |
|---|---|
| **Legal Metrology Enforcement Officer** | Fast, reliable, evidence-backed compliance checks in-store and online; searchable inspection history; signed reports. |
| **Consumer** | Simple way to check a product and flag something that looks wrong, without needing to understand the Rules themselves. |

## 5. Scope & Constraints

- **Rollout:** Small pilot — one state, 10–50 officers.
- **Latency target:** Near real-time (<10s) while the officer is standing in-store, on a network connection.
- **Connectivity:** Store environments in the pilot region are assumed to have adequate signal most of the time; offline is the exception path, not the primary design center (see §9 for the reasoning behind this trade-off).
- **E-commerce coverage:** Scoped to 2–3 named platforms with dedicated adapters for the pilot — not arbitrary URL scraping.

## 6. User Flows

### 6.1 Officer flow
```
Login (Govt ID + password)
  → Dashboard (stats + Scan Product | Check URL + recent inspections)
    → Scan Product (camera) ──┐
    → Check URL (paste link) ─┤
                               → Analysis (extraction + rule check)
                               → Compliance Result (declaration checklist)
                               → Report Preview (geo-tag, timestamp, signature)
                               → Signed report → Inspection History
```

### 6.2 Consumer flow
```
Login (mobile OTP)
  → Dashboard (single "Check a Product" action + My Reports)
    → Check a Product (toggle: Scan Label | Paste Link)
      → Analysis (same engine as officer path, simplified view)
      → Result → Report screen (auto-filled findings + optional note/photo)
      → Submit → Confirmation (reference ID) → tracked in My Reports
```

Full screen-by-screen UI specification (14 screens across both flows, plus shared design system) has been generated separately as UI mockups and is treated as the source of truth for interface implementation alongside this PRD.

## 7. Functional Requirements

Mapped directly to the problem statement's required capabilities:

| # | Requirement | Notes |
|---|---|---|
| FR1 | Image upload / camera capture of product labels | Officer + consumer |
| FR2 | Paste and check e-commerce product URLs | Officer + consumer; scoped platform adapters |
| FR3 | Extraction of declarations from labels/listings | OCR + entity parsing (see §9) |
| FR4 | Detection of missing/incorrect/non-standard declarations | Deterministic rule engine against the 2011 Rules |
| FR5 | Font size & readability / numeral height check | Rule 7 — requires in-frame scale reference (see §11, risk R1) |
| FR6 | Generation of compliance/non-compliance reports | PDF, digitally signed, evidence-attached |
| FR7 | Repository of scanned products & inspection history | Searchable, filterable by date/status/mode |
| FR8 | Role-based access & secure authentication | Officer (ID/password) vs consumer (OTP) |
| FR9 | Dashboard for monitoring compliance status | Officer: stats + recent activity. See FR13 for heatmap. |
| FR10 | Export of reports (PDF + editable format) | |
| FR11 | Consumer violation reporting | Routed to officer review queue with status tracking |
| FR12 | Offline capture with sync-on-reconnect | Provisional (on-device) result immediately, verified result after cloud sync |
| FR13 | Repeat-violator heatmap by manufacturer/seller/location | Adopted from MetaMark reference solution — aggregates violations to surface systemic offenders, backing the "fairer marketplace" impact goal |
| FR14 | Officer-facing compliance assistant (chatbot) | Natural-language Q&A against the Rules (e.g. "minimum numeral height for a 300g package?") — advisory only, does not make compliance decisions |

## 8. Non-Functional Requirements

- **Auditability:** Every compliance decision must be traceable to a specific rule clause, not an opaque model output — required for evidence to hold up if a report is contested (Indian Evidence Act, 1872 §65B relevance for digital evidence; IT Act 2000 for digital signatures).
- **Performance:** <10s end-to-end for in-store scan/URL check when online.
- **Availability:** Officer app must remain usable (capture + queue) with no network; sync resolves on reconnect.
- **Security:** Role-based access, encrypted storage of evidence images, no secrets in source (see §10, anti-pattern to avoid).
- **Cost:** Built on free-tier/open-source tools suitable for pilot budget (see §10).

## 9. System Architecture

```
CLIENTS
 Officer App (React PWA)          Consumer App (React PWA)
 - camera scan / paste URL        - camera scan / paste URL (combined toggle)
 - offline queue (IndexedDB)      - report → officer review queue
        │                                  │
        ▼                                  ▼
              Supabase Auth (role-based / OTP)
                        │
        Edge Orchestration (Supabase Edge Functions)
        routes: /scan  /url-check  /report  /sync
        │                │                 │
   EXTRACTION        URL CAPTURE      OFFLINE SYNC
   OCR (Gemini        Platform-        queue drain +
   Vision) + entity   specific         conflict merge
   parse              adapters
        │                │                 │
        └────────┬───────┘                 │
                  ▼                         │
           RULE ENGINE ◄─────────────────────┘
           deterministic lookup tables
           (2011 Rules), NOT an LLM
                  │
           RAG EXPLANATION LAYER
           retrieves actual rule clause text
           to generate human-readable "why"
                  │
           REPORT GENERATION
           PDF + digital signature (DSC/eSign)
                  │
        STORAGE & DB (Postgres + object storage)
        products, inspections, violations,
        evidence images, geo/time
                  │
           OFFICER DASHBOARD
           (inspections, history, heatmap)
```

### Key architectural decisions

1. **Deterministic rule engine, AI only for extraction and explanation.** OCR/LLM turns messy label or listing text into structured fields; the pass/fail decision and any severity/penalty runs through fixed, testable rule logic (lookup tables built from the Rules PDF, including Rule 32's specified fines). A compliance decision that could justify a fine must not be decided non-deterministically by a model call — this was validated against a reference implementation (MetaMark, SIH 2025) that let an LLM invent penalty scores at runtime with a hardcoded fallback on failure, which would produce inconsistent, unauditable results for the same violation.
2. **RAG for explanations, not decisions.** Rule clause text (Rule 6, 7, 9, 13, etc.) is embedded and retrieved to generate the "why this is a violation" text in reports, so explanations cite real rule language rather than an LLM paraphrasing from memory.
3. **Cross-source verification before flagging.** A declaration is only flagged as missing if it's absent from *both* the OCR read and, where available, a second independent source (e.g. the e-commerce listing's own structured fields) — reduces false positives from a single bad OCR read.
4. **E-commerce capture via DOM read, not server-side scraping.** Rather than fetching and re-parsing listing pages server-side (fragile against anti-bot measures, JS rendering, layout drift), a lightweight browser extension/content-script reads already-rendered product fields directly from the DOM the officer or consumer is viewing and posts structured data to the backend. This sidesteps scraping fragility for the platforms a content script is written for, at the cost of being scoped to those platforms — consistent with the pilot's 2–3 platform limit.
5. **Hybrid online/offline extraction.** Online: image → cloud OCR/extraction → rule engine, meeting the <10s target. Offline: on-device OCR gives an immediate, clearly-labeled *provisional* result; the full image queues for cloud reprocessing on reconnect, after which the officer gets a *verified* result. Chosen over a fully on-device model because small on-device OCR is meaningfully worse on real-world Indian retail labels (mixed Hindi/English, glare, curved packaging) and rule updates would otherwise require app releases rather than a backend change — acceptable trade-offs only once validated at a scale where connectivity is consistently unreliable, which is a v2 consideration, not this pilot.

## 10. Tech Stack (free-tier / open-source first)

| Layer | Tool | Notes |
|---|---|---|
| Frontend | React, Tailwind CSS, Vite | PWA, works online & offline |
| Backend | Supabase Edge Functions | Serverless, free tier |
| Database | Supabase (Postgres) | |
| Auth | Supabase Auth | Officer ID/password + consumer OTP |
| Storage | Supabase Storage / Firebase Storage | Evidence images — object storage, not DB blobs |
| AI / OCR | Gemini Vision, Tesseract (on-device fallback) | Cloud-first, on-device fallback per §9.5 |
| E-commerce capture | Browser extension (content script) | Platform-scoped, DOM read per §9.4 |
| Digital signature | DigiLocker / Documenso (open-source eSign) | For report signing |
| Deployment | Vercel (frontend), Supabase (backend) | |
| Monitoring | Sentry, Postlog | |

**Security note carried over from reference-solution review:** no API keys or secrets are to be hardcoded with in-code fallback values anywhere in the repo — environment variables only, no default secret if the env var is missing.

## 11. Key Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Rule 7 numeral-height check requires millimeter measurement; a photo alone gives pixels, not mm | Require a reference object (coin/card edge) in frame for scale calibration, or use phone AR/depth APIs |
| R2 | E-commerce parsing breaks on arbitrary URLs | Scope to 2–3 named platforms with dedicated adapters for the pilot; DOM-read approach (§9.4) reduces breakage vs. server-side scraping |
| R3 | Offline queue conflicts / data loss if app is killed mid-queue | Persist queue in IndexedDB, mark results provisional vs. verified, resolve dupes on sync |
| R4 | Non-deterministic compliance decisions undermine evidentiary value | Deterministic rule engine only (§9.1); AI confined to extraction and explanation |
| R5 | OCR misreads on glare/curved/multilingual labels | Cross-source verification (§9.3); provisional/verified distinction for offline reads |

## 12. Success Metrics (pilot)

- Average time per in-store inspection (target: reduction vs. manual baseline).
- % of officer-generated reports requiring no manual correction.
- Number of consumer reports resulting in a verified violation.
- Repeat-violator entities surfaced via the heatmap that were not previously flagged manually.

## 13. Open Items

- Empty/error states (no internet, OCR failed, unsupported URL) — not yet specified.
- Officer-side review screen for incoming consumer reports.
- Notification design (push/SMS) for consumer report status changes.
- Fixed penalty/severity lookup table — to be derived from Rule 32 and the First Schedule's permissible-error tables.

## 14. References

- The Legal Metrology (Packaged Commodities) Rules, 2011 (GSR 202(E), 7 March 2011).
- Legal Metrology Act, 2009.
- Indian Evidence Act, 1872, §65B (digital evidence admissibility).
- Information Technology Act, 2000 (digital signatures).
- Consumer Protection Act, 2019.
- MetaMark (SIH 2025, Team Code Nirvana) — reviewed as a reference implementation for e-commerce compliance checking; specific adopted and rejected patterns documented in §9.
