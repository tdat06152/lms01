-- Store lesson content as HTML for the "Bài học" tab

alter table public.grammar_lessons
  add column if not exists content_html text;

