# MANAK — API Keys & Backend Environment Setup Guide

This document outlines all the external services, API keys, and environment variables required to run the full-fledged MANAK Legal Metrology compliance backend and frontend, along with step-by-step instructions to obtain each credential.

---

## 1. Summary of Required Credentials

Create a `.env` file in the root of your project directory (`c:\Users\shett\Desktop\MANAK\.env`) with the following environment variables:

```env
# ==========================================
# 1. SUPABASE BACKEND & DATABASE
# ==========================================
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ==========================================
# 2. GOOGLE GEMINI VISION OCR & RAG
# ==========================================
GEMINI_API_KEY=your-google-gemini-api-key

# ==========================================
# 3. DIGITAL SIGNATURE (DOCUMENSO / DIGILOCKER)
# ==========================================
DOCUMENSO_API_KEY=your-documenso-api-key
DOCUMENSO_HOST=https://app.documenso.com

# ==========================================
# 4. APP & SERVER CONFIGURATION
# ==========================================
PORT=5000
VITE_API_BASE_URL=http://localhost:5000
NODE_ENV=development
```

---

## 2. Step-by-Step Instructions to Obtain Each Key

### A. Supabase Credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
Supabase provides the Postgres Database, Authentication (Officer login & Consumer OTP), Storage buckets (for evidence photos & signed PDFs), and Row-Level Security (RLS).

1. **Sign Up / Log In:** Go to [https://supabase.com](https://supabase.com) and click **Start your project** (log in with GitHub or email).
2. **Create New Project:**
   - Click **New Project**.
   - Set Organization name and Project Name (e.g. `MANAK-Legal-Metrology-Pilot`).
   - Set a strong Database Password.
   - Choose Region: **South Asia (Mumbai) - ap-south-1** for lowest latency in India.
   - Select Pricing Tier: **Free Tier**.
   - Click **Create new project**.
3. **Copy API Keys & URL:**
   - In your Supabase Dashboard, navigate to **Project Settings** (gear icon at the bottom left) -> **API**.
   - Copy **Project URL** -> set as `VITE_SUPABASE_URL`.
   - Copy `anon` `public` API Key -> set as `VITE_SUPABASE_ANON_KEY`.
   - Copy `service_role` `secret` API Key -> set as `SUPABASE_SERVICE_ROLE_KEY`.

---

### B. Google Gemini API Key (`GEMINI_API_KEY`)
Gemini Vision API handles high-accuracy optical character recognition (OCR), entity extraction from packaging images, and RAG-based legal clause explanations.

1. **Access Google AI Studio:** Go to [https://aistudio.google.com](https://aistudio.google.com).
2. **Log In:** Sign in with your Google account.
3. **Generate Key:**
   - Click the **Get API key** button on the left sidebar.
   - Click **Create API key**.
   - Select an existing Google Cloud project or click **Create API key in new project**.
   - Copy the generated string -> set as `GEMINI_API_KEY`.

---

### C. Digital Signature Token (`DOCUMENSO_API_KEY`)
Documenso (or DigiLocker eSign) generates audit-ready digitally signed inspection PDF certificates with cryptographic proof for legal admissibility under IT Act 2000 & Evidence Act §65B.

1. **Sign Up / Self-Host:** Go to [https://app.documenso.com](https://app.documenso.com) (or self-host via Docker).
2. **Create Account:** Register your officer / department organization account.
3. **Generate API Token:**
   - Navigate to **Account Settings** -> **API Keys**.
   - Click **Create New Token**.
   - Name it `MANAK Enforcement App`.
   - Copy the generated API token -> set as `DOCUMENSO_API_KEY`.

*(Alternative for DigiLocker eSign: Register your government agency on [partners.digilocker.gov.in](https://partners.digilocker.gov.in/) to obtain `DIGILOCKER_CLIENT_ID` and `DIGILOCKER_CLIENT_SECRET`).*

---

## 3. Database & Storage Initialization Checklist

Once you have set up Supabase, run the database migrations and create storage buckets:

1. **Database Tables:** Execute SQL migration script ([`supabase/migrations/20260913_init.sql`](file:///c:/Users/shett/Desktop/MANAK/supabase/migrations/20260913_init.sql)) in Supabase SQL Editor.
2. **Storage Buckets:** In Supabase Dashboard -> **Storage**:
   - Create bucket `evidence` (Public: **No**).
   - Create bucket `reports` (Public: **No**).
3. **Storage RLS Policies:** Run the storage RLS migration script ([`supabase/migrations/20260913_storage_rls.sql`](file:///c:/Users/shett/Desktop/MANAK/supabase/migrations/20260913_storage_rls.sql)) in the **SQL Editor**, or add policies under **Storage -> Policies**.

---

## 4. Verification

After saving `.env`, test connectivity:
```bash
# Start full backend & frontend dev environment
npm run dev
```
The application will automatically detect Supabase and Gemini credentials, switching from local fallback to cloud backend mode.
