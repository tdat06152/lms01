-- Core tables for LMS Grammar MVP

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.grammar_topics (id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.grammar_lessons (id) on delete cascade,
  prompt text not null,
  explanation text null,
  translation text null,
  vocab jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text null,
  content text not null,
  is_correct boolean not null default false
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_id uuid null references public.options (id) on delete set null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists idx_lessons_topic on public.grammar_lessons (topic_id);
create index if not exists idx_questions_lesson on public.questions (lesson_id);
create index if not exists idx_options_question on public.options (question_id);
create index if not exists idx_attempts_user on public.attempts (user_id);

-- Auto create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper: admin check
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
  );
$$;

alter table public.profiles enable row level security;
alter table public.grammar_topics enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.attempts enable row level security;
alter table public.bookmarks enable row level security;

-- Read: authenticated users can read learning content
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "topics read" on public.grammar_topics;
create policy "topics read"
on public.grammar_topics for select
to authenticated
using (true);

drop policy if exists "lessons read" on public.grammar_lessons;
create policy "lessons read"
on public.grammar_lessons for select
to authenticated
using (true);

drop policy if exists "questions read" on public.questions;
create policy "questions read"
on public.questions for select
to authenticated
using (true);

drop policy if exists "options read" on public.options;
create policy "options read"
on public.options for select
to authenticated
using (true);

-- Admin write learning content
drop policy if exists "topics admin write" on public.grammar_topics;
create policy "topics admin write"
on public.grammar_topics for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lessons admin write" on public.grammar_lessons;
create policy "lessons admin write"
on public.grammar_lessons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questions admin write" on public.questions;
create policy "questions admin write"
on public.questions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "options admin write" on public.options;
create policy "options admin write"
on public.options for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Attempts: user owns their data
drop policy if exists "attempts read own" on public.attempts;
create policy "attempts read own"
on public.attempts for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "attempts upsert own" on public.attempts;
create policy "attempts upsert own"
on public.attempts for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "attempts update own" on public.attempts;
create policy "attempts update own"
on public.attempts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Bookmarks: user owns their data
drop policy if exists "bookmarks read own" on public.bookmarks;
create policy "bookmarks read own"
on public.bookmarks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "bookmarks write own" on public.bookmarks;
create policy "bookmarks write own"
on public.bookmarks for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bookmarks delete own" on public.bookmarks;
create policy "bookmarks delete own"
on public.bookmarks for delete
to authenticated
using (user_id = auth.uid());

