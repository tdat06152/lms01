import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import LoginButton from "@/app/login/ui/LoginButton";

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <main className="authPage">
      <header className="authHeader">
        <div className="authHeaderInner">
          <Link className="authBrand" href="/">
            LMS
          </Link>
          <nav className="authNav">
            <Link className="authNavLink" href="/login">
              Đăng nhập
            </Link>
            <Link className="authNavLink active" href="/signup">
              Join Now
            </Link>
          </nav>
        </div>
      </header>

      <section className="authMain">
        <div className="authGlow authGlowLeft" aria-hidden="true" />
        <div className="authGlow authGlowRight" aria-hidden="true" />

        <div className="authCard authCardSplit">
          <div className="authVisual">
            <img
              alt="Students collaborating"
              src="https://cafebiz.cafebizcdn.vn/thumb_w/640/162123310254002176/2026/2/4/photo1770190243239-177019024332625758665-1770199013056524207371.png"
            />
            <div className="authVisualOverlay" />
            <div className="authVisualContent">
              <h2>BAT DAU HANH TRINH MOI</h2>
              <p>Chon tai khoan Google de tao ho so va vao he thong nhanh gon.</p>
            </div>
          </div>

          <div className="authFormPanel">
            <div className="authFormIntro">
              <h1>Tao tai khoan moi</h1>
              <p>Lan dau vao he thong, hay chon Google de khoi tao ho so hoc tap.</p>
            </div>

            <LoginButton label="Join with Google" className="authGoogleButton" />

            <div className="authInfoCard">
              <div className="authInfoTitle">Khoi tao tai khoan</div>
              <p>Sau khi xac thuc thanh cong, he thong se tao hoac cap nhat ho so cua ban trong bang profiles.</p>
            </div>

            <div className="authBottomText">
              Da co tai khoan? <Link href="/login">Dang nhap</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="authFooter">
        <div className="authFooterBrand">
          <span>LMS TEST</span>
          <p>@2026</p>
        </div>
        <nav className="authFooterNav">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
        </nav>
      </footer>
    </main>
  );
}
