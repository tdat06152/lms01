import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type CreateLessonBody = {
  topicId?: string;
  title?: string;
  sortOrder?: number;
};

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  let body: CreateLessonBody;
  try {
    body = (await request.json()) as CreateLessonBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const topic_id = typeof body.topicId === "string" ? body.topicId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const sort_order = typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 0;

  if (!topic_id) return NextResponse.json({ error: "Missing topicId" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("grammar_lessons")
    .insert({ topic_id, title, sort_order })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

