-- ========================================================
-- MANAK — Supabase Storage Bucket RLS Security Policies
-- Buckets: 'evidence' (packaging photos) and 'reports' (signed PDFs)
-- Note: RLS is already enabled on storage.objects by Supabase.
-- ========================================================

-- --------------------------------------------------------
-- POLICIES FOR 'evidence' BUCKET
-- --------------------------------------------------------

-- Drop existing policies if re-running
drop policy if exists "Allow upload to evidence bucket" on storage.objects;
drop policy if exists "Allow read from evidence bucket" on storage.objects;

-- Allow upload of evidence photos
create policy "Allow upload to evidence bucket"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'evidence');

-- Allow reading/downloading evidence photos
create policy "Allow read from evidence bucket"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'evidence');

-- --------------------------------------------------------
-- POLICIES FOR 'reports' BUCKET
-- --------------------------------------------------------

-- Drop existing policies if re-running
drop policy if exists "Allow upload to reports bucket" on storage.objects;
drop policy if exists "Allow read from reports bucket" on storage.objects;

-- Allow upload of signed PDF reports
create policy "Allow upload to reports bucket"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'reports');

-- Allow reading/downloading signed PDF reports
create policy "Allow read from reports bucket"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'reports');
