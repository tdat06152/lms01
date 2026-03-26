import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import LoginButton from "./ui/LoginButton";
import Link from "next/link";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getUser();
  if (user) redirect("/");
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "80px auto" }}>
        <h1 style={{ marginTop: 0 }}>Đăng nhập</h1>
        <p className="muted">
          Dùng Google OAuth của Supabase. Sau khi đăng nhập, bạn sẽ được tạo hồ sơ
          trong bảng <code>profiles</code>.
        </p>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <LoginButton label="Đăng nhập bằng Google" />
          <Link className="btn secondary" href="/signup">
            Đăng ký
          </Link>
        </div>
        {error ? (
          <p className="muted" style={{ marginTop: 12, color: "var(--danger, #b42318)" }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
