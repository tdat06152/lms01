"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginButton({
  label = "Đăng nhập bằng Google"
}: {
  label?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  async function signIn() {
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin ? `${origin}/auth/callback` : undefined
      }
    });
  }

  return (
    <button className="btn" type="button" onClick={signIn}>
      {label}
    </button>
  );
}
