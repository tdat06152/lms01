"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LessonContentEditor({
  lessonId,
  initialHtml
}: {
  lessonId: string;
  initialHtml: string | null;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialHtml ?? "";
  }, [lessonId, initialHtml]);

  function focus() {
    editorRef.current?.focus();
  }

  function exec(command: string, value?: string) {
    focus();
    document.execCommand(command, false, value);
  }

  function insertTable() {
    const html =
      '<table style="width:100%;border-collapse:collapse" border="1"><tbody>' +
      "<tr><td>&nbsp;</td><td>&nbsp;</td></tr>" +
      "<tr><td>&nbsp;</td><td>&nbsp;</td></tr>" +
      "</tbody></table><p></p>";
    exec("insertHTML", html);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const contentHtml = editorRef.current?.innerHTML ?? "";
      const res = await fetch(`/api/grammar/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentHtml })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Save failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gEditBox">
      <div className="gEditToolbar">
        <button type="button" className="gIconBtn" onClick={() => exec("bold")} title="Bold">
          <b>B</b>
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("italic")} title="Italic">
          <i>I</i>
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("underline")} title="Underline">
          <u>U</u>
        </button>
        <span className="gSep" />
        <button type="button" className="gIconBtn" onClick={() => exec("formatBlock", "h2")} title="Heading">
          H2
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("formatBlock", "p")} title="Paragraph">
          P
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("insertUnorderedList")} title="Bullets">
          •
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("insertOrderedList")} title="Numbered">
          1.
        </button>
        <button type="button" className="gIconBtn" onClick={insertTable} title="Table">
          ▦
        </button>
        <span className="gSep" />
        <button type="button" className="gIconBtn" onClick={() => exec("fontSize", "2")} title="Small">
          A-
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("fontSize", "4")} title="Normal">
          A
        </button>
        <button type="button" className="gIconBtn" onClick={() => exec("fontSize", "6")} title="Large">
          A+
        </button>
        <span className="gSep" />
        <button type="button" className="gBtn secondary" onClick={save} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu nội dung"}
        </button>
      </div>

      {error ? (
        <div className="gError" role="alert">
          {error}
        </div>
      ) : null}

      <div
        ref={editorRef}
        className="gEditArea"
        contentEditable
        suppressContentEditableWarning
        spellCheck
      />
      <div className="gSubtle" style={{ marginTop: 10 }}>
        Gợi ý: dùng <code>H2</code>, <code>B</code>, <code>I</code>, danh sách, bảng. (MVP editor)
      </div>
    </div>
  );
}
