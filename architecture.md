# Technical Architecture Document

## MANAK — Legal Metrology Compliance System

---

## 1. System Architecture Overview

MANAK is designed as a decoupled 4-phase microservices architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React + Vite)                          │
│                                                                             │
│  [CameraScanScreen] ──► [OcrExtractionScreen] ──► [ExtractedTextReviewScreen]│
│                                                          │                  │
│                                                          ▼                  │
│  [InspectionReportScreen] ◄── [AnalysisResultsScreen] ◄──┘                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ REST API Calls
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express + TypeScript)                      │
│                                                                             │
│  ├── /api/extract   ──► Google Vision OCR & Categorization Engine           │
│  ├── /api/evaluate  ──► PCR 2011 Rule Evaluation Engine                     │
│  └── /api/dashboard ──► Supabase Analytics & Inspection History Store      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 4-Step Technical Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Enforcement Officer
    participant UI as React Frontend
    participant API as Express Backend
    participant Vision as Google Cloud Vision API
    participant Engine as PCR Rule Engine

    Officer->>UI: 1. Capture / Upload Product Label Image
    UI->>API: POST /api/extract (image_base64)
    API->>Vision: 2. TEXT_DETECTION + LABEL_DETECTION
    Vision-->>API: OCR Text + Product Category + Brand Annotations
    API-->>UI: Return extracted fields & category
    Officer->>UI: 3. Verify & Edit Extracted Fields (Review Screen)
    Officer->>UI: Click "Run Compliance Check"
    UI->>API: POST /api/evaluate (verified_extraction)
    API->>Engine: 4. Evaluate PCR 2011 Rules (Rule 6, 7 & 32)
    Engine-->>API: Compliance Verdict + Statutory Penalties
    API-->>UI: Return signed Inspection Record
    UI->>Officer: Display Results & Download Sec 65B PDF Report
```

---

## 3. Module Responsibilities

### 1. `server/services/googleVisionOcr.ts`
- Performs Google Cloud Vision REST API calls (`https://vision.googleapis.com/v1/images:annotate`).
- Features requested:
  - `TEXT_DETECTION` / `DOCUMENT_TEXT_DETECTION`: Verbatim packaging text.
  - `LABEL_DETECTION` & `LOGO_DETECTION`: Product categorization (e.g., Food, Cosmetic, Household, Electronics) and Brand identification.

### 2. `src/services/labelParser.ts`
- Regex pattern parser that maps raw OCR text lines into structured declaration objects:
  - Manufacturer Name, Address & PIN
  - Generic Commodity Name
  - Net Quantity & Unit
  - MRP & Tax Disclaimer
  - Month/Year of Packing
  - Consumer Care Cell
  - Country of Origin
  - Rule 7 Numeral Height Calibration

### 3. `src/components/screens/ExtractedTextReviewScreen.tsx`
- Human-in-the-loop review interface.
- Ensures inspecting officer can edit, correct, or complete any obscured fields before legal evaluation.

### 4. `src/services/ruleEngine.ts`
- Evaluates verified declarations against Legal Metrology (Packaged Commodities) Rules, 2011.
- Computes compounding penalties under Rule 32 / Section 36 of Legal Metrology Act, 2009.

### 5. `src/services/pdfReportGenerator.ts`
- Generates tamper-evident digital evidence report with SHA-256 cryptographic hash certified under Sec 65B of Indian Evidence Act.
