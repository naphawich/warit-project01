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
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/use-user";
import { useAuth } from "@/lib/auth-context";
import { useIsCourseOwned } from "@/lib/use-ownership";
import { courses as catalog } from "@/lib/data";
import type { Course } from "@/lib/data";
import { loadCourseById } from "@/lib/courses-db";
import {
  generateCurriculum,
  flattenLessons,
  formatDuration,
  type Lesson,
} from "@/lib/lessons";

type DBLesson = {
  id: string;
  chapter_index: number;
  lesson_index: number;
  global_index: number;
  title: string | null;
  description: string | null;
  duration_seconds: number | null;
  video_storage_key: string | null;
};

type DBChapter = {
  id: string;
  chapter_index: number;
  title: string;
};

export default function LearnPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const numericId = Number(courseId);
  const { owned: ownedReal, loading: ownershipLoading } =
    useIsCourseOwned(numericId);
  const { profile } = useAuth();
  // Admins can preview any course without buying — they're the ones who
  // uploaded the videos in the first place.
  const owned = ownedReal || !!profile?.is_admin;
  // undefined = still resolving; null = confirmed not found
  const [course, setCourse] = useState<Course | undefined | null>(() =>
    catalog.find((c) => c.id === numericId)
  );
  useEffect(() => {
    if (course !== undefined) return;
    let active = true;
    (async () => {
      const found = await loadCourseById(catalog, supabase, numericId);
      if (active) setCourse(found);
    })();
    return () => {
      active = false;
    };
  }, [course, numericId]);

  // Pull DB lesson rows so we can overlay R2 video info onto the generated
  // curriculum. If the course hasn't been seeded yet, dbLessons stays [].
  const [dbLessons, setDbLessons] = useState<DBLesson[]>([]);
  const [dbChapters, setDbChapters] = useState<DBChapter[]>([]);
  useEffect(() => {
    if (!course) return;
    let active = true;
    (async () => {
      const [lsRes, chRes] = await Promise.all([
        supabase
          .from("lessons")
          .select(
            "id, chapter_index, lesson_index, global_index, title, description, duration_seconds, video_storage_key"
          )
          .eq("course_id", course.id)
          .order("global_index", { ascending: true }),
        supabase
          .from("chapters")
          .select("id, chapter_index, title")
          .eq("course_id", course.id)
          .order("chapter_index", { ascending: true }),
      ]);
      if (!active) return;
      setDbLessons((lsRes.data as DBLesson[]) ?? []);
      setDbChapters((chRes.data as DBChapter[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [course]);

  const chapters = useMemo(() => {
    if (!course) return [];

    // When the course has been authored in the DB (admin added chapters +
    // lessons), the DB is the source of truth — build the curriculum straight
    // from it so added/removed chapters and lessons show up exactly.
    if (dbChapters.length > 0 || dbLessons.length > 0) {
      const chapterMeta = new Map(
        dbChapters.map((c) => [c.chapter_index, c.title])
      );
      // Discover chapter indices from both tables in case one is sparse.
      const indices = Array.from(
        new Set([
          ...dbChapters.map((c) => c.chapter_index),
          ...dbLessons.map((l) => l.chapter_index),
        ])
      ).sort((a, b) => a - b);

      return indices.map((ci, order) => {
        const chapterLessons = dbLessons
          .filter((l) => l.chapter_index === ci)
          .sort((a, b) => a.lesson_index - b.lesson_index)
          .map((db) => {
            const seconds = db.duration_seconds ?? null;
            return {
              id: db.id,
              index: db.global_index,
              title: db.title ?? "บทเรียน",
              duration: seconds != null ? formatDuration(seconds) : "—",
              durationMinutes: seconds != null ? seconds / 60 : 0,
              dbId: db.id,
              hasR2Video: !!db.video_storage_key,
              description: db.description,
            } satisfies Lesson;
          });
        return {
          id: `ch-${ci}`,
          index: order + 1,
          title: chapterMeta.get(ci) ?? `บทที่ ${ci + 1}`,
          lessons: chapterLessons,
        };
      });
    }

    // No DB rows yet — fall back to the generated curriculum (static courses
    // that were never seeded).
    return generateCurriculum(course);
  }, [course, dbLessons, dbChapters]);

  const lessons = useMemo(() => flattenLessons(chapters), [chapters]);
  const totalMinutes = useMemo(
    () => Math.round(lessons.reduce((s, l) => s + l.durationMinutes, 0)),
    [lessons]
  );

  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, true>>({});

  // R2 signed URL for the active lesson — refetched whenever the active
  // lesson changes (and refreshed before the 1-hour URL expires).
  const [r2VideoUrl, setR2VideoUrl] = useState<string | null>(null);
  const [r2VideoError, setR2VideoError] = useState<string | null>(null);
  // Bumped by a timer to re-fetch the signed URL before it expires.
  const [r2RefreshTick, setR2RefreshTick] = useState(0);
  const activeLessonForFetch = lessons[activeLessonIdx];
  const activeDbId = activeLessonForFetch?.dbId;
  const activeHasR2 = activeLessonForFetch?.hasR2Video;

  // Clear any stale video the moment the lesson changes. Kept separate from the
  // fetch effect so a refresh tick can swap the URL in place without flicker.
  useEffect(() => {
    setR2VideoUrl(null);
    setR2VideoError(null);
    setR2RefreshTick(0);
  }, [activeDbId, activeHasR2]);

  useEffect(() => {
    if (!user || !activeDbId || !activeHasR2) return;
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !active) return;
      try {
        const res = await fetch(`/api/lesson-video/${activeDbId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!active) return;
        if (!res.ok) {
          setR2VideoError("ไม่สามารถโหลดวิดีโอ");
          return;
        }
        const json = (await res.json()) as {
          url: string;
          expires_at?: string;
        };
        if (!active) return;
        setR2VideoError(null);
        setR2VideoUrl(json.url);
        // Schedule a refresh ~1 min before the signed URL expires so long
        // videos / long sessions never hit a dead URL mid-playback.
        const msUntilExpiry = json.expires_at
          ? new Date(json.expires_at).getTime() - Date.now()
          : 55 * 60 * 1000;
        const refreshInMs = Math.max(30_000, msUntilExpiry - 60_000);
        refreshTimer = setTimeout(() => {
          if (active) setR2RefreshTick((t) => t + 1);
        }, refreshInMs);
      } catch {
        if (active) setR2VideoError("เครือข่ายมีปัญหา");
      }
    })();
    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [user, activeDbId, activeHasR2, r2RefreshTick]);

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

  // Cross-device progress: lesson_progress rows exist only for DB-backed
  // lessons (lesson_id is a FK to lessons.id). Synthetic/generated lessons stay
  // in localStorage only.
  const dbLessonIdSet = useMemo(
    () => new Set(dbLessons.map((l) => l.id)),
    [dbLessons]
  );

  // Overlay server progress on top of the localStorage cache (server wins).
  useEffect(() => {
    if (!user || !course || dbLessons.length === 0) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("course_id", course.id);
      if (!active || !data) return;
      setCompleted((prev) => {
        const next = { ...prev };
        for (const row of data as {
          lesson_id: string;
          completed: boolean;
        }[]) {
          if (row.completed) next[row.lesson_id] = true;
          else delete next[row.lesson_id];
        }
        return next;
      });
    })();
    return () => {
      active = false;
    };
  }, [user, course, dbLessons.length]);

  if (userLoading || !user || ownershipLoading || course === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (course === null) {
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
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const isLessonComplete = (lesson: Lesson) => !!completed[lesson.id];

  const goToLesson = (idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    setActiveLessonIdx(idx);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleComplete = (lessonId: string) => {
    const nowComplete = !completed[lessonId];
    setCompleted((prev) => {
      const next = { ...prev };
      if (nowComplete) next[lessonId] = true;
      else delete next[lessonId];
      return next;
    });
    // Persist DB-backed lessons to lesson_progress (fire-and-forget; localStorage
    // already covers the offline + synthetic-lesson cases).
    if (user && dbLessonIdSet.has(lessonId)) {
      void supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            course_id: course.id,
            lesson_id: lessonId,
            completed: nowComplete,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        )
        .then(({ error }) => {
          if (error) {
            console.warn("[learn] progress sync failed", error.message);
          }
        });
    }
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
              {/* Video player: R2 (uploaded) → YouTube preview → gradient mockup */}
              {activeLesson.hasR2Video && r2VideoUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/15">
                  <video
                    key={activeLesson.id}
                    src={r2VideoUrl}
                    controls
                    controlsList="nodownload"
                    playsInline
                    // Only fetch the moov/header, not the body, until play.
                    // Cuts cold-load from full file → ~1 MB for typical MP4.
                    preload="metadata"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : activeLesson.hasR2Video && !r2VideoError ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/15 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              ) : activeLesson.hasR2Video && r2VideoError ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/15 flex flex-col items-center justify-center text-white gap-2">
                  <span className="text-sm">{r2VideoError}</span>
                  <span className="text-xs text-white/60">รีเฟรชหน้าเพื่อลองใหม่</span>
                </div>
              ) : activeLesson.video?.type === "youtube" ? (
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

                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {activeLesson.description ? (
                    activeLesson.description
                  ) : (
                    <>
                      เนื้อหาบทเรียนนี้จะพาคุณเข้าใจ{" "}
                      <span className="text-slate-900 font-medium">
                        {activeLesson.title}
                      </span>{" "}
                      ผ่านวิดีโอบรรยาย ตัวอย่างจริง และแบบฝึกหัดทบทวน
                      คุณสามารถดูซ้ำได้ไม่จำกัด
                    </>
                  )}
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
