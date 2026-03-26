"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? null;
    const initial = stored === "light" || stored === "dark" ? stored : getSystemTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  return (
    <button
      type="button"
      className="iconBtn"
      aria-label={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
      onClick={() => {
        const next: Theme = (theme ?? getSystemTheme()) === "dark" ? "light" : "dark";
        localStorage.setItem("theme", next);
        setTheme(next);
        applyTheme(next);
      }}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}

