import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PracticePlayer, type PracticeQuestion } from "@/app/grammar/_components/PracticePlayer";
import { LessonContentEditor } from "@/app/grammar/_components/LessonContentEditor";
import { PracticeEditor, type QuestionRow as EditorQuestionRow } from "@/app/grammar/_components/PracticeEditor";
import { LessonsList, type LessonItem } from "@/app/grammar/_components/LessonsList";

type Topic = { id: string; title: string; description: string | null };
type Lesson = { id: string; title: string; sort_order: number; content_html: string | null };

type QuestionRow = {
  id: string;
  prompt: string;
  explanation: string | null;
  translation: string | null;
  difficulty: "easy" | "medium" | "hard";
  bank_topic: string | null;
  options: { id: string; label: string | null; content: string; is_correct: boolean }[];
};

type QuestionCountRow = { id: string };

export default async function GrammarTopicPage({
  params,
  searchParams
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ tab?: string; lesson?: string }>;
}) {
  const { access } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const canEdit = access.isEditor;

  const { topicId } = await params;
  const { tab, lesson } = await searchParams;

  const { data: topic, error: topicError } = await supabase
    .from("grammar_topics")
    .select("id, title, description")
    .eq("id", topicId)
    .maybeSingle();

  if (topicError) throw topicError;
  if (!topic) notFound();

  const { data: lessons, error: lessonsError } = await supabase
    .from("grammar_lessons")
    .select("id, title, sort_order, content_html")
    .eq("topic_id", topicId)
    .order("sort_order", { ascending: true });

  if (lessonsError) throw lessonsError;

  const lessonList = (lessons ?? []) as Lesson[];
  const activeLessonId = lesson ?? lessonList[0]?.id ?? null;
  const activeTab = tab === "practice" ? "practice" : "lesson";
  const activeLesson = (lessonList.find((l) => l.id === activeLessonId) as Lesson | undefined) ?? null;

  let questionCount = 0;
  let lessonExample: QuestionRow | null = null;
  let allQuestions: QuestionRow[] = [];
  if (activeLessonId) {
    if (activeTab === "practice") {
      const { data: questionRows, error: qError } = await supabase
        .from("questions")
        .select("id, prompt, explanation, translation, difficulty, bank_topic, options(id, label, content, is_correct)")
        .eq("lesson_id", activeLessonId)
        .order("created_at", { ascending: true });
      if (qError) throw qError;
      allQuestions = (questionRows ?? []) as QuestionRow[];
      questionCount = allQuestions.length;
    } else {
      const [{ data: countRows, error: countError }, { data: exampleRow, error: exampleError }] = await Promise.all([
        supabase.from("questions").select("id").eq("lesson_id", activeLessonId),
        supabase
          .from("questions")
          .select("id, prompt, explanation, translation, difficulty, bank_topic, options(id, label, content, is_correct)")
          .eq("lesson_id", activeLessonId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      ]);

      if (countError) throw countError;
      if (exampleError) throw exampleError;

      questionCount = ((countRows ?? []) as QuestionCountRow[]).length;
      lessonExample = (exampleRow as QuestionRow | null) ?? null;
    }
  }

  if (!lessonExample) lessonExample = allQuestions[0] ?? null;
  const practiceQuestions: PracticeQuestion[] = allQuestions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    translation: q.translation,
    options: q.options ?? []
  }));
  const editorQuestions = (allQuestions as unknown) as EditorQuestionRow[];

  return (
    <main className="grammarContainer">
      <div className="gCrumbs">
        <Link className="gCrumbLink" href="/grammar">
          ← Grammar
        </Link>
      </div>

      <div className="gSplit">
        <aside className="gSidebar">
          <div className="gSidebarTitle">{(topic as Topic).title}</div>
          <div className="gSidebarDesc">{(topic as Topic).description ?? "Chọn 1 bài học ở bên dưới để bắt đầu."}</div>

          <LessonsList
            topicId={topicId}
            lessons={(lessonList as unknown) as LessonItem[]}
            activeLessonId={activeLessonId}
            activeTab={activeTab}
            canEdit={canEdit}
          />
        </aside>

        <section className="gMain">
          <div className="gTabs">
            <Link
              className={`gTab ${activeTab === "lesson" ? "active" : ""}`}
              href={`/grammar/${topicId}?${activeLessonId ? `lesson=${activeLessonId}&` : ""}tab=lesson`}
            >
              📖 Bài học
            </Link>
            <Link
              className={`gTab ${activeTab === "practice" ? "active" : ""}`}
              href={`/grammar/${topicId}?${activeLessonId ? `lesson=${activeLessonId}&` : ""}tab=practice`}
            >
              ▶ Luyện tập <span className="gTabBadge">{questionCount ?? 0}</span>
            </Link>
          </div>

          <div className="gPanel">
            <div className="gPanelInner">
              {activeTab === "lesson" ? (
                <div>
                  <h2 style={{ margin: 0 }}>Bài học</h2>
                  <p className="gSubtle" style={{ margin: "8px 0 0" }}>
                    {canEdit ? "Bạn đang ở chế độ chỉnh sửa nội dung bài học." : "Nội dung bài học."}
                  </p>

                  {!activeLesson ? (
                    <div className="gEmpty" style={{ marginTop: 14 }}>
                      <div className="gEmptyTitle">Chưa có bài học</div>
                      <div className="gEmptyDesc">
                        {canEdit ? "Nhấn “+ Thêm bài học” ở sidebar để tạo bài đầu tiên." : "Chủ đề này chưa có bài học."}
                      </div>
                    </div>
                  ) : (
                    canEdit ? (
                      <div style={{ marginTop: 14 }}>
                        <LessonContentEditor lessonId={activeLesson.id} initialHtml={activeLesson.content_html} />
                      </div>
                    ) : activeLesson.content_html ? (
                      <div className="gLessonContent" dangerouslySetInnerHTML={{ __html: activeLesson.content_html }} />
                    ) : (
                      <div className="gEmpty" style={{ marginTop: 14 }}>
                        <div className="gEmptyTitle">Chưa có nội dung</div>
                        <div className="gEmptyDesc">Nội dung bài học sẽ hiển thị ở đây.</div>
                      </div>
                    )
                  )}

                  {lessonExample ? (
                    <div className="gExample">
                      <div className="gExampleTitle">Ví dụ</div>
                      <div className="gExamplePrompt">{lessonExample.prompt}</div>
                      <div className="gExampleOptions">
                        {(lessonExample.options ?? []).map((o, i) => (
                          <div key={o.id} className="gExampleOption">
                            <span className="gExampleKey">{o.label ?? String.fromCharCode(65 + i)}</span>
                            <span>{o.content}</span>
                          </div>
                        ))}
                      </div>
                      {lessonExample.explanation ? <div className="gExampleExplain">{lessonExample.explanation}</div> : null}
                    </div>
                  ) : (
                    <div className="gEmpty">
                      <div className="gEmptyTitle">Chưa có ví dụ</div>
                      <div className="gEmptyDesc">
                        {activeLessonId && canEdit ? "Thêm ít nhất 1 câu hỏi ở tab Luyện tập để hiển thị ví dụ." : "Chưa có câu hỏi."}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                activeLessonId ? (
                  canEdit ? (
                    <PracticeEditor lessonId={activeLessonId} questions={editorQuestions} />
                  ) : (
                    <PracticePlayer questions={practiceQuestions} />
                  )
                ) : (
                  <div className="gEmpty">
                    <div className="gEmptyTitle">Chưa có bài học</div>
                    <div className="gEmptyDesc">
                      {canEdit ? "Nhấn “+ Thêm bài học” ở sidebar để tạo bài đầu tiên, rồi mới tạo bài tập." : "Chủ đề này chưa có bài học."}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
