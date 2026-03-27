import Link from "next/link";
import { getAccessState, getUser } from "@/lib/auth/server";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

function Icon({ name }: { name: "grammar" | "vocab" | "listening" | "reading" | "test" | "video" | "about" }) {
  const common = { className: "navIcon", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
  switch (name) {
    case "grammar":
      return (
        <svg {...common}>
          <path d="M7 4h12v15a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
          <path d="M7 4v14a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "vocab":
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7V4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 12h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "listening":
      return (
        <svg {...common}>
          <path d="M12 3a4 4 0 0 1 4 4v6a4 4 0 1 1-8 0V7a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M5 12a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "reading":
      return (
        <svg {...common}>
          <path d="M6 4h12v16H6V4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "test":
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7V4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8h6M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <path d="M4 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M17 10l3-2v8l-3-2v-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}

export async function TopNav() {
  const user = await getUser();
  const access = user ? await getAccessState(user) : null;

  return (
    <header className="appHeader">
      <div className="appHeaderInner">
        <Link className="brand" href="/">
          <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            T
          </span>
          <span>Đậu TOEIC</span>
        </Link>

        <nav className="nav" aria-label="Chức năng">
          <Link className="navLink" href="/grammar">
            <Icon name="grammar" />
            Grammar
          </Link>
          <Link className="navLink" href="/vocab">
            <Icon name="vocab" />
            Vocab
          </Link>
          <Link className="navLink" href="/listening">
            <Icon name="listening" />
            Listening
          </Link>
          <Link className="navLink" href="/reading">
            <Icon name="reading" />
            Reading
          </Link>
          <Link className="navLink" href="/test">
            <Icon name="test" />
            Test
          </Link>
          {access?.canSeeVideo ? (
            <Link className="navLink" href="/video">
              <Icon name="video" />
              Video
            </Link>
          ) : null}
          <Link className="navLink" href="/about">
            <Icon name="about" />
            About
          </Link>
          {access?.isEditor ? (
            <Link className="navLink" href="/question-bank">
              Ngân hàng câu hỏi
            </Link>
          ) : null}
          {access?.isAdmin ? (
            <Link className="navLink" href="/admin">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="headerActions">
          {user ? (
            <span className="chip">
              {user.email}
              {access?.isExpired ? " (hết hạn)" : ""}
            </span>
          ) : (
            <Link className="btn secondary" href="/login">
              Đăng nhập
            </Link>
          )}
          <ThemeToggle />
          {user ? (
            <form action="/auth/signout" method="post">
              <button className="btn" type="submit">
                Đăng xuất
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
