import { NextRequest, NextResponse } from "next/server";
import { requireEditorApi } from "@/app/api/grammar/_utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireEditorApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const difficulty = searchParams.get("difficulty");
  const bankTopic = (searchParams.get("bankTopic") ?? "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "50") || 50, 1), 200);

  let query = auth.supabase
    .from("questions")
    .select("id, prompt, difficulty, bank_topic, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    query = query.eq("difficulty", difficulty);
  }

  if (bankTopic) query = query.eq("bank_topic", bankTopic);

  if (q) {
    // basic search: prompt contains q
    query = query.ilike("prompt", `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ items: data ?? [] });
}

