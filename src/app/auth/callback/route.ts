import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { setAuthzCookie, type AccessProfile } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const response = NextResponse.redirect(`${origin}/`);
  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.exchangeCodeForSession(code);

  // Bootstrap: ensure the configured ADMIN_EMAIL always has admin role.
  // Also keep profiles.email in sync for display in admin UI.
  if (serverEnv.supabaseServiceRoleKey) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user?.id && user.email) {
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
        fixedAdmin: !!serverEnv.adminEmail && user.email.toLowerCase() === serverEnv.adminEmail.toLowerCase(),
        secure: request.nextUrl.protocol === "https:"
      });
    }
  }

  return response;
}
