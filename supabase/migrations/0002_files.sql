-- File metadata for external object storage (R2/S3/GCS)

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  object_key text not null,
  content_type text not null,
  size_bytes bigint not null,
  public_url text null,
  created_at timestamptz not null default now(),
  unique (bucket, object_key)
);

create index if not exists idx_files_user on public.files (user_id);

alter table public.files enable row level security;

drop policy if exists "files read own" on public.files;
create policy "files read own"
on public.files for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "files insert own" on public.files;
create policy "files insert own"
on public.files for insert
to authenticated
with check (user_id = auth.uid());

