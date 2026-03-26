import { requireActiveUser } from "@/lib/auth/server";

export default async function TestPage() {
  await requireActiveUser();
  return (
    <main className="container">
      <div className="card">
        <h1 style={{ margin: 0 }}>Test</h1>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          Coming soon.
        </p>
      </div>
    </main>
  );
}
