import { requireVideoAccess } from "@/lib/auth/server";

export default async function VideoPage() {
  await requireVideoAccess();
  return (
    <main className="container">
      <div className="card">
        <h1 style={{ margin: 0 }}>Video</h1>
        <p className="muted" style={{ margin: "10px 0 0" }}>
          Coming soon.
        </p>
      </div>
    </main>
  );
}
