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
              <h2>HÀNH TRÌNH HỌC TẬP VÀ PHÁT TRIỂN</h2>
              <p />
            </div>
          </div>

          <div className="authFormPanel">
            <div className="authFormIntro">
              <h1>Chào mừng trở lại</h1>
              <p>Đăng nhập để đến với lộ trình học tập của bạn!</p>
            </div>

            <LoginButton label="Sign in with Google" className="authGoogleButton" />

            <div className="authDivider">
              <span>or continue with email</span>
            </div>

            <form className="authMockForm" action="/auth/login" method="get">
              <div className="authField">
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" type="email" placeholder="name@fluidacademy.com" disabled />
              </div>

              <div className="authField">
                <div className="authFieldRow">
                  <label htmlFor="auth-password">Password</label>
                  <a href="#">Forgot password?</a>
                </div>
                <div className="authPasswordWrap">
                  <input id="auth-password" type="password" placeholder="••••••••" disabled />
                  <span aria-hidden="true">◌</span>
                </div>
              </div>

              <button className="authPrimaryButton" type="submit">
                Sign In
              </button>
            </form>

            <div className="authHint">Hiện tại hệ thống xác thực bằng Google OAuth để đăng nhập an toàn.</div>

            {error ? (
              <div className="authError" role="alert">
                {error}
              </div>
            ) : null}

            <div className="authBottomText">
              Don&apos;t have an account? <Link href="/signup">Đăng ký ngay!</Link>
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
