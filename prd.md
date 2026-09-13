# Product Requirements Document (PRD)

## MANAK — Legal Metrology Compliance Checker App

**Smart India Hackathon 2026 | Problem Statement SIH26034**
**Governing Regulation**: Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009

---

## 1. Problem Statement

Packaged commodities sold across retail stores and e-commerce platforms in India are legally mandated to display statutory declarations under the Legal Metrology (Packaged Commodities) Rules, 2011. Manual inspection by enforcement officers is slow and prone to oversight. MANAK automates packaging audit workflows using Google Vision OCR, human verification, and statutory AI compliance evaluation.

---

## 2. Updated 4-Phase System Pipeline

The core end-to-end audit workflow consists of 4 distinct phases:

```
[Phase 1: Scan Product]
   └─ Image Capture via Camera / Upload / E-Commerce URL
        │
        ▼
[Phase 2: Google Vision OCR & Categorization]
   └─ Product Identification (Brand/Logo/Category) + Text Extraction
        │
        ▼
[Phase 3: Human Review & Verification Screen]
   └─ Officer / User verifies & edits extracted fields before evaluation
        │
        ▼
[Phase 4: MANAK AI Compliance Engine & Evidentiary Report]
   └─ Rules 6 & 7 Audit -> Compounding Penalties -> Sec 65B Signed PDF
```

### Phase 1: Product Capture & Scan
- **Action**: Officer captures label photo via camera or uploads packaging image.
- **Output**: Base64 image payload sent to backend `/api/extract`.

### Phase 2: Google Vision OCR & Product Categorization
- **Action**: Backend queries Google Cloud Vision API (`TEXT_DETECTION` + `LABEL_DETECTION` / `LOGO_DETECTION`).
- **Processing**:
  1. Identifies product category (Food & Beverage, Personal Care, Household Chemical, Electronic, etc.) and brand.
  2. Extracts verbatim packaging text across Principal Display Panel (PDP).
  3. Structure-parses 9 mandatory statutory declarations (Manufacturer, Generic Name, Net Quantity, MRP, Dates, Consumer Care, Origin, Numeral Height).

### Phase 3: Human Review & Verification Interface (`ExtractedTextReviewScreen`)
- **Action**: Intermediary interface where inspecting officer/user reviews the detected declarations.
- **Features**:
  - Displays verbatim OCR text alongside structured input fields.
  - Allows manual entry/correction of un-extracted or obscured fields.
  - Re-parse button to sync edited raw text back into structured declarations.

### Phase 4: MANAK AI Compliance Engine & Evidentiary Report
- **Action**: Executes PCR 2011 statutory rule evaluation on the human-verified declarations.
- **Output**:
  - Rule-by-rule pass/violation verdict.
  - Compounding penalty calculation under Rule 32 / Section 36.
  - SHA-256 tamper-evident hash & Sec 65B Indian Evidence Act certified PDF report.

---

## 3. Core Functional Requirements

| Module | Requirement |
|---|---|
| **Image Scan** | High-contrast camera capture with flashlight & scale reference overlay. |
| **Google Vision OCR** | `DOCUMENT_TEXT_DETECTION` for full label extraction + `LABEL_DETECTION` for product categorization. |
| **Review Interface** | Pre-evaluation editing screen preventing garbage data from entering compliance engine. |
| **PCR Rule Engine** | Rule 6 (Generic Name, Net Wt, MRP, Mfg Date, Address, Consumer Care) & Rule 7 (Numeral Height). |
| **Report Generation** | Digitally signed PDF report with SHA-256 hash & officer DSC token. |

---

## 4. Non-Functional Requirements
- **Extraction Latency**: $< 3$ seconds for Google Vision OCR detection.
- **Accuracy**: Human review step guarantees $100\%$ data fidelity before legal evaluation.
- **Security**: SHA-256 cryptographic evidence hashing adhering to Section 65B of Indian Evidence Act, 1872 / 2023.
