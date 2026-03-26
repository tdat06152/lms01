import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type Body = { lessonId?: string; questionId?: string };

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  if (!questionId) return NextResponse.json({ error: "Missing questionId" }, { status: 400 });

  const { data: q, error: qError } = await auth.supabase
    .from("questions")
    .select("id, prompt, explanation, translation, difficulty, bank_topic, options(id, label, content, is_correct)")
    .eq("id", questionId)
    .maybeSingle();

  if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: inserted, error: insError } = await auth.supabase
    .from("questions")
    .insert({
      lesson_id: lessonId,
      prompt: q.prompt,
      explanation: q.explanation,
      translation: q.translation,
      difficulty: q.difficulty,
      bank_topic: q.bank_topic
    })
    .select("id")
    .single();
  if (insError) return NextResponse.json({ error: insError.message }, { status: 400 });

  const options = (q.options ?? []) as { label: string | null; content: string; is_correct: boolean }[];
  if (options.length) {
    const rows = options.map((o) => ({
      question_id: inserted.id,
      label: o.label,
      content: o.content,
      is_correct: o.is_correct
    }));
    const { error: optError } = await auth.supabase.from("options").insert(rows);
    if (optError) return NextResponse.json({ error: optError.message }, { status: 400 });
  }

  return NextResponse.json({ id: inserted.id });
}

