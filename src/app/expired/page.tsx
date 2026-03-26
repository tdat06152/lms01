import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth/server";

function formatDate(expiresAt: string | null) {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return expiresAt;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default async function ExpiredPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const when = formatDate(profile?.expires_at ?? null);

  return (
    <main className="container">
      <div className="card">
        <h1 style={{ margin: 0 }}>Tài khoản đã hết hạn</h1>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          Email: <code>{user.email}</code>
          {when ? (
            <>
              {" "}
              — Hết hạn: <code>{when}</code>
            </>
          ) : null}
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <form action="/auth/signout" method="post">
            <button className="btn" type="submit">
              Đăng xuất
            </button>
          </form>
          <Link className="btn secondary" href="/">
            Trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

