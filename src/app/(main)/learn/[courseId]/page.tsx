"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Play,
  CheckCircle2,
  Circle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Clock,
  BookOpen,
  Award,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/lib/use-user";
import { useIsCourseOwned } from "@/lib/use-ownership";
import { courses as catalog } from "@/lib/data";
import {
  generateCurriculum,
  flattenLessons,
  type Lesson,
} from "@/lib/lessons";

export default function LearnPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const numericId = Number(courseId);
  const { owned, loading: ownershipLoading } = useIsCourseOwned(numericId);
  const course = useMemo(
    () => catalog.find((c) => c.id === numericId),
    [numericId]
  );
  const chapters = useMemo(
    () => (course ? generateCurriculum(course) : []),
    [course]
  );
  const lessons = useMemo(() => flattenLessons(chapters), [chapters]);
  const totalMinutes = useMemo(
    () => Math.round(lessons.reduce((s, l) => s + l.durationMinutes, 0)),
    [lessons]
  );

  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, true>>({});

  // Redirect logged-out users to login
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(`/login?next=/learn/${courseId}`);
    }
  }, [userLoading, user, router, courseId]);

  // Load saved progress from localStorage
  useEffect(() => {
    if (!course || !user) return;
    try {
      const key = `learn-progress-${user.id}-${course.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          completed?: Record<string, true>;
          activeLessonIdx?: number;
        };
        if (parsed.completed) setCompleted(parsed.completed);
        if (typeof parsed.activeLessonIdx === "number") {
          setActiveLessonIdx(parsed.activeLessonIdx);
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [course, user]);

  // Persist progress
  useEffect(() => {
    if (!course || !user) return;
    try {
      const key = `learn-progress-${user.id}-${course.id}`;
      localStorage.setItem(
        key,
        JSON.stringify({ completed, activeLessonIdx })
      );
    } catch {
      // ignore
    }
  }, [completed, activeLessonIdx, course, user]);

  if (userLoading || !user || ownershipLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <NotFoundState
        title="ไม่พบคอร์สนี้"
        message="คอร์สที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ"
      />
    );
  }

  if (!owned) {
    return <NotOwnedState courseId={course.id} title={course.title} />;
  }

  const activeLesson = lessons[activeLessonIdx] ?? lessons[0];
  const completedCount = Object.keys(completed).length;
  const progress = Math.round((completedCount / lessons.length) * 100);
  const isLessonComplete = (lesson: Lesson) => !!completed[lesson.id];

  const goToLesson = (idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    setActiveLessonIdx(idx);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleComplete = (lessonId: string) => {
    setCompleted((prev) => {
      const next = { ...prev };
      if (next[lessonId]) delete next[lessonId];
      else next[lessonId] = true;
      return next;
    });
  };

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      {/* Top breadcrumb */}
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link
              href="/my-courses"
              className="hover:text-brand-700 transition-colors"
            >
              คอร์สของฉัน
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-slate-900 font-medium truncate">
              {course.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main video + lesson content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              key={activeLesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Video player — real iframe when the lesson has one, mockup otherwise */}
              {activeLesson.video?.type === "youtube" ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/15">
                  <iframe
                    key={activeLesson.id}
                    src={`https://www.youtube.com/embed/${activeLesson.video.id}?rel=0&modestbranding=1`}
                    title={activeLesson.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  className={`relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${course.color} shadow-xl shadow-slate-900/15`}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      className="group flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white/90 shadow-2xl hover:bg-white hover:scale-110 transition-all"
                      aria-label="เล่น"
                    >
                      <Play
                        className="h-9 w-9 sm:h-10 sm:w-10 text-brand-700 ml-1"
                        fill="currentColor"
                      />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-xs font-medium">
                      บทที่ {activeLesson.index} / {lessons.length}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      {activeLesson.duration}
                    </span>
                  </div>
                </div>
              )}

              {/* Lesson info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wider text-brand-700 mb-1">
                      บทเรียนที่ {activeLesson.index}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                      {activeLesson.title}
                    </h1>
                  </div>
                  <Button
                    onClick={() => toggleComplete(activeLesson.id)}
                    variant={isLessonComplete(activeLesson) ? "default" : "outline"}
                    className={
                      isLessonComplete(activeLesson)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-brand-200 text-brand-700 hover:bg-brand-50"
                    }
                  >
                    {isLessonComplete(activeLesson) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        เรียนจบแล้ว
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1.5" />
                        ทำเครื่องหมายว่าจบ
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  เนื้อหาบทเรียนนี้จะพาคุณเข้าใจ{" "}
                  <span className="text-slate-900 font-medium">
                    {activeLesson.title}
                  </span>{" "}
                  ผ่านวิดีโอบรรยาย ตัวอย่างจริง และแบบฝึกหัดทบทวน
                  คุณสามารถดูซ้ำได้ไม่จำกัด
                </p>
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={() => goToLesson(activeLessonIdx - 1)}
                  disabled={activeLessonIdx === 0}
                  variant="outline"
                  className="border-slate-200 text-slate-700 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  บทก่อนหน้า
                </Button>
                <Button
                  onClick={() => {
                    if (!isLessonComplete(activeLesson)) {
                      toggleComplete(activeLesson.id);
                    }
                    goToLesson(activeLessonIdx + 1);
                  }}
                  disabled={activeLessonIdx === lessons.length - 1}
                  className="flex-1 bg-brand-700 hover:bg-brand-800 text-white disabled:opacity-50"
                >
                  บทต่อไป
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar: chapters + lessons */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-slate-900">
                    เนื้อหาคอร์ส
                  </h2>
                  <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0">
                    {completedCount}/{lessons.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {lessons.length} บทเรียน
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.floor(totalMinutes / 60)} ชม. {totalMinutes % 60} นาที
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-slate-500">
                  เรียนไปแล้ว {progress}%
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="border-b border-slate-100 last:border-0">
                    <div className="px-5 py-3 bg-slate-50/60">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        บทที่ {chapter.index}
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {chapter.title}
                      </div>
                    </div>
                    <ul>
                      {chapter.lessons.map((lesson) => {
                        const idx = lessons.findIndex((l) => l.id === lesson.id);
                        const active = idx === activeLessonIdx;
                        const done = isLessonComplete(lesson);
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => goToLesson(idx)}
                              className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-brand-50/60 transition-colors ${
                                active ? "bg-brand-50 border-l-2 border-brand-600" : ""
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              ) : active ? (
                                <Play
                                  className="h-4 w-4 text-brand-700 flex-shrink-0"
                                  fill="currentColor"
                                />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm line-clamp-1 ${
                                    active
                                      ? "font-semibold text-brand-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {lesson.index}. {lesson.title}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer card: completion CTA */}
              {progress === 100 && (
                <div className="p-5 border-t border-slate-100 bg-emerald-50/50">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 mb-1">
                        เรียนจบทุกบทแล้ว!
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">
                        ใบประกาศนียบัตรของคุณกำลังจัดส่งทางอีเมล
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NotOwnedState({
  courseId,
  title,
}: {
  courseId: number;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
          <Lock className="h-8 w-8 text-amber-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          คุณยังไม่มีคอร์สนี้
        </h1>
        <p className="text-slate-600 mb-1">
          คอร์ส <strong>{title}</strong>
        </p>
        <p className="text-slate-600 mb-8">
          ซื้อคอร์สนี้เพื่อปลดล็อกการเข้าถึงเนื้อหาทั้งหมด
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            render={<Link href={`/courses/${courseId}`} />}
            nativeButton={false}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            ดูรายละเอียดและซื้อคอร์ส
          </Button>
          <Button
            render={<Link href="/my-courses" />}
            nativeButton={false}
            variant="outline"
            className="border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            คอร์สของฉัน
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotFoundState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>
      <p className="text-slate-600 mb-8">{message}</p>
      <Button
        render={<Link href="/courses" />}
        nativeButton={false}
        className="bg-brand-700 hover:bg-brand-800 text-white"
      >
        ดูคอร์สทั้งหมด
      </Button>
    </div>
  );
}
