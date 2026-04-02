"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type GrammarTopicCard = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  questionCount: number;
  completedCount: number;
};

type TopicDraft = { id?: string; title: string; description: string; sortOrder: number };

function formatCount(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function completionLabel(done: number, total: number) {
  if (total === 0) return "Chưa có câu hỏi";
  if (done <= 0) return "Chưa bắt đầu";
  if (done >= total) return `${done}/${total} Xong`;
  return `${done}/${total} Hoàn thành`;
}

export function TopicsGrid({ topics, canEdit }: { topics: GrammarTopicCard[]; canEdit: boolean }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TopicDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
  }, [query, topics]);

  async function saveTopic(next: TopicDraft) {
    setBusy(true);
    try {
      const isEdit = !!next.id;
      const res = await fetch(isEdit ? `/api/grammar/topics/${next.id}` : "/api/grammar/topics", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: next.title,
          description: next.description || null,
          sortOrder: next.sortOrder
        })
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Save failed");
      }

      setDraft(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteTopic(id: string) {
    const ok = window.confirm("Xoá chủ đề này? (Sẽ xoá luôn các bài học/câu hỏi bên trong)");
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/grammar/topics/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Delete failed");
      }
      setMenuOpenId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        className="gInput"
        placeholder="Tìm kiếm bài học hoặc chủ đề..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="gSectionTitle" style={{ marginTop: 28 }}>
        <div>
          <div className="gSectionEyebrow">Grammar Dashboard</div>
          <span>Chủ đề Ngữ pháp</span>
        </div>
        {canEdit ? (
          <button
            type="button"
            className="gBtn secondary"
            onClick={() => setDraft({ title: "", description: "", sortOrder: 0 })}
            disabled={busy}
          >
            + Thêm chủ đề
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="gEmpty" style={{ marginTop: 12 }}>
          <div className="gEmptyTitle">Chưa có chủ đề</div>
          <div className="gEmptyDesc">
            Hãy thêm dữ liệu vào bảng <code>grammar_topics</code>, <code>grammar_lessons</code>, <code>questions</code> trong
            Supabase để hiển thị nội dung ở đây.
          </div>
        </div>
      ) : (
        <div className="gGrid" style={{ marginTop: 12 }}>
          {filtered.map((topic) => {
            const total = topic.questionCount;
            const done = topic.completedCount;
            const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
            const statusTone = done >= total && total > 0 ? "done" : done > 0 ? "progress" : "idle";

            return (
              <Link
                key={topic.id}
                className={`gCard gTopicCard ${statusTone}`}
                style={{ position: "relative", cursor: "pointer" }}
                href={`/grammar/${topic.id}`}
              >
                {canEdit ? (
                  <div style={{ position: "absolute", top: 18, right: 18 }}>
                    <button
                      type="button"
                      className="gBtn secondary"
                      style={{ padding: "8px 10px", borderRadius: 999 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpenId((v) => (v === topic.id ? null : topic.id));
                      }}
                      disabled={busy}
                      aria-label="Menu"
                    >
                      ⋯
                    </button>
                    {menuOpenId === topic.id ? (
                      <div
                        style={{
                          position: "absolute",
                          top: 44,
                          right: 0,
                          minWidth: 180,
                          background: "var(--surface-1)",
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          boxShadow: "var(--shadow)",
                          padding: 8,
                          zIndex: 20
                        }}
                      >
                        <button
                          type="button"
                          className="gBtn secondary"
                          style={{ width: "100%", justifyContent: "flex-start" }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDraft({
                              id: topic.id,
                              title: topic.title,
                              description: topic.description ?? "",
                              sortOrder: topic.sortOrder
                            });
                          }}
                          disabled={busy}
                        >
                          Sua
                        </button>
                        <div style={{ height: 8 }} />
                        <button
                          type="button"
                          className="gBtn secondary"
                          style={{ width: "100%", justifyContent: "flex-start" }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteTopic(topic.id);
                          }}
                          disabled={busy}
                        >
                          Xoa
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="gTopicHead">
                  <div className="gTopicIcon">{topic.title.slice(0, 1).toUpperCase()}</div>
                  <span className={`gTopicBadge ${statusTone}`}>{completionLabel(done, total)}</span>
                </div>

                <div>
                  <h4>{topic.title}</h4>
                  <p>{topic.description ?? "Chưa có mô tả cho chủ đề này."}</p>
                </div>

                <div className="gTopicProgress">
                  <div className="gTopicProgressBar">
                    <div className="gTopicProgressValue" style={{ width: `${percent}%` }} />
                  </div>
                  <span>{percent}%</span>
                </div>

                <div className="gMeta">
                  <div>
                    {formatCount(done)}/{formatCount(total)} câu đã hoàn thành
                  </div>
                  <div className="gLinks">
                    <span className="gLink">Xem chi tiết →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {draft ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => (busy ? null : setDraft(null))}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(720px, 100%)", background: "var(--surface-1)" }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{draft.id ? "Sửa chủ đề" : "Thêm chủ đề"}</div>
              <button type="button" className="btn secondary" onClick={() => setDraft(null)} disabled={busy}>
                Đóng
              </button>
            </div>

            <div style={{ height: 12 }} />

            <div className="row" style={{ alignItems: "stretch" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Tiêu đề
                </div>
                <input
                  className="input"
                  value={draft.title}
                  onChange={(e) => setDraft((v) => (v ? { ...v, title: e.target.value } : v))}
                  placeholder="Ví dụ: Hậu tố từ loại"
                />
              </div>
              <div style={{ width: 140 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Thứ tự
                </div>
                <input
                  className="input"
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft((v) => (v ? { ...v, sortOrder: Number(e.target.value) } : v))}
                />
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  Số nhỏ sẽ lên trước
                </div>
              </div>
            </div>

            <div style={{ height: 12 }} />
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Mô tả
            </div>
            <textarea
              className="input"
              value={draft.description}
              onChange={(e) => setDraft((v) => (v ? { ...v, description: e.target.value } : v))}
              rows={3}
              placeholder="Mô tả ngắn…"
            />

            <div style={{ height: 14 }} />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => saveTopic(draft)} disabled={busy || !draft.title.trim()}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
