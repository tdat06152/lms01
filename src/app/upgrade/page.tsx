import Link from "next/link";
import { requireActiveUser } from "@/lib/auth/server";

export default async function UpgradePage() {
  const { user } = await requireActiveUser();

  return (
    <main className="container">
      <div className="card">
        <h1 style={{ margin: 0 }}>Cần nâng cấp Pro</h1>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          Tài khoản <code>{user.email}</code> hiện chưa có quyền truy cập mục <b>Video</b>. Liên hệ admin để được cấp quyền.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn secondary" href="/">
            Trang chủ
          </Link>
          <Link className="btn" href="/grammar">
            Vào Grammar
          </Link>
        </div>
      </div>
    </main>
  );
}

