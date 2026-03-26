"use client";

import { useEffect, useMemo, useState } from "react";

export type PracticeOption = {
  id: string;
  label: string | null;
  content: string;
  is_correct: boolean;
};

export type PracticeQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  translation: string | null;
  options: PracticeOption[];
};

function msToTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PracticePlayer({ questions }: { questions: PracticeQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [speedMode, setSpeedMode] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string | null>>({});

  const current = questions[index] ?? null;
  const selectedOptionId = current ? selectedByQuestion[current.id] ?? null : null;

  const correctOptionId = useMemo(() => {
    if (!current) return null;
    const correct = current.options.find((o) => o.is_correct);
    return correct?.id ?? null;
  }, [current]);

  const isAnswered = Boolean(selectedOptionId);
  const isCorrect = Boolean(selectedOptionId && correctOptionId && selectedOptionId === correctOptionId);

  useEffect(() => {
    if (!timerOn) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [timerOn]);

  useEffect(() => {
    if (!timerOn) {
      setStartAt(null);
      return;
    }
    setStartAt((prev) => prev ?? Date.now());
  }, [timerOn]);

  if (!current) {
    return (
      <div className="gEmpty">
        <div className="gEmptyTitle">Chưa có câu hỏi</div>
        <div className="gEmptyDesc">Hãy thêm câu hỏi cho bài học này trong Supabase trước.</div>
      </div>
    );
  }

  const elapsed = timerOn && startAt ? msToTime(now - startAt) : null;

  return (
    <div className="gPractice">
      <div className="gPracticeTop">
        <div className="gPills">
          <button type="button" className={`gPill ${timerOn ? "on" : ""}`} onClick={() => setTimerOn((v) => !v)}>
            {elapsed ? `⏱ ${elapsed}` : "⏱ Ghi thời gian"}
          </button>
          <button type="button" className={`gPill ${speedMode ? "on" : ""}`} onClick={() => setSpeedMode((v) => !v)}>
            ⚡ Speed Mode
          </button>
        </div>
        <div className="gProgress">
          <span className="gProgressDot" />
          <span>
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="gQuestionCard">
        <div className="gPrompt">{current.prompt}</div>

        <div className="gOptions">
          {current.options.map((opt, i) => {
            const label = opt.label ?? String.fromCharCode(65 + i);
            const selected = selectedOptionId === opt.id;
            const correct = isAnswered && opt.id === correctOptionId;
            const wrong = isAnswered && selected && opt.id !== correctOptionId;

            return (
              <button
                key={opt.id}
                type="button"
                className={`gOption ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                onClick={() => {
                  if (isAnswered && !speedMode) return;
                  setSelectedByQuestion((prev) => ({ ...prev, [current.id]: opt.id }));
                  if (speedMode) setTimeout(() => setIndex((v) => Math.min(v + 1, questions.length - 1)), 220);
                }}
              >
                <div className="gOptionKey">{label}</div>
                <div className="gOptionText">{opt.content}</div>
              </button>
            );
          })}
        </div>

        {isAnswered ? (
          <div className={`gAnswerMeta ${isCorrect ? "ok" : "bad"}`}>
            {isCorrect ? "Đúng" : "Sai"}
            {current.explanation ? <span className="gExplain">— {current.explanation}</span> : null}
          </div>
        ) : (
          <div className="gAnswerMeta muted">Chọn đáp án để xem giải thích.</div>
        )}
      </div>

      <div className="gPracticeBottom">
        <button type="button" className="gBtn secondary" disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>
          ← Trước
        </button>
        <button
          type="button"
          className="gBtn"
          disabled={index === questions.length - 1}
          onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
        >
          Tiếp →
        </button>
      </div>

      <div className="gNumberNav" role="navigation" aria-label="Chọn câu hỏi">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`gNum ${i === index ? "active" : ""} ${selectedByQuestion[q.id] ? "done" : ""}`}
            onClick={() => setIndex(i)}
            aria-current={i === index ? "true" : "false"}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

