import { requireEditor } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddBankQuestionButton } from "@/app/question-bank/_components/AddBankQuestionButton";
import { QuestionBankClient } from "@/app/question-bank/_components/QuestionBankClient";

type QuestionRow = {
  id: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  bank_topic: string | null;
  created_at: string;
  grammar_lessons:
    | Array<{
        id: string;
        title: string;
        topic_id: string;
        grammar_topics: Array<{ id: string; title: string }> | null;
      }>
    | null;
};

export default async function QuestionBankPage() {
  await requireEditor();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, prompt, difficulty, bank_topic, created_at, grammar_lessons(id, title, topic_id, grammar_topics(id, title))"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const questions = ((data ?? []) as unknown) as QuestionRow[];
  const existingTopics = Array.from(new Set(questions.map((q) => q.bank_topic).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b)
  );

  const items = questions.map((q) => {
    const lesson = q.grammar_lessons?.[0] ?? null;
    const topic = lesson?.grammar_topics?.[0] ?? null;
    const lessonLabel = lesson ? `${topic ? `${topic.title} → ` : ""}${lesson.title}` : null;
    return {
      id: q.id,
      prompt: q.prompt,
      difficulty: q.difficulty,
      bank_topic: q.bank_topic,
      created_at: q.created_at,
      lessonLabel
    };
  });

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>Ngân hàng câu hỏi</h1>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              Hiển thị 200 câu gần nhất. (MVP)
            </p>
          </div>
          <div className="row">
            <AddBankQuestionButton existingTopics={existingTopics} />
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ padding: 14 }}>
        <QuestionBankClient questions={items} existingTopics={existingTopics} />
      </div>
    </main>
  );
}
