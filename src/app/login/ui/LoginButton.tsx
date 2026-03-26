"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginButton({
  label = "Đăng nhập bằng Google"
}: {
  label?: string;
}) {
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function signIn() {
    setError(null);
    setIsPending(true);

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin ? `${origin}/auth/callback` : undefined,
        skipBrowserRedirect: true
      }
    });

    if (authError) {
      setError(authError.message);
      setIsPending(false);
      return;
    }

    if (!data.url) {
      setError("Supabase không trả về URL đăng nhập Google.");
      setIsPending(false);
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div>
      <button className="btn" type="button" onClick={signIn} disabled={isPending}>
        {isPending ? "Đang chuyển đến Google..." : label}
      </button>
      {error ? (
        <p className="muted" style={{ marginTop: 10, color: "var(--danger, #b42318)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
