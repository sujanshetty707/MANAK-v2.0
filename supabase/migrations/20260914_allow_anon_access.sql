-- MANAK — Enable Anon RLS Policies for Mobile Direct Access
-- Allows anonymous client apps with VITE_SUPABASE_ANON_KEY to read/insert products, inspections, violations, and consumer reports.

-- 1. Enable RLS on products
alter table public.products enable row level security;

create policy "Allow anon read of products"
  on public.products for select
  using (true);

create policy "Allow anon insert of products"
  on public.products for insert
  with check (true);

create policy "Allow anon update of products"
  on public.products for update
  using (true);

-- 2. Inspections policies for anon
create policy "Allow anon read of inspections"
  on public.inspections for select
  using (true);

create policy "Allow anon insert of inspections"
  on public.inspections for insert
  with check (true);

-- 3. Violations policies for anon
alter table public.violations enable row level security;

create policy "Allow anon read of violations"
  on public.violations for select
  using (true);

create policy "Allow anon insert of violations"
  on public.violations for insert
  with check (true);

-- 4. Consumer Reports policies for anon
create policy "Allow anon read of consumer reports"
  on public.consumer_reports for select
  using (true);

create policy "Allow anon insert of consumer reports"
  on public.consumer_reports for insert
  with check (true);
