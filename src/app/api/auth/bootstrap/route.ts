import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { setAuthzCookie, type AccessProfile } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (serverEnv.supabaseServiceRoleKey) {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").update({ email: user.email }).eq("id", user.id);

    if (serverEnv.adminEmail && user.email.toLowerCase() === serverEnv.adminEmail.toLowerCase()) {
      await admin
        .from("profiles")
        .update({ role: "admin", is_pro: true, expires_at: null, email: user.email })
        .eq("id", user.id);
    }

    const { data: profile } = await admin.from("profiles").select("role, is_pro, expires_at").eq("id", user.id).maybeSingle();
    setAuthzCookie(response, user.id, (profile as AccessProfile | null) ?? null, {
      fixedAdmin: !!serverEnv.adminEmail && user.email.toLowerCase() === serverEnv.adminEmail.toLowerCase()
    });
  }

  return response;
}
