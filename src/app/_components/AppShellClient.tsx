"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

function titleForPath(pathname: string) {
  if (pathname.startsWith("/grammar")) return "Grammar";
  if (pathname.startsWith("/vocab")) return "Vocab";
  if (pathname.startsWith("/listening")) return "Listening";
  if (pathname.startsWith("/reading")) return "Reading";
  if (pathname.startsWith("/test")) return "Test";
  if (pathname.startsWith("/video")) return "Video";
  if (pathname.startsWith("/question-bank")) return "Ngân hàng câu hỏi";
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/login")) return "Đăng nhập";
  if (pathname.startsWith("/expired")) return "Hết hạn";
  if (pathname.startsWith("/upgrade")) return "Nâng cấp";
  return "Đậu TOEIC";
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`) || pathname.startsWith(href);
}

export function AppShellClient({
  children,
  userEmail,
  userName,
  isExpired,
  isAdmin,
  isEditor,
  canSeeVideo
}: {
  children: React.ReactNode;
  userEmail: string | null;
  userName: string | null;
  isExpired: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  canSeeVideo: boolean;
}) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: "/grammar", label: "Grammar", show: true },
    { href: "/vocab", label: "Vocab", show: true },
    { href: "/listening", label: "Listening", show: true },
    { href: "/reading", label: "Reading", show: true },
    { href: "/test", label: "Test", show: true },
    { href: "/video", label: "Video", show: canSeeVideo },
    { href: "/about", label: "About", show: true },
    { href: "/question-bank", label: "Ngân hàng câu hỏi", show: isEditor },
    { href: "/admin", label: "Admin", show: isAdmin }
  ];

  return (
    <div className="appShell">
      <aside className="appSidebar">
        <div className="appSidebarTop">
          <Link className="sideBrand" href="/">
            <span className="sideLogo">T</span>
            <span>Đậu TOEIC</span>
          </Link>
        </div>

        <nav className="sideNav" aria-label="Chức năng">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link key={l.href} className={`sideLink ${isActive(pathname, l.href) ? "active" : ""}`} href={l.href}>
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="sideFooter">
          {userEmail ? (
            <div className="sideUser" title={userEmail}>
              {userName ?? userEmail}
              {isExpired ? " (hết hạn)" : ""}
            </div>
          ) : (
            <Link className="btn secondary" href="/login">
              Đăng nhập
            </Link>
          )}
          <div className="row" style={{ justifyContent: "space-between", width: "100%" }}>
            <ThemeToggle />
            {userEmail ? (
              <form action="/auth/signout" method="post">
                <button className="btn" type="submit">
                  Đăng xuất
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="appContent">
        <div className="appTopbar">
          <div className="appTitle">{title}</div>
        </div>
        <div className="appBody">{children}</div>
      </div>
    </div>
  );
}
