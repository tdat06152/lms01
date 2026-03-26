"use client";

import { useMemo, useState } from "react";

type QuestionItem = {
  id: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  bank_topic: string | null;
  created_at: string;
  lessonLabel: string | null;
};

function labelDifficulty(d: QuestionItem["difficulty"]) {
  if (d === "easy") return "Dễ";
  if (d === "medium") return "Trung bình";
  return "Khó";
}

type Draft = {
  id: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  bankTopic: string;
  explanation: string;
  translation: string;
  options: { label: string; content: string }[];
  correctIndex: number;
};

export function QuestionBankClient({
  questions,
  existingTopics
}: {
  questions: QuestionItem[];
  existingTopics: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<string[]>(existingTopics);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      if (!q.bank_topic) continue;
      map.set(q.bank_topic, (map.get(q.bank_topic) ?? 0) + 1);
    }
    return map;
  }, [questions]);

  const groupList = useMemo(() => groups, [groups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter((item) => {
      if (selectedTopic && item.bank_topic !== selectedTopic) return false;
      if (!q) return true;
      return item.prompt.toLowerCase().includes(q) || (item.bank_topic ?? "").toLowerCase().includes(q);
    });
  }, [questions, query, selectedTopic]);

  function addGroup() {
    const name = window.prompt("Tên nhóm mới?");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroups((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed].sort((a, b) => a.localeCompare(b))));
    setSelectedTopic(trimmed);
  }

  async function openEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/question-bank/questions/${id}`);
      const j = (await res.json().catch(() => null)) as { item?: unknown; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Load failed");
      const item = j?.item as {
        id: string;
        prompt: string;
        explanation: string | null;
        translation: string | null;
        difficulty: "easy" | "medium" | "hard";
        bank_topic: string | null;
        options: Array<{ label: string | null; content: string; is_correct: boolean }>;
      };

      const opts = (item.options ?? []).slice(0, 6);
      const correctIndex = Math.max(0, opts.findIndex((o) => o.is_correct));
      setDraft({
        id: item.id,
        prompt: item.prompt,
        difficulty: item.difficulty ?? "easy",
        bankTopic: item.bank_topic ?? "",
        explanation: item.explanation ?? "",
        translation: item.translation ?? "",
        options:
          opts.length >= 2
            ? opts.map((o, i) => ({ label: o.label ?? String.fromCharCode(65 + i), content: o.content }))
            : [
                { label: "A", content: "" },
                { label: "B", content: "" },
                { label: "C", content: "" },
                { label: "D", content: "" }
              ],
        correctIndex
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const options = draft.options
        .map((o, idx) => ({
          label: o.label || String.fromCharCode(65 + idx),
          content: o.content,
          isCorrect: idx === draft.correctIndex
        }))
        .filter((o) => o.content.trim() !== "");

      if (!draft.prompt.trim()) throw new Error("Thiếu câu hỏi (prompt)");
      if (options.length < 2) throw new Error("Cần ít nhất 2 lựa chọn");

      const res = await fetch(`/api/question-bank/questions/${draft.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: draft.prompt,
          explanation: draft.explanation || null,
          translation: draft.translation || null,
          difficulty: draft.difficulty,
          bankTopic: draft.bankTopic || null,
          options
        })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setDraft(null);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuestion(id: string) {
    const ok = window.confirm("Xoá câu hỏi này?");
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/question-bank/questions/${id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Delete failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="qbLayout">
      <aside className="qbSidebar">
        <div className="qbSidebarTitle">Nhóm</div>
        <button
          type="button"
          className={`qbSideItem ${selectedTopic === null ? "active" : ""}`}
          onClick={() => setSelectedTopic(null)}
        >
          <span>Tất cả</span>
          <span className="qbCount">{questions.length}</span>
        </button>

        <div className="qbDivider" />

        {groupList.map((t) => (
          <button
            key={t}
            type="button"
            className={`qbSideItem ${selectedTopic === t ? "active" : ""}`}
            onClick={() => setSelectedTopic(t)}
            title={t}
          >
            <span className="qbEllipsis">{t}</span>
            <span className="qbCount">{topicCounts.get(t) ?? 0}</span>
          </button>
        ))}

        <div className="qbDivider" />
        <button type="button" className="qbSideItem" onClick={addGroup} disabled={busy}>
          <span>+ Thêm nhóm mới</span>
          <span className="qbCount">+</span>
        </button>
      </aside>

      <section className="qbMain">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900 }}>
            {selectedTopic ? `Nhóm: ${selectedTopic}` : "Tất cả câu hỏi"}{" "}
            <span className="muted" style={{ fontWeight: 800, fontSize: 12 }}>
              ({filtered.length})
            </span>
          </div>
        </div>

        <div style={{ height: 10 }} />
        {error ? (
          <div className="gError" role="alert">
            {error}
          </div>
        ) : null}

        <div style={{ height: 10 }} />
        <input
          className="input full"
          placeholder="Tìm theo câu hỏi hoặc nhóm…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div style={{ height: 12 }} />
        <div style={{ overflowX: "auto" }}>
          <table className="dataTable">
            <thead>
              <tr>
                <th>CÂU HỎI</th>
                <th>MỨC ĐỘ</th>
                <th>NHÓM</th>
                <th>GHI CHÚ</th>
                <th style={{ textAlign: "right" }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td style={{ maxWidth: 720 }}>
                    <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.prompt}
                    </div>
                  </td>
                  <td>
                    <span className={`gTag ${q.difficulty}`}>{labelDifficulty(q.difficulty)}</span>
                  </td>
                  <td>{q.bank_topic ? <span className="gTag group">{q.bank_topic}</span> : <span className="muted">—</span>}</td>
                  <td className="muted" style={{ fontSize: 13 }}>{q.lessonLabel ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="row" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ padding: "8px 10px", borderRadius: 10, fontSize: 13 }}
                        onClick={() => openEdit(q.id)}
                        disabled={busy}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ padding: "8px 10px", borderRadius: 10, fontSize: 13 }}
                        onClick={() => deleteQuestion(q.id)}
                        disabled={busy}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ padding: 16 }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

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
            zIndex: 90
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Sửa câu hỏi</div>
              <button type="button" className="btn secondary" onClick={() => setDraft(null)} disabled={busy}>
                Đóng
              </button>
            </div>

            <div style={{ height: 12 }} />
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Câu hỏi
            </div>
            <textarea
              className="input full"
              rows={5}
              value={draft.prompt}
              onChange={(e) => setDraft((v) => (v ? { ...v, prompt: e.target.value } : v))}
            />

            <div className="gFormGrid">
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Mức độ
                </div>
                <select
                  className="input full"
                  value={draft.difficulty}
                  onChange={(e) => setDraft((v) => (v ? { ...v, difficulty: e.target.value as Draft["difficulty"] } : v))}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Nhóm (chủ đề)
                </div>
                <input
                  className="input full"
                  value={draft.bankTopic}
                  onChange={(e) => setDraft((v) => (v ? { ...v, bankTopic: e.target.value } : v))}
                  placeholder="Ví dụ: Từ loại / Thì / Giới từ…"
                />
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Giải thích (optional)
                </div>
                <textarea
                  className="input full"
                  rows={3}
                  value={draft.explanation}
                  onChange={(e) => setDraft((v) => (v ? { ...v, explanation: e.target.value } : v))}
                />
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Dịch (optional)
                </div>
                <textarea
                  className="input full"
                  rows={3}
                  value={draft.translation}
                  onChange={(e) => setDraft((v) => (v ? { ...v, translation: e.target.value } : v))}
                />
              </div>
            </div>

            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 900, fontSize: 14 }}>Lựa chọn</div>
            <div className="gOptGrid" style={{ marginTop: 10 }}>
              {draft.options.map((o, i) => (
                <div key={o.label} className="gOptRow">
                  <label className="row" style={{ gap: 10 }}>
                    <input
                      type="radio"
                      name="correct-edit"
                      checked={draft.correctIndex === i}
                      onChange={() => setDraft((v) => (v ? { ...v, correctIndex: i } : v))}
                    />
                    <span style={{ width: 28, fontWeight: 900 }}>{o.label}</span>
                  </label>
                  <input
                    className="input full"
                    value={o.content}
                    onChange={(e) =>
                      setDraft((v) => {
                        if (!v) return v;
                        const next = v.options.slice();
                        next[i] = { ...next[i], content: e.target.value };
                        return { ...v, options: next };
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={saveEdit} disabled={busy || !draft.prompt.trim()}>
                {busy ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
