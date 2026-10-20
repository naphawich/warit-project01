"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  BookOpen,
  ArrowRight,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/use-user";
import { courses as catalog } from "@/lib/data";
import type { Course } from "@/lib/data";
import { dbRowToCourse, type DBCourseRow } from "@/lib/courses-db";

type Entitlement = {
  course_id: number;
  acquired_at: string;
  order_id: string | null;
};

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Completed lessons (server) and real lesson counts per course, for the
  // progress bar on each card.
  const [serverDone, setServerDone] = useState<Record<number, number>>({});
  const [dbLessonCount, setDbLessonCount] = useState<Record<number, number>>({});
  // Bumped by the retry button to re-run the fetch.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?next=/my-courses");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      // Pull entitlements + any DB-only courses in parallel — a single
      // round-trip per query, no waterfall.
      const [entRes, courseRes, progressRes, lessonsRes] = await Promise.all([
        supabase
          .from("user_courses")
          .select("course_id, acquired_at, order_id")
          .order("acquired_at", { ascending: false }),
        supabase.from("courses").select("*"),
        supabase
          .from("lesson_progress")
          .select("course_id")
          .eq("completed", true),
        supabase.from("lessons").select("course_id"),
      ]);
      if (!active) return;
      // A failed entitlement query must not render as "no courses yet".
      if (entRes.error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setLoadError(false);
      const countBy = (rows: { course_id: number }[] | null) =>
        (rows ?? []).reduce<Record<number, number>>((acc, r) => {
          acc[r.course_id] = (acc[r.course_id] ?? 0) + 1;
          return acc;
        }, {});
      setServerDone(countBy(progressRes.data as { course_id: number }[] | null));
      setDbLessonCount(countBy(lessonsRes.data as { course_id: number }[] | null));
      setEntitlements((entRes.data as Entitlement[]) ?? []);
      setDbCourses(
        ((courseRes.data as DBCourseRow[]) ?? []).map(dbRowToCourse)
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  // Progress = max(server completions, this device's cache). Generated
  // lessons (courses never seeded in the DB) only exist in localStorage.
  const progressById = useMemo(() => {
    const out: Record<number, { pct: number; nextLesson: number | null }> = {};
    if (!user) return out;
    for (const e of entitlements) {
      let localDone = 0;
      let nextLesson: number | null = null;
      try {
        const raw = localStorage.getItem(`learn-progress-${user.id}-${e.course_id}`);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            completed?: Record<string, true>;
            activeLessonIdx?: number;
          };
          localDone = Object.keys(parsed.completed ?? {}).length;
          if (typeof parsed.activeLessonIdx === "number") {
            nextLesson = parsed.activeLessonIdx + 1;
          }
        }
      } catch {
        // storage unavailable
      }
      const course = catalog.find((c) => c.id === e.course_id) ??
        dbCourses.find((c) => c.id === e.course_id);
      const total = dbLessonCount[e.course_id] || course?.lessons || 0;
      const done = Math.max(serverDone[e.course_id] ?? 0, localDone);
      out[e.course_id] = {
        pct: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0,
        nextLesson,
      };
    }
    return out;
  }, [user, entitlements, dbCourses, serverDone, dbLessonCount]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  // Static catalog wins on id collision (1-9 ship with the app); DB courses
  // (100+) cover anything an admin created later.
  const courseById = new Map<number, Course>();
  for (const c of dbCourses) courseById.set(c.id, c);
  for (const c of catalog) courseById.set(c.id, c);

  const myCourses = entitlements
    .map((e) => {
      const c = courseById.get(e.course_id);
      return c ? { ...c, acquired_at: e.acquired_at } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">คอร์สของฉัน</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="max-w-3xl mb-10">
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            คอร์สของฉัน
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            พื้นที่เรียนรู้ของคุณ
          </h1>
          <p className="text-slate-600 leading-relaxed">
            คอร์สทั้งหมดที่คุณซื้อแล้ว เรียนได้ตลอดชีพ
            ทบทวนซ้ำได้ไม่จำกัด
          </p>
        </div>

        {loadError ? (
          <LoadErrorState
            onRetry={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
          />
        ) : myCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-brand-700/5 hover:border-brand-200 transition-all"
              >
                <Link
                  href={`/learn/${course.id}`}
                  className="block"
                  aria-label={course.title}
                >
                  <div
                    className={`aspect-video bg-gradient-to-br ${course.color} relative flex items-center justify-center overflow-hidden`}
                  >
                    <BookOpen
                      className="h-20 w-20 text-white/30 group-hover:scale-110 transition-transform"
                      strokeWidth={1.5}
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-500/95 text-white border-0 hover:bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        คุณเป็นเจ้าของ
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    <div className="text-xs font-medium text-brand-700">
                      {course.category}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-brand-700 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} บทเรียน
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {course.hours} ชม.
                      </div>
                    </div>
                    {(() => {
                      const p = progressById[course.id] ?? { pct: 0, nextLesson: null };
                      const label =
                        p.pct >= 100
                          ? "ทบทวนอีกครั้ง"
                          : p.pct > 0 || p.nextLesson
                            ? `เรียนต่อ${p.nextLesson ? ` บทที่ ${p.nextLesson}` : ""}`
                            : "เริ่มเรียน";
                      return (
                        <>
                          <div className="pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-500">ความคืบหน้า</span>
                              <span className="font-semibold text-brand-700 tabular-nums">
                                {p.pct}%
                              </span>
                            </div>
                            <div
                              className="h-2 rounded-full bg-slate-100 overflow-hidden"
                              role="progressbar"
                              aria-valuenow={p.pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label="ความคืบหน้าของคอร์ส"
                            >
                              <div
                                className="h-full rounded-full bg-brand-600 transition-all"
                                style={{ width: `${p.pct}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-400 mt-2">
                              ซื้อเมื่อ{" "}
                              {new Date(course.acquired_at).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                          <Button
                            className="h-11 bg-brand-700 hover:bg-brand-800 text-white pointer-events-none"
                          >
                            {label}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        โหลดคอร์สของคุณไม่สำเร็จ
      </h2>
      <p className="text-slate-600 mb-6">
        คอร์สที่ซื้อไว้ยังอยู่ครบ ระบบเชื่อมต่อไม่ได้ชั่วคราว ลองใหม่อีกครั้ง
      </p>
      <Button
        onClick={onRetry}
        className="h-11 px-6 bg-brand-700 hover:bg-brand-800 text-white"
      >
        <RotateCw className="h-4 w-4 mr-1.5" />
        ลองใหม่
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
        <ShoppingBag className="h-10 w-10 text-brand-700" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        ยังไม่มีคอร์สที่ซื้อ
      </h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        เริ่มต้นเส้นทางการเรียนรู้ของคุณ
        เลือกคอร์สที่คุณสนใจและเรียนรู้ตามจังหวะของตัวเอง
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          render={<Link href="/courses" />}
          nativeButton={false}
          className="h-11 px-6 bg-brand-700 hover:bg-brand-800 text-white"
        >
          เลือกคอร์สเรียน
        </Button>
      </div>
    </div>
  );
}
