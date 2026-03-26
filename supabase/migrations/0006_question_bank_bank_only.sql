-- Allow bank-only questions (no lesson) and restrict RLS so normal users can't read them.

alter table public.questions
  alter column lesson_id drop not null;

-- Questions/options read:
-- - Editors (admin/member) can read everything (including bank-only lesson_id is null)
-- - Normal active users can only read lesson questions
drop policy if exists "questions read" on public.questions;
create policy "questions read"
on public.questions for select
to authenticated
using (public.is_editor() or (public.is_active() and lesson_id is not null));

drop policy if exists "options read" on public.options;
create policy "options read"
on public.options for select
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and (public.is_editor() or (public.is_active() and q.lesson_id is not null))
  )
);

