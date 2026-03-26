import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import LoginButton from "@/app/login/ui/LoginButton";

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "80px auto" }}>
        <h1 style={{ marginTop: 0 }}>Đăng ký</h1>
        <p className="muted">
          Lần đầu vào hệ thống: chọn Gmail của bạn để tạo tài khoản. Sau đó bạn chỉ cần “Đăng nhập”.
        </p>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <LoginButton label="Đăng ký bằng Google" />
          <Link className="btn secondary" href="/login">
            Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
