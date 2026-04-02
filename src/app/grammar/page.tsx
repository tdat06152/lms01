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

  const totalQuestions = topicCards.reduce((sum, topic) => sum + topic.questionCount, 0);
  const totalCompleted = topicCards.reduce((sum, topic) => sum + topic.completedCount, 0);
  const completedTopics = topicCards.filter((topic) => topic.questionCount > 0 && topic.completedCount >= topic.questionCount).length;

  return (
    <main className="grammarContainer">
      <div className="gHeroGrid">
        <section className="gHeroCopy">
          <span className="gHeroEyebrow">LMS giao diện mới</span>
          <h1>
            QUY TRÌNH
            <br />
            VẬN HÀNH
          </h1>
          <p>
            Chọn 1 chủ đề → vào <strong>&quot;Bài học&quot;</strong> để học, hoặc <strong>&quot;Luyện tập&quot;</strong> để làm
            bài dạng test.
          </p>

          <div className="gHeroStats">
            <div className="gStatCard">
              <strong>{topicCards.length}</strong>
              <span>Chủ đề đang có</span>
            </div>
            <div className="gStatCard">
              <strong>
                {totalCompleted}/{totalQuestions}
              </strong>
              <span>Câu đã làm</span>
            </div>
            <div className="gStatCard">
              <strong>{completedTopics}</strong>
              <span>Chủ đề hoàn tất</span>
            </div>
          </div>
        </section>

        <section className="gPracticeSpotlight">
          <div className="gPracticeIcon">R</div>
          <div>
            <h3>Luyện tập ngẫu nhiên</h3>
            <p>10 câu hỏi ngẫu nhiên từ ngân hàng câu hỏi mới nhất của bạn.</p>
          </div>
          <Link className="gBtn light" href="/grammar/random">
            Bắt đầu
          </Link>
          <div className="gPracticeGlow" aria-hidden="true" />
        </section>
      </div>

      <TopicsGrid topics={topicCards} canEdit={canEdit} />

      <section className="gEditorial">
        <div className="gEditorialVisual" aria-hidden="true">
          <div className="gEditorialCard">
            <span>Focus Mode</span>
            <strong>80 / 20</strong>
            <p>20% lý thuyết, 80% thực hành để tăng phản xạ Part 5.</p>
          </div>
        </div>

        <div className="gEditorialCopy">
          <h2>Kinh nghiệm học Grammar hiệu quả</h2>
          <p>Đừng chỉ cố gắng nhớ mặt chữ. Hãy tập trung vào lỗi sai lặp lại, cấu trúc thường gặp và nhịp ôn tập ngắn nhưng đều.</p>
          <ul className="gEditorialList">
            <li>Phân tích lỗi sai sau mỗi bài test.</li>
            <li>Ghi chép các cấu trúc câu đặc biệt.</li>
            <li>Ôn tập định kỳ mỗi tuần một lần.</li>
          </ul>
          <div className="gEditorialFooter">Đăng nhập: {user.email}</div>
        </div>
      </section>
    </main>
  );
}
