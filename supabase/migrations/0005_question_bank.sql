-- "Ngân hàng câu hỏi": store metadata on questions for reuse (tests, sets, etc.)
-- Keep using `public.questions` as the canonical question bank, with optional grouping metadata.

alter table public.questions
  add column if not exists difficulty text not null default 'easy',
  add column if not exists bank_topic text null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'questions_difficulty_check'
      and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions drop constraint questions_difficulty_check;
  end if;
end $$;

alter table public.questions
  add constraint questions_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));

create index if not exists idx_questions_difficulty on public.questions (difficulty);
create index if not exists idx_questions_bank_topic on public.questions (bank_topic);

