-- Roles/entitlements + email field for admin management

-- Extend profiles schema
alter table public.profiles
  add column if not exists email text,
  add column if not exists is_pro boolean not null default false;

-- Backfill email for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

-- Expand role check constraint to allow member
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin', 'member'));

-- Ensure profile row stores user email on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Active subscription helper
create or replace function public.is_active()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

-- Admin check (role-based)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

-- Editor check (admin/member)
create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'member')
      and (p.expires_at is null or p.expires_at > now())
  );
$$;

-- Profiles: allow admin to manage all profiles
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Content reads: only active users
drop policy if exists "topics read" on public.grammar_topics;
create policy "topics read"
on public.grammar_topics for select
to authenticated
using (public.is_active());

drop policy if exists "lessons read" on public.grammar_lessons;
create policy "lessons read"
on public.grammar_lessons for select
to authenticated
using (public.is_active());

drop policy if exists "questions read" on public.questions;
create policy "questions read"
on public.questions for select
to authenticated
using (public.is_active());

drop policy if exists "options read" on public.options;
create policy "options read"
on public.options for select
to authenticated
using (public.is_active());

-- Content writes: editors (admin/member)
drop policy if exists "topics admin write" on public.grammar_topics;
drop policy if exists "lessons admin write" on public.grammar_lessons;
drop policy if exists "questions admin write" on public.questions;
drop policy if exists "options admin write" on public.options;

create policy "topics editor write"
on public.grammar_topics for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "lessons editor write"
on public.grammar_lessons for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "questions editor write"
on public.questions for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

create policy "options editor write"
on public.options for all
to authenticated
using (public.is_editor())
with check (public.is_editor());

-- Attempts/Bookmarks/Files: require active subscription as well
do $$
begin
  if to_regclass('public.attempts') is not null then
    execute 'drop policy if exists "attempts read own" on public.attempts';
    execute 'create policy "attempts read own" on public.attempts for select to authenticated using (public.is_active() and user_id = auth.uid())';

    execute 'drop policy if exists "attempts upsert own" on public.attempts';
    execute 'create policy "attempts upsert own" on public.attempts for insert to authenticated with check (public.is_active() and user_id = auth.uid())';

    execute 'drop policy if exists "attempts update own" on public.attempts';
    execute 'create policy "attempts update own" on public.attempts for update to authenticated using (public.is_active() and user_id = auth.uid()) with check (public.is_active() and user_id = auth.uid())';
  end if;

  if to_regclass('public.bookmarks') is not null then
    execute 'drop policy if exists "bookmarks read own" on public.bookmarks';
    execute 'create policy "bookmarks read own" on public.bookmarks for select to authenticated using (public.is_active() and user_id = auth.uid())';

    execute 'drop policy if exists "bookmarks write own" on public.bookmarks';
    execute 'create policy "bookmarks write own" on public.bookmarks for insert to authenticated with check (public.is_active() and user_id = auth.uid())';

    execute 'drop policy if exists "bookmarks delete own" on public.bookmarks';
    execute 'create policy "bookmarks delete own" on public.bookmarks for delete to authenticated using (public.is_active() and user_id = auth.uid())';
  end if;

  if to_regclass('public.files') is not null then
    execute 'drop policy if exists "files read own" on public.files';
    execute 'create policy "files read own" on public.files for select to authenticated using (public.is_active() and user_id = auth.uid())';

    execute 'drop policy if exists "files insert own" on public.files';
    execute 'create policy "files insert own" on public.files for insert to authenticated with check (public.is_active() and user_id = auth.uid())';
  end if;
end $$;
