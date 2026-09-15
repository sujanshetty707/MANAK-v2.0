# MANAK — Technical Architecture, System Pipeline & Progress Overview

> **Target Audience**: Senior Software Engineers, Technical Leads & System Architects  
> **Project Context**: Smart India Hackathon (SIH 2026) | Problem Statement **SIH26034**  
> **Governing Regulation**: Legal Metrology (Packaged Commodities) Rules, 2011 & Legal Metrology Act, 2009 (Sec 36, Sec 65B Indian Evidence Act)

---

## 1. Executive Summary & What MANAK Is

**MANAK** (Legal Metrology Compliance System) is an enterprise-grade, hybrid mobile-and-web enforcement system built for government inspectors and consumers in India.

### The Core Problem
Under the **Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011)**, every pre-packaged commodity sold across retail brick-and-mortar stores or e-commerce marketplaces in India must mandate 9 statutory packaging declarations:
1. Manufacturer / Packer / Importer Name, Address & PIN Code
2. Generic Commodity Name
3. Net Quantity & Standard Unit of Measure
4. Maximum Retail Price (MRP) & Tax Disclaimers
5. Month & Year of Manufacture / Import / Packing
6. Consumer Care Cell (Phone, Email, Address)
7. Country of Origin (mandatory for imported goods)
8. Unit Sale Price (USP)
9. Rule 7 Numeral & Letter Height Compliance

Manual audits by field enforcement officers are slow, labor-intensive, error-prone, and visually challenging across thousands of SKUs. Furthermore, e-commerce listings often omit or obscure these mandatory declarations.

### The MANAK Solution
MANAK automates the entire legal metrology audit workflow through:
1. **Multimodal Packaging OCR & Categorization**: Google Cloud Vision REST API + Google Gemini 2.5/Flash Vision AI.
2. **Human-in-the-Loop Field Verification Interface**: Zero-garbage data policy allowing inspecting officers to verify and edit OCR output prior to legal calculation.
3. **Deterministic Statutory Rule Engine**: Zero-LLM, code-based rule evaluation enforcing PCR 2011 Rules 6, 7 & 32 with compounding penalty calculation.
4. **Sec 65B Tamper-Evident Certified Evidentiary PDF Reports**: Digitally hashed (SHA-256) reports admissible in Indian courts.
5. **Dual Persona Architecture**: Dedicated interfaces for **Enforcement Officers** (field scans, e-commerce URL audits, court-ready report generation) and **Consumers** (violation reporting, product checks, complaint tracking).

---

## 2. System Architecture & Components

MANAK follows a **Decoupled 4-Tier Hybrid Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                           │
│  ┌──────────────────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Enforcement Officer PWA / Native Android App │  │ Consumer PWA / Native App        │  │
│  │ (Capacitor 8 + React 18 + Tailwind CSS)      │  │ (Phone OTP Auth + Violation Flow)│  │
│  └──────────────────────┬───────────────────────┘  └─────────────────┬────────────────┘  │
└─────────────────────────┼────────────────────────────────────────────┼──────────────────┘
                          │ REST / HTTP API Calls                      │
                          ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SERVER API LAYER                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Express 5 / Node.js / TypeScript (`server/index.ts`)                              │  │
│  │  ├── POST /api/extract        ──► Image OCR & Multimodal Parsing                  │  │
│  │  ├── POST /api/url-check      ──► E-Commerce URL & DOM Extraction Audit           │  │
│  │  ├── POST /api/evaluate       ──► Pure Deterministic PCR 2011 Rule Engine        │  │
│  │  ├── POST /api/sync           ──► Drains Offline IndexedDB Queue                  │  │
│  │  └── GET /api/history         ──► Inspection Audit History Store                  │  │
│  └──────────────────────────────────────┬────────────────────────────────────────────┘  │
└─────────────────────────────────────────┼───────────────────────────────────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────────────┐ ┌─────────────────────────┐
│  AI & OCR SERVICES        │ │ DATABASE & STORAGE    │ │ DIGITAL SIGNATURE       │
│  - Google Cloud Vision API│ │ - Supabase PostgreSQL │ │ - Documenso / DigiLocker│
│  - Gemini 2.5/Flash API   │ │ - Supabase Storage    │ │ - SHA-256 Hashing       │
│  - Tesseract.js (Offline) │ │ - Row-Level Security  │ │ - Sec 65B PDF Certs     │
└───────────────────────────┘ └───────────────────────┘ └─────────────────────────┘
```

### Key Design Invariant: Strict Separation of Extraction & Evaluation
* **Extraction (OCR / LLM)**: Produces structured but un-evaluated data with confidence scores.
* **Rule Engine**: Deterministic pure TypeScript functions. **No LLM touches pass/fail verdicts or penalty calculations.** This guarantees full legal auditability and repeatability required for court proceedings.
* **RAG Explanation (Gemini)**: Explains legal citations and rule text *after* a verdict is reached by the rule engine.

---

## 3. Technology Stack & Tools

### Frontend & Native Mobile
* **Framework**: React 18.3 + Vite 6 (TypeScript).
* **Native Mobile Runtime**: **Capacitor 8** (`@capacitor/core`, `@capacitor/camera`, `@capacitor/android`). Built as a native Android APK (`MANAK-Compliance.apk`).
* **Styling & UI**: Tailwind CSS 3.4, Lucide React Icons (`lucide-react`), Glassmorphism UI design system.
* **Offline Client Processing**: Tesseract.js 7.0 for client-side WASM OCR fallback; IndexedDB (`src/services/offlineStorage.ts`).
* **Report Generation**: `jspdf` + `html2canvas` for PDF rendering with embedded SHA-256 hashes.

### Backend & API
* **Runtime**: Node.js + Express 5.2 with `tsx` (TypeScript Execution).
* **Server Utilities**: `cors`, `dotenv`.
* **API Endpoints**: RESTful JSON API with payload limits configured up to 50MB for high-resolution base64 packaging uploads.

### Database, Auth & Cloud Infrastructure
* **Database**: **Supabase (PostgreSQL)** with relational schemas (`products`, `inspections`, `violations`, `evidence_images`, `reports`, `consumer_reports`).
* **Authentication**: Supabase Auth (Officer Email/Employee ID vs Consumer Phone OTP).
* **Storage**: Supabase Storage Buckets (`evidence/` for inspection images, `reports/` for signed PDFs).
* **Security**: Supabase Row-Level Security (RLS) policies isolating officer vs consumer access.

### AI & Computer Vision Integrations
* **Google Cloud Vision REST API**: `DOCUMENT_TEXT_DETECTION` (verbatim PDP text) + `LABEL_DETECTION` / `LOGO_DETECTION` (product classification & brand identification).
* **Google Gemini AI SDK**: `@google/genai` (Gemini 2.5 Flash / Vision) for multimodal label understanding and legal Q&A chat (`ComplianceChatScreen`).

### Codebase Intelligence & Knowledge Graph
* **Graphify Knowledge Graph**: Integrated Graphify AST engine (`graphify-out/`) parsing codebase relationships across 20+ components and services.

---

## 4. End-to-End System Pipeline

The MANAK audit pipeline operates in **4 distinct phases**:

```
Phase 1: Input Capture ──► Phase 2: Multimodal Extraction ──► Phase 3: Human Verification ──► Phase 4: Rule Engine & PDF Report
```

### Phase 1: Input & Data Capture
* **Field Mode**: Inspecting officer captures package label using device camera ([`CameraScanScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/CameraScanScreen.tsx)) with flashlight control and on-screen numeral height scale reference overlay.
* **E-Commerce Mode**: Officer enters product URL (Amazon / Flipkart) or uses extension payload ([`CheckUrlScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/CheckUrlScreen.tsx)).
* **Offline Mode**: If network connectivity drops, image is stored in IndexedDB ([`offlineStorage.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/offlineStorage.ts)) and processed via Tesseract.js client OCR for a provisional badge.

### Phase 2: Multimodal OCR & Entity Extraction
* Base64 image payload is dispatched to server endpoint `/api/extract`.
* **Primary Path**: Google Cloud Vision API (`TEXT_DETECTION`) extracts bounding boxes and text blocks.
* **Entity Parser ([`labelParser.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/labelParser.ts))**: Regex and natural language rules parse 9 statutory fields:
  1. Manufacturer Name, Address & PIN Code
  2. Generic Name of Commodity
  3. Net Quantity & Standard Unit (g, kg, ml, L, N)
  4. Maximum Retail Price (MRP) & Tax Disclaimers
  5. Month & Year of Manufacture / Packing
  6. Consumer Care Cell (Phone, Email, Address)
  7. Country of Origin (mandatory for imported goods)
  8. Unit Sale Price (USP)
  9. Numeral Height (mm)

### Phase 3: Human-in-the-Loop Review ([`ExtractedTextReviewScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/ExtractedTextReviewScreen.tsx))
* Crucial architectural step preventing raw OCR errors from affecting legal evaluation.
* Displays side-by-side view: **Verbatim OCR Text Stream** vs **Structured Declaration Form**.
* Officer can manually correct obscured, damaged, or misread text, or re-trigger parsing before executing the compliance evaluation.

### Phase 4: Deterministic Compliance Audit & Sec 65B PDF Generation
* **Rule Engine ([`ruleEngine.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/ruleEngine.ts))**:
  * Evaluates **Rule 6** (presence, correctness, and formatting of mandatory declarations).
  * Evaluates **Rule 7** (numeral & letter height requirements relative to net quantity bands).
  * Evaluates **Rule 32 / Sec 36** (calculates compounding fines: ₹2,000 to ₹25,000+ per violation).
* Generates SHA-256 cryptographic hash of evidence image + inspection metadata.
* Renders court-admissible PDF certified under **Section 65B of the Indian Evidence Act** ([`pdfReportGenerator.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/pdfReportGenerator.ts)).

---

## 5. Current Implementation Progress & Status

| Module / Feature | Status | Details / Implementation Location |
|---|---|---|
| **Dual Persona UI** | ✅ Completed | 21 screens implemented ([`OfficerDashboardScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/OfficerDashboardScreen.tsx), [`ConsumerDashboardScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/ConsumerDashboardScreen.tsx), etc.) |
| **Android Native APK** | ✅ Completed | Capacitor Android setup built & verified ([`MANAK-Compliance.apk`](file:///c:/Users/shett/Desktop/MANAK/MANAK-Compliance.apk)) |
| **Express Backend API** | ✅ Completed | Server running at [`server/index.ts`](file:///c:/Users/shett/Desktop/MANAK/server/index.ts) with `/api/extract`, `/api/evaluate`, `/api/url-check` |
| **Google Cloud Vision OCR** | ✅ Completed | REST API integration ([`googleVisionOcr.ts`](file:///c:/Users/shett/Desktop/MANAK/server/services/googleVisionOcr.ts)) |
| **Gemini Vision Extractor** | ✅ Completed | Multimodal fallback and legal Q&A chat ([`ocrService.ts`](file:///c:/Users/shett/Desktop/MANAK/server/services/ocrService.ts)) |
| **Regex Label Parser** | ✅ Completed | Structure extraction engine ([`labelParser.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/labelParser.ts)) |
| **Deterministic Rule Engine**| ✅ Completed | Rule 6, Rule 7 numeral height, and Rule 32 penalty engine ([`ruleEngine.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/ruleEngine.ts)) |
| **Human Review Interface** | ✅ Completed | [`ExtractedTextReviewScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/ExtractedTextReviewScreen.tsx) with full editing and re-parsing capability |
| **Supabase Integration** | ✅ Completed | Postgres persistence fallback & migration scripts ([`supabase/migrations/`](file:///c:/Users/shett/Desktop/MANAK/supabase/migrations)) |
| **Offline Sync Engine** | ✅ Completed | IndexedDB queue & background sync pipeline ([`offlineStorage.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/offlineStorage.ts)) |
| **E-Commerce Audit Engine** | ✅ Completed | Multi-platform DOM & image parser ([`ecommerceAuditService.ts`](file:///c:/Users/shett/Desktop/MANAK/server/services/ecommerceAuditService.ts)) |
| **PDF & Evidence Cert** | ✅ Completed | SHA-256 hash generation and PDF report exporter ([`pdfReportGenerator.ts`](file:///c:/Users/shett/Desktop/MANAK/src/services/pdfReportGenerator.ts)) |

---

## 6. Technical Limitations & Known Challenges

### 1. Rule 7 Numeral Height Measurement Constraints
* **Challenge**: Measuring physical numeral height in millimeters from a 2D camera photograph requires spatial calibration.
* **Current Mitigation**: The system looks for a standard physical reference object (e.g., standard coin or calibration scale overlay). In the absence of a verified reference object, `numeral_height_mm` is marked as `null` ("Unable to verify visually") rather than guessing, requiring manual officer input on the review screen.

### 2. Cylindrical, Curved & Metallic Surface OCR
* **Challenge**: Packaging on tin cans, flexible pouches, transparent bottles, or glossy surfaces often suffers from glare, distortion, or partial wrapping.
* **Current Mitigation**: Phase 3 ([`ExtractedTextReviewScreen.tsx`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens/ExtractedTextReviewScreen.tsx)) guarantees officer intervention to correct obscured fields before rule evaluation.

### 3. E-Commerce DOM Selector Drift
* **Challenge**: Major e-commerce platforms (Amazon India, Flipkart, Blinkit, Zepto) frequently update their HTML DOM structures, anti-bot mechanisms, and dynamic class names.
* **Current Mitigation**: Decoupled browser extension payload strategy where the client script extracts data/DOM and posts a structured payload directly to `/api/url-check`, backed up by screenshot Vision OCR extraction when DOM selectors fail.

### 4. Offline Client OCR Performance & Accuracy
* **Challenge**: Tesseract.js (WASM) running locally on low-end officer mobile devices is significantly slower and less accurate than cloud-based Google Vision / Gemini APIs.
* **Current Mitigation**: Offline scans produce a **"Provisional — Unsynced"** result badge. Once internet access is restored, the offline sync queue pushes raw images to cloud OCR for final verification.

### 5. eSign (Documenso / DigiLocker) API Credentials
* **Challenge**: Full cryptographic eSign binding for legal certificates requires sandbox credentials and integration with DigiLocker / Documenso government endpoints.
* **Current Mitigation**: Complete SHA-256 evidence hashing and DSC signature block rendering implemented in PDF generator, ready to hook into production API keys (`DOCUMENSO_API_KEY`).

---

## 7. Developer Quickstart & Repository Navigation

### Key Project Directories
* **Frontend Components**: [`src/components/screens/`](file:///c:/Users/shett/Desktop/MANAK/src/components/screens)
* **Client Logic & Rule Engine**: [`src/services/`](file:///c:/Users/shett/Desktop/MANAK/src/services)
* **Backend Express Server**: [`server/index.ts`](file:///c:/Users/shett/Desktop/MANAK/server/index.ts) & [`server/services/`](file:///c:/Users/shett/Desktop/MANAK/server/services)
* **Database Migrations**: [`supabase/migrations/`](file:///c:/Users/shett/Desktop/MANAK/supabase/migrations)
* **Knowledge Graph**: [`graphify-out/`](file:///c:/Users/shett/Desktop/MANAK/graphify-out)

### Commands
```bash
npm run dev        # Run React Vite frontend (port 3000)
npm run server     # Run Express TypeScript backend (port 5000)
npm run start      # Run concurrently both server & UI
npm run cap:live   # Run Capacitor live reload on connected Android device/emulator
```
