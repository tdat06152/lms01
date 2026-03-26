import Link from "next/link";
import { requireActiveUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PracticePlayer, type PracticeQuestion } from "@/app/grammar/_components/PracticePlayer";

type QuestionRow = {
  id: string;
  prompt: string;
  explanation: string | null;
  translation: string | null;
  options: { id: string; label: string | null; content: string; is_correct: boolean }[];
};

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function GrammarRandomPracticePage() {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, explanation, translation, options(id, label, content, is_correct)")
    .limit(80);
  if (error) throw error;

  const pool = (data ?? []) as QuestionRow[];
  shuffleInPlace(pool);
  const picked = pool.slice(0, 10).map<PracticeQuestion>((q) => ({
    id: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    translation: q.translation,
    options: q.options ?? []
  }));

  return (
    <main className="grammarContainer">
      <div className="gCrumbs">
        <Link className="gCrumbLink" href="/grammar">
          ← Grammar
        </Link>
      </div>

      <div className="gPanel">
        <div className="gPanelInner">
          <div className="gSectionTitle" style={{ margin: 0 }}>
            Luyện tập ngẫu nhiên (10 câu)
          </div>
          <div style={{ height: 12 }} />
          <PracticePlayer questions={picked} />
        </div>
      </div>
    </main>
  );
}
