"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  bankTopic: string;
  explanation: string;
  translation: string;
  options: { label: string; content: string }[];
  correctIndex: number;
};

function emptyDraft(): Draft {
  return {
    prompt: "",
    difficulty: "easy",
    bankTopic: "",
    explanation: "",
    translation: "",
    options: [
      { label: "A", content: "" },
      { label: "B", content: "" },
      { label: "C", content: "" },
      { label: "D", content: "" }
    ],
    correctIndex: 0
  };
}

export function AddBankQuestionButton({ existingTopics }: { existingTopics: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => existingTopics, [existingTopics]);

  async function save() {
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

      const res = await fetch("/api/question-bank/questions", {
        method: "POST",
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
      const j = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setOpen(false);
      setDraft(emptyDraft());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        + Thêm câu hỏi
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => (busy ? null : setOpen(false))}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 80
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(980px, 100%)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Thêm câu hỏi (Ngân hàng)</div>
              <button type="button" className="btn secondary" onClick={() => setOpen(false)} disabled={busy}>
                Đóng
              </button>
            </div>

            {error ? (
              <div style={{ marginTop: 12 }} className="gError" role="alert">
                {error}
              </div>
            ) : null}

            <div style={{ height: 12 }} />
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Câu hỏi
            </div>
            <textarea
              className="input full"
              rows={5}
              value={draft.prompt}
              onChange={(e) => setDraft((v) => ({ ...v, prompt: e.target.value }))}
              placeholder="Nhập câu hỏi…"
            />

            <div className="gFormGrid">
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Mức độ
                </div>
                <select
                  className="input full"
                  value={draft.difficulty}
                  onChange={(e) => setDraft((v) => ({ ...v, difficulty: e.target.value as Draft["difficulty"] }))}
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
                  onChange={(e) => setDraft((v) => ({ ...v, bankTopic: e.target.value }))}
                  placeholder="Ví dụ: Từ loại / Thì / Giới từ…"
                  list="bankTopicList-bank"
                />
                <datalist id="bankTopicList-bank">
                  {suggestions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="gField">
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Giải thích (optional)
                </div>
                <textarea
                  className="input full"
                  rows={3}
                  value={draft.explanation}
                  onChange={(e) => setDraft((v) => ({ ...v, explanation: e.target.value }))}
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
                  onChange={(e) => setDraft((v) => ({ ...v, translation: e.target.value }))}
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
                      name="correct-bank"
                      checked={draft.correctIndex === i}
                      onChange={() => setDraft((v) => ({ ...v, correctIndex: i }))}
                    />
                    <span style={{ width: 28, fontWeight: 900 }}>{o.label}</span>
                  </label>
                  <input
                    className="input full"
                    value={o.content}
                    onChange={(e) =>
                      setDraft((v) => {
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
    </>
  );
}
