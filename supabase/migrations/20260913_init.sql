-- ========================================================
-- MANAK — Legal Metrology Compliance Checker Schema Migration
-- Standard: Legal Metrology (Packaged Commodities) Rules, 2011
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users table (linked to Supabase Auth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  role text not null check (role in ('officer', 'consumer')),
  auth_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  employee_id text,
  department text default 'Legal Metrology Department',
  created_at timestamptz default now()
);

-- 2. Products table
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  source_type text not null check (source_type in ('store', 'ecommerce')),
  ecommerce_platform text check (ecommerce_platform in ('amazon', 'flipkart', 'blinkit', 'zepto', null)),
  ecommerce_url text,
  title text not null,
  brand text,
  category text,
  manufacturer_raw text,
  barcode text,
  image_url text,
  created_at timestamptz default now()
);

-- 3. Inspections table
create table if not exists public.inspections (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  performed_by uuid references public.users(id) on delete set null,
  mode text not null check (mode in ('scan', 'url_check')),
  status text not null check (status in ('provisional', 'verified', 'failed')) default 'verified',
  geo_lat numeric,
  geo_lng numeric,
  address text,
  device_timestamp timestamptz default now(),
  server_timestamp timestamptz default now(),
  evidence_image text,
  evidence_hash text,
  extraction_result jsonb not null default '{}'::jsonb,
  compliance_result jsonb not null default '{}'::jsonb,
  is_compliant boolean default false,
  total_violations integer default 0,
  total_penalty numeric default 0,
  is_signed boolean default false,
  report_id text,
  synced_at timestamptz default now()
);

-- 4. Violations table
create table if not exists public.violations (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid references public.inspections(id) on delete cascade,
  rule_id text not null,
  requirement_name text,
  severity text not null check (severity in ('critical', 'major', 'minor', 'info')),
  status text not null check (status in ('missing', 'incorrect', 'partial', 'violation', 'unverifiable')),
  expected text,
  found text,
  explanation text,
  rule_citation text,
  penalty numeric default 2000,
  created_at timestamptz default now()
);

-- 5. Evidence Images metadata table
create table if not exists public.evidence_images (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid references public.inspections(id) on delete cascade,
  storage_path text not null,
  captured_at timestamptz default now(),
  is_primary boolean default false
);

-- 6. Signed Reports table
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid references public.inspections(id) on delete cascade,
  pdf_storage_path text,
  signed boolean default false,
  signature_provider text default 'documenso',
  certificate_id text,
  signed_at timestamptz,
  signed_by uuid references public.users(id) on delete set null
);

-- 7. Consumer Reports table
create table if not exists public.consumer_reports (
  id uuid primary key default uuid_generate_v4(),
  reference_id text not null unique,
  inspection_id uuid references public.inspections(id) on delete cascade,
  submitted_by uuid references public.users(id) on delete set null,
  product_name text not null,
  brand text,
  product_image text,
  violations_summary text[] default '{}',
  consumer_note text,
  status text not null check (status in ('submitted', 'officer_assigned', 'under_review', 'action_taken', 'dismissed')) default 'submitted',
  assigned_officer text,
  officer_remark text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 8. Compliance Rules lookup table (Legal Metrology 2011 Rules)
create table if not exists public.compliance_rules (
  rule_id text primary key,
  rule_source text not null,
  category text not null,
  requirement_name text not null,
  check_type text not null check (check_type in ('presence', 'format', 'numeric_range', 'custom')),
  severity_default text not null check (severity_default in ('critical', 'major', 'minor')),
  penalty_amount numeric default 2000,
  legal_citation text not null,
  explanation_template text
);

-- Seed master Legal Metrology 2011 Rules
insert into public.compliance_rules (rule_id, rule_source, category, requirement_name, check_type, severity_default, penalty_amount, legal_citation)
values
  ('rule_6_1_a_mfg_details', 'Rules 2011, Rule 6(1)(a)', 'Manufacturer Identity', 'Name & Complete Address of Manufacturer', 'presence', 'critical', 2000, 'Rule 6(1)(a) Legal Metrology (Packaged Commodities) Rules 2011'),
  ('rule_6_1_b_generic_name', 'Rules 2011, Rule 6(1)(b)', 'Product Identity', 'Common or Generic Commodity Name', 'presence', 'major', 2000, 'Rule 6(1)(b) Legal Metrology (Packaged Commodities) Rules 2011'),
  ('rule_6_1_c_net_quantity', 'Rules 2011, Rule 6(1)(c)', 'Quantity Declaration', 'Net Quantity in Standard Metric Units', 'presence', 'critical', 2000, 'Rule 6(1)(c) & First Schedule metric units'),
  ('rule_6_1_d_mfg_date', 'Rules 2011, Rule 6(1)(d)', 'Date Declaration', 'Month & Year of Manufacture / Packing', 'presence', 'major', 2000, 'Rule 6(1)(d) Legal Metrology (Packaged Commodities) Rules 2011'),
  ('rule_6_1_e_mrp_format', 'Rules 2011, Rule 6(1)(e)', 'Pricing Declaration', 'MRP Inclusive of All Taxes Format', 'format', 'critical', 2000, 'Rule 6(1)(e) & Rule 2(m) Gazette Notification'),
  ('rule_6_2_consumer_care', 'Rules 2011, Rule 6(2)', 'Consumer Redressal', 'Consumer Care Cell Phone / Email', 'presence', 'minor', 2000, 'Rule 6(2) Statutory Consumer Redressal Mandate'),
  ('rule_6_10_country_origin', 'Rules 2011, Rule 6(10)', 'Origin Declaration', 'Country of Origin for E-Commerce / Imports', 'presence', 'major', 2000, 'Rule 6(10) & E-Commerce Rules 2020'),
  ('rule_7_numeral_height', 'Rules 2011, Rule 7(2)', 'Font Readability', 'Minimum Numeral Height (Table I/II)', 'numeric_range', 'major', 2000, 'Rule 7(2) Table I & II Height Specifications')
on conflict (rule_id) do nothing;

-- ========================================================
-- Row Level Security (RLS) Policies
-- ========================================================

alter table public.users enable row level security;
alter table public.inspections enable row level security;
alter table public.consumer_reports enable row level security;
alter table public.compliance_rules enable row level security;

-- Public read for rules
create policy "Allow public read of compliance rules"
  on public.compliance_rules for select
  using (true);

-- Allow authenticated read/write on inspections & reports
create policy "Allow authenticated users to read inspections"
  on public.inspections for select
  using (true);

create policy "Allow authenticated users to insert inspections"
  on public.inspections for insert
  with check (true);

create policy "Allow authenticated users to read consumer reports"
  on public.consumer_reports for select
  using (true);

create policy "Allow authenticated users to insert consumer reports"
  on public.consumer_reports for insert
  with check (true);
