"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginButton({
  mode = "login",
  label = "Đăng nhập bằng Google"
}: {
  mode?: "login" | "signup";
  label?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  async function signIn() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin ? `${origin}/auth/callback?mode=${mode}` : undefined
      }
    });
  }

  return (
    <button className="btn" type="button" onClick={signIn}>
      {label}
    </button>
  );
}
