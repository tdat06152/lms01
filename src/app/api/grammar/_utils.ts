import "server-only";

import { NextResponse } from "next/server";
import { getAccessState } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireEditorApi() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const access = await getAccessState(user);
  if (access.isExpired) {
    return { ok: false as const, response: NextResponse.json({ error: "Account expired" }, { status: 403 }) };
  }
  if (!access.isEditor) return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const, supabase, user };
}
