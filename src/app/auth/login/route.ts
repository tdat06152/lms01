import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("OAuth URL was not returned")}`);
  }

  return NextResponse.redirect(data.url);
}
