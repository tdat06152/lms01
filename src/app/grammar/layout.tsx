import "./grammar.css";

export default function GrammarLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="grammarShell">{children}</div>;
}
