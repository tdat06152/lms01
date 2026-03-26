"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type LessonItem = { id: string; title: string; sort_order: number };

export function LessonsList({
  topicId,
  lessons,
  activeLessonId,
  activeTab,
  canEdit
}: {
  topicId: string;
  lessons: LessonItem[];
  activeLessonId: string | null;
  activeTab: "lesson" | "practice";
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  async function createLesson() {
    const title = window.prompt("Tên bài học mới?");
    if (!title) return;
    setBusy(true);
    try {
      const res = await fetch("/api/grammar/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId, title, sortOrder: lessons.length })
      });
      if (!res.ok) throw new Error("Create failed");
      const j = (await res.json()) as { id: string };
      router.push(`/grammar/${topicId}?lesson=${j.id}&tab=${activeTab}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function renameLesson(lessonId: string, currentTitle: string) {
    const title = window.prompt("Đổi tên bài học:", currentTitle);
    if (title == null) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/grammar/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error("Update failed");
      setMenuId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteLesson(lessonId: string) {
    const ok = window.confirm("Xoá bài học này? (Sẽ xoá luôn câu hỏi bên trong)");
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/grammar/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMenuId(null);
      router.push(`/grammar/${topicId}?tab=${activeTab}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gLessonList">
      {canEdit ? (
        <button type="button" className="gBtn secondary" onClick={createLesson} disabled={busy} style={{ width: "100%" }}>
          + Thêm bài học
        </button>
      ) : null}

      {lessons.map((l, idx) => (
        <div key={l.id} style={{ position: "relative" }}>
          <Link
            className={`gLessonItem ${activeLessonId && l.id === activeLessonId ? "active" : ""}`}
            href={`/grammar/${topicId}?lesson=${l.id}&tab=${activeTab}`}
          >
            <span className="gLessonIndex">{String(idx + 1).padStart(2, "0")}</span>
            <span className="gLessonName">{l.title}</span>
          </Link>

          {canEdit ? (
            <button
              type="button"
              className="gLessonMenu"
              aria-label="Menu"
              onClick={() => setMenuId((v) => (v === l.id ? null : l.id))}
              disabled={busy}
            >
              ⋯
            </button>
          ) : null}

          {canEdit && menuId === l.id ? (
            <div className="gMenuPanel">
              <button type="button" className="gMenuItem" onClick={() => renameLesson(l.id, l.title)} disabled={busy}>
                ✏️ Đổi tên
              </button>
              <button type="button" className="gMenuItem" onClick={() => deleteLesson(l.id)} disabled={busy}>
                🗑️ Xoá
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
