import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type OptionInput = { id?: string; label?: string | null; content?: string; isCorrect?: boolean };

type UpdateQuestionBody = {
  prompt?: string;
  explanation?: string | null;
  translation?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  bankTopic?: string | null;
  options?: OptionInput[];
};

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: UpdateQuestionBody;
  try {
    body = (await request.json()) as UpdateQuestionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.prompt === "string") update.prompt = body.prompt.trim();
  if (typeof body.explanation === "string") update.explanation = body.explanation;
  if (body.explanation === null) update.explanation = null;
  if (typeof body.translation === "string") update.translation = body.translation;
  if (body.translation === null) update.translation = null;
  if (body.difficulty === "easy" || body.difficulty === "medium" || body.difficulty === "hard") {
    update.difficulty = body.difficulty;
  }
  if (body.bankTopic === null) update.bank_topic = null;
  if (typeof body.bankTopic === "string") update.bank_topic = body.bankTopic.trim() || null;

  const { error: qError } = await auth.supabase.from("questions").update(update).eq("id", id);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });

  if (Array.isArray(body.options)) {
    const options = body.options;
    const correctCount = options.filter((o) => o?.isCorrect).length;
    if (correctCount !== 1) return NextResponse.json({ error: "Must have exactly 1 correct option" }, { status: 400 });

    const { error: delError } = await auth.supabase.from("options").delete().eq("question_id", id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

    const rows = options.map((o, i) => ({
      question_id: id,
      label: typeof o.label === "string" ? o.label : String.fromCharCode(65 + i),
      content: String(o.content ?? "").trim(),
      is_correct: !!o.isCorrect
    }));
    const { error: insError } = await auth.supabase.from("options").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await auth.supabase.from("questions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
