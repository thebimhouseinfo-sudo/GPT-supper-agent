-- CP6 EvidenceBundle manifest metadata.
-- Screenshot binaries remain in private Supabase Storage. The exact manifest
-- bytes live in Postgres so the existing image/png-only bucket does not need
-- schema-internal bucket mutation.

create table if not exists public.gsa_evidence_bundles (
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_bundle_id text not null,
  manifest_json text not null,
  manifest_sha256 text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, evidence_bundle_id),
  constraint gsa_evidence_bundle_id_sha256
    check (evidence_bundle_id ~ '^[0-9a-f]{64}$'),
  constraint gsa_evidence_manifest_sha256
    check (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  constraint gsa_evidence_manifest_size
    check (octet_length(manifest_json) between 2 and 262144)
);

alter table public.gsa_evidence_bundles enable row level security;

revoke all on table public.gsa_evidence_bundles from anon;
grant select, insert, delete on table public.gsa_evidence_bundles to authenticated;
grant select, insert, delete on table public.gsa_evidence_bundles to service_role;

drop policy if exists "gsa_evidence_bundle_insert_own" on public.gsa_evidence_bundles;
create policy "gsa_evidence_bundle_insert_own"
on public.gsa_evidence_bundles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "gsa_evidence_bundle_select_own" on public.gsa_evidence_bundles;
create policy "gsa_evidence_bundle_select_own"
on public.gsa_evidence_bundles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "gsa_evidence_bundle_delete_own" on public.gsa_evidence_bundles;
create policy "gsa_evidence_bundle_delete_own"
on public.gsa_evidence_bundles
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Intentionally no UPDATE policy/grant. Evidence manifests are append-only.
