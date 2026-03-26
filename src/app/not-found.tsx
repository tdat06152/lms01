import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Không tìm thấy</h1>
        <p className="muted">Trang không tồn tại hoặc bạn không có quyền.</p>
        <Link className="btn secondary" href="/">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

