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
    <main className="authPage">
      <header className="authHeader">
        <div className="authHeaderInner">
          <Link className="authBrand" href="/">
            LMS
          </Link>
          <nav className="authNav">
            <Link className="authNavLink active" href="/login">
              Đăng nhập
            </Link>
            <Link className="authNavLink" href="/signup">
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
              <h2>HANH TRINH HOC TAP VA PHAT TRIEN</h2>
              <p>Khong gian hoc tap hien dai, gon gang va san sang cho lo trinh cua ban.</p>
            </div>
          </div>

          <div className="authFormPanel">
            <div className="authFormIntro">
              <h1>Chao mung tro lai</h1>
              <p>Dang nhap de den voi lo trinh hoc tap cua ban.</p>
            </div>

            <LoginButton label="Sign in with Google" className="authGoogleButton" />

            <div className="authDivider">
              <span>Google OAuth dang hoat dong</span>
            </div>

            <div className="authInfoCard">
              <div className="authInfoTitle">Dang nhap hien tai</div>
              <p>He thong dang su dung Google de dang nhap an toan. Sau khi vao he thong, tai khoan se duoc tao hoac dong bo tu dong.</p>
            </div>

            {error ? (
              <div className="authError" role="alert">
                {error}
              </div>
            ) : null}

            <div className="authBottomText">
              Don&apos;t have an account? <Link href="/signup">Dang ky ngay</Link>
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
