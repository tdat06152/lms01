import Link from "next/link";
import { requireActiveUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopicsGrid, type GrammarTopicCard } from "@/app/grammar/_components/TopicsGrid";

type TopicRow = { id: string; title: string; description: string | null; sort_order: number };
type LessonRow = { id: string; topic_id: string };
type QuestionRow = { id: string; lesson_id: string };
type AttemptRow = { question_id: string };

function countBy<T extends string>(items: T[]) {
  const map = new Map<T, number>();
  for (const id of items) map.set(id, (map.get(id) ?? 0) + 1);
  return map;
}

export default async function GrammarPage() {
  const { user, access } = await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const canEdit = access.isEditor;

  const [{ data: topics, error: topicsError }, { data: lessons, error: lessonsError }, { data: questions, error: questionsError }, { data: attempts, error: attemptsError }] =
    await Promise.all([
      supabase.from("grammar_topics").select("id, title, description, sort_order").order("sort_order", { ascending: true }),
      supabase.from("grammar_lessons").select("id, topic_id"),
      supabase.from("questions").select("id, lesson_id"),
      supabase.from("attempts").select("question_id").eq("user_id", user.id)
    ]);

  if (topicsError) throw topicsError;
  if (lessonsError) throw lessonsError;
  if (questionsError) throw questionsError;
  if (attemptsError) throw attemptsError;

  const lessonToTopic = new Map<string, string>();
  for (const l of (lessons ?? []) as LessonRow[]) lessonToTopic.set(l.id, l.topic_id);

  const questionToLesson = new Map<string, string>();
  for (const q of (questions ?? []) as QuestionRow[]) questionToLesson.set(q.id, q.lesson_id);

  const questionsByTopic = new Map<string, string[]>();
  for (const q of (questions ?? []) as QuestionRow[]) {
    const topicId = lessonToTopic.get(q.lesson_id);
    if (!topicId) continue;
    const list = questionsByTopic.get(topicId) ?? [];
    list.push(q.id);
    questionsByTopic.set(topicId, list);
  }

  const attemptQuestionIds = ((attempts ?? []) as AttemptRow[]).map((a) => a.question_id);
  const attemptedLessonIds = attemptQuestionIds.map((qid) => questionToLesson.get(qid)).filter(Boolean) as string[];
  const attemptedTopicIds = attemptedLessonIds.map((lid) => lessonToTopic.get(lid)).filter(Boolean) as string[];
  const completedByTopic = countBy(attemptedTopicIds);

  const topicCards: GrammarTopicCard[] = ((topics ?? []) as TopicRow[]).map((t) => {
    const qTotal = (questionsByTopic.get(t.id) ?? []).length;
    const done = completedByTopic.get(t.id) ?? 0;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      sortOrder: t.sort_order,
      questionCount: qTotal,
      completedCount: Math.min(done, qTotal)
    };
  });

  return (
    <main className="grammarContainer">
      <div className="gHero">
        <h1>
          Chinh phục <span>Part 5 TOEIC</span>
        </h1>
        <p>Chọn 1 chủ đề → vào “Bài học” để học, hoặc “Luyện tập” để làm bài dạng test.</p>
      </div>

      <div className="gPanel">
        <div className="gPanelInner">
          <div className="gPracticeBanner">
            <div>
              <h3>Luyện tập ngẫu nhiên</h3>
              <p>10 câu hỏi ngẫu nhiên từ ngân hàng câu hỏi của bạn</p>
            </div>
            <Link className="gBtn" href="/grammar/random">
              Bắt đầu
            </Link>
          </div>

          <div style={{ height: 14 }} />
          <TopicsGrid topics={topicCards} canEdit={canEdit} />

          <div style={{ marginTop: 16, color: "var(--muted)", fontSize: 12 }}>
            Đăng nhập: {user.email}
          </div>
        </div>
      </div>
    </main>
  );
}
