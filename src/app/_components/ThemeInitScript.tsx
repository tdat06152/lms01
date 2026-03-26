export function ThemeInitScript() {
  const code = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch {
    // ignore
  }
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

