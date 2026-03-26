import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

type CreateTopicBody = {
  title?: string;
  description?: string | null;
  sortOrder?: number;
};

export async function POST(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  let body: CreateTopicBody;
  try {
    body = (await request.json()) as CreateTopicBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : null;
  const sort_order = typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 0;

  const { data, error } = await auth.supabase
    .from("grammar_topics")
    .insert({ title, description, sort_order })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

