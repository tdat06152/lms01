import Link from "next/link";
import { getAccessState, getUser } from "@/lib/auth/server";

export default async function HomePage() {
  const user = await getUser();
  const access = user ? await getAccessState(user) : null;

  return (
    <main className="container" style={{ paddingTop: 26 }}>
      <div className="card">
        <h1 style={{ margin: 0, letterSpacing: "-0.02em" }}>Học TOEIC theo lộ trình</h1>
        <p className="muted" style={{ margin: "10px 0 0", maxWidth: 760 }}>
          Minimal UI (đen/trắng/xám) + chọn chế độ Sáng/Tối. Bắt đầu với Grammar (Bài học + Bài tập) rồi mở rộng sang Listening/Reading/Test.
        </p>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn" href="/grammar">
            Vào Grammar
          </Link>
          {access?.isAdmin ? (
            <Link className="btn secondary" href="/admin">
              Admin
            </Link>
          ) : null}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <h2 style={{ margin: 0, fontSize: 16 }}>Gợi ý tiếp theo</h2>
        <ul className="muted" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
          <li>Thêm nội dung “Bài học” (text/ảnh/video) cho từng lesson</li>
          <li>Chuẩn hoá ngân hàng câu hỏi + thống kê tiến độ</li>
          <li>Tạo trang Listening/Reading/Test theo cùng style</li>
        </ul>
      </div>
    </main>
  );
}
