import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function requireEditorApi() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false as const, response: NextResponse.json({ error: "Profile lookup failed" }, { status: 500 }) };

  if (profile?.expires_at && isExpired(profile.expires_at)) {
    return { ok: false as const, response: NextResponse.json({ error: "Account expired" }, { status: 403 }) };
  }

  const isEditor = profile?.role === "admin" || profile?.role === "member";

  if (!isEditor) return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const, supabase, user };
}
