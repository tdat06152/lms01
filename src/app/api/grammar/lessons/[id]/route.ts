import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type UpdateLessonBody = {
  title?: string;
  sortOrder?: number;
  contentHtml?: string | null;
};

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: UpdateLessonBody;
  try {
    body = (await request.json()) as UpdateLessonBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) update.sort_order = Math.trunc(body.sortOrder);
  if (typeof body.contentHtml === "string") update.content_html = body.contentHtml;
  if (body.contentHtml === null) update.content_html = null;

  const { error } = await auth.supabase.from("grammar_lessons").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await auth.supabase.from("grammar_lessons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

