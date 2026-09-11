# MANAK — App Flow Documentation

**Legal Metrology Compliance Checker App**
Dual-mode system for government officers (enforcement) and consumers (reporting), built around the Legal Metrology (Packaged Commodities) Rules, 2011.

---

## Design System (applies to all screens)

- **Primary color:** Deep navy `#1B3A6B`
- **Accent (violation/alert):** Safety orange `#E8622C`
- **Success (compliant):** Green `#2A9D5C`
- **Neutrals:** Background `#F5F6F8`, text `#1A1A1A`
- **Font:** Inter or similar clean sans-serif
- **Style:** Rounded corners (8–12px), soft shadows, mobile-first (390px), PWA
- **Nav pattern:** Bottom nav for both apps, but with different item sets (see below)

---

## Shared Entry Flow

```
Splash / Loading (logo)
        │
        ▼
Role Selection
   ├──► Government Official → Officer Login (ID + Password)
   └──► Consumer → Consumer Login (Mobile OTP)
```

- **Officer login** uses Government/Employee ID + password — restricted access.
- **Consumer login** uses mobile number + OTP — low-friction, no password.

---

## Officer Flow

```
Officer Login
     │
     ▼
Officer Dashboard
  (stats: Inspections Today / Violations Found / Pending Reports)
  (actions: Scan Product | Check URL)
  (list: Recent Inspections)
     │
     ├──► Scan Product ──► Camera Capture ──► Analysis Loading ──┐
     │                                                            │
     └──► Check URL ──► Paste URL Form ──► Analysis Loading ──────┤
                                                                   ▼
                                                     Compliance Result Screen
                                                     (checklist of declarations,
                                                      green/orange status)
                                                                   │
                                                                   ▼
                                                     Report Preview & Generation
                                                     (geo-tag, timestamp, digital
                                                      signature, PDF export)
                                                                   │
                                                                   ▼
                                                     Saved to Inspection History
```

**Bottom nav:** Dashboard · Scan · History · Profile

**Screens:**
1. Splash / Loading
2. Role Selection
3. Officer Login
4. Officer Dashboard
5. Scan Product (camera capture)
6. Check URL (paste link)
7. Extraction/Analysis Loading (shared by both input paths)
8. Compliance Result
9. Report Preview & Generation
10. Inspection History / Search

---

## Consumer Flow

```
Consumer Login (OTP)
     │
     ▼
Consumer Dashboard
  (single primary action: "Scan a Product")
  (secondary section: My Reports)
     │
     ▼
Check a Product (segmented toggle: Scan Label | Paste Link)
     │
     ▼
Analysis Loading (same engine as officer path)
     │
     ▼
Compliance Result (consumer-facing, simplified)
     │
     ▼
Report Screen (12a)
  - shows what was detected
  - optional description + extra photo
  - Submit Report
     │
     ▼
Report Submitted Successfully (12b)
  - reference ID + timestamp
  - "Track Status" or "Back to Home"
     │
     ▼
My Reports (status: Under Review → Reviewed, once an officer actions it)
```

**Bottom nav:** Home · My Reports (deliberately minimal — no Dashboard/History/officer tooling)

**Screens:**
11. Consumer Dashboard / Home
12. Check a Product (combined scan + paste-link toggle)
13. Report Screen
14. Report Submitted Successfully

---

## Key Flow Decisions

- **Consumers get one combined "Check a Product" entry point** (toggle between Scan Label / Paste Link), rather than the officer's separate Scan / Check URL navigation — consumers don't need the enforcement-specific split, and a single entry point keeps the nav simpler for a lighter-weight user.
- **Analysis loading and the underlying extraction pipeline are shared** between officer and consumer paths — same OCR/rule-engine backend, different front-end presentation (officer version shows more detail, consumer version is simplified).
- **Consumer reports route into the officer's queue** for review; report status (`Under Review` → `Reviewed`) needs a lightweight status field and notification trigger on the backend — noted as a small but real scope item, not just a UI state.
- **Rule engine is deterministic, not LLM-based** — OCR/AI only handles extracting messy text into structured fields; the actual compliance decision (which declarations are missing, MRP rounding, font height, etc.) runs through auditable rule logic so it can hold up as evidence.
- **E-commerce URL checking is scoped to a small set of named platform adapters** for the pilot (not arbitrary URL scraping) — this applies to both the officer's Check URL screen and the consumer's Paste Link tab, since both now hit the same backend adapters.

---

## Open Items (not yet designed)

- Empty/error states (no internet, OCR failed, invalid/unsupported URL)
- Officer review screen for incoming consumer reports
- Notification design (push/SMS) for report status changes
- Rule 7 font/numeral height calibration flow (requires a reference object in-frame — flagged during architecture discussion as a hard part)
