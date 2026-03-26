import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type OptionInput = { label?: string | null; content?: string; isCorrect?: boolean };

type CreateQuestionBody = {
  lessonId?: string;
  prompt?: string;
  explanation?: string | null;
  translation?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  bankTopic?: string | null;
  options?: OptionInput[];
};

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  let body: CreateQuestionBody;
  try {
    body = (await request.json()) as CreateQuestionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lesson_id = typeof body.lessonId === "string" ? body.lessonId : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const explanation = typeof body.explanation === "string" ? body.explanation : null;
  const translation = typeof body.translation === "string" ? body.translation : null;
  const difficulty =
    body.difficulty === "easy" || body.difficulty === "medium" || body.difficulty === "hard" ? body.difficulty : "easy";
  const bank_topic =
    body.bankTopic === null
      ? null
      : typeof body.bankTopic === "string" && body.bankTopic.trim()
        ? body.bankTopic.trim()
        : null;
  const options = Array.isArray(body.options) ? body.options : [];

  if (!lesson_id) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  if (options.length < 2) return NextResponse.json({ error: "Need at least 2 options" }, { status: 400 });

  const correctCount = options.filter((o) => o?.isCorrect).length;
  if (correctCount !== 1) return NextResponse.json({ error: "Must have exactly 1 correct option" }, { status: 400 });

  const { data: q, error: qError } = await auth.supabase
    .from("questions")
    .insert({ lesson_id, prompt, explanation, translation, difficulty, bank_topic })
    .select("id")
    .single();
  if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });

  const rows = options.map((o, i) => ({
    question_id: q.id,
    label: typeof o.label === "string" ? o.label : String.fromCharCode(65 + i),
    content: String(o.content ?? "").trim(),
    is_correct: !!o.isCorrect
  }));

  const { error: oError } = await auth.supabase.from("options").insert(rows);
  if (oError) return NextResponse.json({ error: oError.message }, { status: 400 });

  return NextResponse.json({ id: q.id });
}
