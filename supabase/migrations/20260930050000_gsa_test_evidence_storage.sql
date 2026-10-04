-- GSA Test Lab screenshot evidence storage.
-- Binary evidence stays outside Git and remains private by default.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gsa-test-evidence',
  'gsa-test-evidence',
  false,
  5242880,
  array['image/png']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gsa_test_evidence_insert_own_prefix" on storage.objects;
create policy "gsa_test_evidence_insert_own_prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gsa-test-evidence'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "gsa_test_evidence_select_own_prefix" on storage.objects;
create policy "gsa_test_evidence_select_own_prefix"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'gsa-test-evidence'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);

drop policy if exists "gsa_test_evidence_delete_own_prefix" on storage.objects;
create policy "gsa_test_evidence_delete_own_prefix"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gsa-test-evidence'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
