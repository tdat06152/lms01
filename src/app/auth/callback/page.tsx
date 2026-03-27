"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function getTokensFromHash(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập...");

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const supabase = createSupabaseBrowserClient();
      const code = searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const tokens = getTokensFromHash(window.location.hash);
          if (!tokens) throw new Error("Thiếu mã xác thực hoặc token đăng nhập");
          const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken
          });
          if (error) throw error;
        }

        const res = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "Bootstrap failed");
        }

        if (window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }

        router.replace("/");
        router.refresh();
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Đăng nhập thất bại");
      }
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "80px auto" }}>
        <h1 style={{ marginTop: 0 }}>Đang xử lý đăng nhập</h1>
        <p className="muted">{message}</p>
      </div>
    </main>
  );
}
