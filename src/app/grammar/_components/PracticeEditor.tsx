"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OptionRow = { id: string; label: string | null; content: string; is_correct: boolean };

export type QuestionRow = {
  id: string;
  prompt: string;
  explanation: string | null;
  translation: string | null;
  difficulty: "easy" | "medium" | "hard";
  bank_topic: string | null;
  options: OptionRow[];
};

type Draft = {
  id?: string;
  prompt: string;
  explanation: string;
  translation: string;
  difficulty: "easy" | "medium" | "hard";
  bankTopic: string;
  options: { label: string; content: string }[];
  correctIndex: number;
};

function emptyDraft(): Draft {
  return {
    prompt: "",
    explanation: "",
    translation: "",
    difficulty: "easy",
    bankTopic: "",
    options: [
      { label: "A", content: "" },
      { label: "B", content: "" },
      { label: "C", content: "" },
      { label: "D", content: "" }
    ],
    correctIndex: 0
  };
}

export function PracticeEditor({ lessonId, questions }: { lessonId: string; questions: QuestionRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState<"" | Draft["difficulty"]>("");
  const [bankTopic, setBankTopic] = useState("");
  const [bankItems, setBankItems] = useState<Array<{ id: string; prompt: string; difficulty: Draft["difficulty"]; bank_topic: string | null }>>([]);

  const sorted = useMemo(() => questions, [questions]);
  const bankTopicSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.bank_topic) set.add(q.bank_topic);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  function openCreate() {
    setError(null);
    setDraft(emptyDraft());
  }

  function openEdit(q: QuestionRow) {
    setError(null);
    const opts = (q.options ?? []).slice(0, 6);
    const correctIndex = Math.max(0, opts.findIndex((o) => o.is_correct));
    setDraft({
      id: q.id,
      prompt: q.prompt,
      explanation: q.explanation ?? "",
      translation: q.translation ?? "",
      difficulty: q.difficulty ?? "easy",
      bankTopic: q.bank_topic ?? "",
      options:
        opts.length >= 2
          ? opts.map((o, i) => ({ label: o.label ?? String.fromCharCode(65 + i), content: o.content }))
          : [
              { label: "A", content: "" },
              { label: "B", content: "" }
            ],
      correctIndex
    });
  }

  async function save() {
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

      const res = await fetch(draft.id ? `/api/grammar/questions/${draft.id}` : "/api/grammar/questions", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lessonId,
          prompt: draft.prompt,
          explanation: draft.explanation || null,
          translation: draft.translation || null,
          difficulty: draft.difficulty,
          bankTopic: draft.bankTopic || null,
          options
        })
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Save failed");
      }

      setDraft(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    const ok = window.confirm("Xoá câu hỏi này?");
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/grammar/questions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Delete failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function openBank() {
    setBankOpen(true);
    setError(null);
    setBusy(true);
    try {
      const url = new URL("/api/question-bank/search", window.location.origin);
      url.searchParams.set("limit", "80");
      const res = await fetch(url.toString());
      const j = (await res.json()) as { items?: Array<{ id: string; prompt: string; difficulty: Draft["difficulty"]; bank_topic: string | null }>; error?: string };
      if (!res.ok) throw new Error(j.error || "Load failed");
      setBankItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchBank() {
    setBusy(true);
    setError(null);
    try {
      const url = new URL("/api/question-bank/search", window.location.origin);
      url.searchParams.set("limit", "120");
      if (bankQuery.trim()) url.searchParams.set("q", bankQuery.trim());
      if (bankDifficulty) url.searchParams.set("difficulty", bankDifficulty);
      if (bankTopic.trim()) url.searchParams.set("bankTopic", bankTopic.trim());
      const res = await fetch(url.toString());
      const j = (await res.json()) as { items?: Array<{ id: string; prompt: string; difficulty: Draft["difficulty"]; bank_topic: string | null }>; error?: string };
      if (!res.ok) throw new Error(j.error || "Search failed");
      setBankItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyFromBank(questionId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/question-bank/copy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId, questionId })
      });
      const j = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Copy failed");
      setBankOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gEditBox">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 900 }}>Bài tập (Multiple choice)</div>
          <div className="gSubtle">Thêm/sửa câu hỏi, đáp án, giải thích.</div>
        </div>
        <div className="row">
          <button type="button" className="gBtn secondary" onClick={openCreate} disabled={busy}>
            + Thêm câu hỏi
          </button>
          <button type="button" className="gBtn secondary" onClick={openBank} disabled={busy}>
            Lấy từ ngân hàng
          </button>
        </div>
      </div>

      {error ? (
        <div className="gError" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ height: 12 }} />

      {sorted.length === 0 ? (
        <div className="gEmpty">
          <div className="gEmptyTitle">Chưa có câu hỏi</div>
          <div className="gEmptyDesc">Nhấn “Thêm câu hỏi” để tạo bài tập.</div>
        </div>
      ) : (
        <div className="gQList">
          {sorted.map((q, idx) => (
            <div key={q.id} className="gQRow">
              <div className="gQIndex">{idx + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div className="gQPrompt">{q.prompt}</div>
                <div className="gSubtle" style={{ fontSize: 12 }}>
                  <span className={`gTag ${q.difficulty}`}>{q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "TB" : "Khó"}</span>{" "}
                  {q.bank_topic ? (
                    <>
                      <span className="gTag group">{q.bank_topic}</span> ·{" "}
                    </>
                  ) : (
                    ""
                  )}
                  {(q.options ?? []).length} lựa chọn
                </div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="gBtn secondary" onClick={() => openEdit(q)} disabled={busy}>
                  Sửa
                </button>
                <button type="button" className="gBtn secondary" onClick={() => del(q.id)} disabled={busy}>
                  Xoá
                </button>
              </div>
            </div>
          ))}
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
            zIndex: 60
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(860px, 100%)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{draft.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}</div>
              <button type="button" className="btn secondary" onClick={() => setDraft(null)} disabled={busy}>
                Đóng
              </button>
            </div>

            <div style={{ height: 12 }} />
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Câu hỏi
            </div>
            <textarea
              className="input"
              rows={5}
              value={draft.prompt}
              onChange={(e) => setDraft((v) => (v ? { ...v, prompt: e.target.value } : v))}
              placeholder="Nhập câu hỏi…"
            />

            <div style={{ height: 12 }} />
            <div className="gFormGrid">
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Mức độ
                </div>
                <select
                  className="input"
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
                  className="input"
                  value={draft.bankTopic}
                  onChange={(e) => setDraft((v) => (v ? { ...v, bankTopic: e.target.value } : v))}
                  placeholder="Ví dụ: Từ loại / Thì / Giới từ…"
                  list="bankTopicList"
                />
                <datalist id="bankTopicList">
                  {bankTopicSuggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Giải thích (optional)
                </div>
                <textarea
                  className="input"
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
                  className="input"
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
                      name="correct"
                      checked={draft.correctIndex === i}
                      onChange={() => setDraft((v) => (v ? { ...v, correctIndex: i } : v))}
                    />
                    <span style={{ width: 28, fontWeight: 900 }}>{o.label}</span>
                  </label>
                  <input
                    className="input"
                    value={o.content}
                    onChange={(e) =>
                      setDraft((v) => {
                        if (!v) return v;
                        const next = v.options.slice();
                        next[i] = { ...next[i], content: e.target.value };
                        return { ...v, options: next };
                      })
                    }
                    placeholder={`Nhập lựa chọn ${o.label}…`}
                  />
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={save} disabled={busy || !draft.prompt.trim()}>
                {busy ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bankOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => (busy ? null : setBankOpen(false))}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 70
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Ngân hàng câu hỏi</div>
              <button type="button" className="btn secondary" onClick={() => setBankOpen(false)} disabled={busy}>
                Đóng
              </button>
            </div>

            <div style={{ height: 12 }} />
            <div className="gFormGrid">
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Tìm theo câu hỏi
                </div>
                <input className="input" value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} placeholder="Nhập từ khoá…" />
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Mức độ
                </div>
                <select className="input" value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value as "" | Draft["difficulty"])}>
                  <option value="">Tất cả</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Nhóm (chủ đề)
                </div>
                <input className="input" value={bankTopic} onChange={(e) => setBankTopic(e.target.value)} placeholder="Ví dụ: Từ loại…" />
              </div>
              <div className="gField" style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="button" className="btn" onClick={searchBank} disabled={busy}>
                  {busy ? "Đang tìm..." : "Tìm"}
                </button>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="gBankList">
              {bankItems.map((q) => (
                <div key={q.id} className="gBankRow">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.prompt}</div>
                    <div className="gSubtle" style={{ fontSize: 12 }}>
                      <span className={`gTag ${q.difficulty}`}>{q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "TB" : "Khó"}</span>
                      {q.bank_topic ? <span className="gTag group">{q.bank_topic}</span> : null}
                    </div>
                  </div>
                  <button type="button" className="btn secondary" onClick={() => copyFromBank(q.id)} disabled={busy}>
                    Thêm vào bài này
                  </button>
                </div>
              ))}
              {bankItems.length === 0 ? <div className="muted">Không có dữ liệu.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
