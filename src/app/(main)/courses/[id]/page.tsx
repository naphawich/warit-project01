import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Award,
  ChevronDown,
  PlayCircle,
  Lock,
  QrCode,
  Infinity as InfinityIcon,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VideoPreview } from "@/components/course/VideoPreview";
import { CourseActions } from "@/components/course/CourseActions";
import { courses as staticCatalog, faqs } from "@/lib/data";
import { dbRowToCourse, type DBCourseRow } from "@/lib/courses-db";

// Static IDs are known at build; DB IDs (100+) render on demand.
export function generateStaticParams() {
  return staticCatalog.map((c) => ({ id: String(c.id) }));
}

export const dynamicParams = true;
// Curriculum and preview clips come from the DB — refresh the static pages
// every few minutes so admin edits show up without a redeploy.
export const revalidate = 300;

async function loadCourse(id: string) {
  // Static catalog first — no network needed for ids 1-9
  const fromStatic = staticCatalog.find((c) => String(c.id) === id);
  if (fromStatic) return fromStatic;

  // Otherwise look it up in the DB
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", numericId)
    .eq("is_published", true)
    .single();
  if (!data) return null;
  return dbRowToCourse(data as DBCourseRow);
}

// Resolve the course's preview clip. Prefer the dedicated course-level preview
// (course_previews); fall back to a lesson flagged is_preview for backward
// compatibility. Returns the API endpoint to fetch the signed URL from.
async function loadPreviewSource(
  courseId: number
): Promise<{ endpoint: string; duration_seconds: number | null } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Dedicated course-level preview clip.
  const { data: cp } = await supabase
    .from("course_previews")
    .select("duration_seconds, video_storage_key")
    .eq("course_id", courseId)
    .maybeSingle();
  if (cp?.video_storage_key) {
    return {
      endpoint: `/api/course-preview/${courseId}`,
      duration_seconds: cp.duration_seconds,
    };
  }

  // 2. Fallback: a lesson marked is_preview with an uploaded video.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, duration_seconds, video_storage_key, is_preview")
    .eq("course_id", courseId)
    .eq("is_preview", true)
    .not("video_storage_key", "is", null)
    .order("global_index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lesson) {
    return {
      endpoint: `/api/lesson-video/${lesson.id}`,
      duration_seconds: lesson.duration_seconds,
    };
  }
  return null;
}

type CurriculumChapter = {
  chapterIndex: number;
  title: string;
  lessons: {
    id: string;
    title: string;
    durationSeconds: number | null;
    isFreePreview: boolean;
  }[];
};

// Only the curriculum an admin actually authored. Static courses that were
// never seeded return [] and the section is hidden — the learn page's
// generated placeholder lessons shouldn't be shown to buyers as a syllabus.
async function loadCurriculum(courseId: number): Promise<CurriculumChapter[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [lsRes, chRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, chapter_index, lesson_index, title, duration_seconds, is_preview, video_storage_key")
      .eq("course_id", courseId)
      .order("global_index", { ascending: true }),
    supabase
      .from("chapters")
      .select("chapter_index, title")
      .eq("course_id", courseId)
      .order("chapter_index", { ascending: true }),
  ]);
  const lessons = lsRes.data ?? [];
  if (lessons.length === 0) return [];
  const chapterTitles = new Map(
    (chRes.data ?? []).map((c) => [c.chapter_index as number, c.title as string])
  );
  const indices = Array.from(new Set(lessons.map((l) => l.chapter_index as number))).sort(
    (a, b) => a - b
  );
  return indices.map((ci, order) => ({
    chapterIndex: ci,
    title: chapterTitles.get(ci) ?? `บทที่ ${order + 1}`,
    lessons: lessons
      .filter((l) => l.chapter_index === ci)
      .sort((a, b) => (a.lesson_index as number) - (b.lesson_index as number))
      .map((l) => ({
        id: l.id as string,
        title: (l.title as string | null) ?? "บทเรียน",
        durationSeconds: (l.duration_seconds as number | null) ?? null,
        isFreePreview: !!l.is_preview && !!l.video_storage_key,
      })),
  }));
}

function formatMinutes(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}

function formatClip(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

// Per-course title/description so search results and shared links show the
// course itself rather than the site-wide defaults.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await loadCourse(id);
  if (!course) return {};
  const title = `${course.title} | Warit Biology`;
  return {
    title,
    description: course.shortDescription,
    // openGraph replaces the root one wholesale, so repeat the shared fields.
    openGraph: {
      type: "website",
      locale: "th_TH",
      siteName: "Warit Biology",
      title,
      description: course.shortDescription,
      images: ["/hero-warit.jpg"],
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await loadCourse(id);
  if (!course) notFound();

  const [previewSource, curriculum] = await Promise.all([
    loadPreviewSource(course.id),
    loadCurriculum(course.id),
  ]);
  const curriculumLessonCount = curriculum.reduce((n, c) => n + c.lessons.length, 0);
  const curriculumSeconds = curriculum.reduce(
    (n, c) => n + c.lessons.reduce((m, l) => m + (l.durationSeconds ?? 0), 0),
    0
  );

  const discount =
    course.originalPrice > course.price
      ? Math.round(
          ((course.originalPrice - course.price) / course.originalPrice) * 100
        )
      : 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/#courses"
              className="hover:text-brand-700 transition-colors"
            >
              คอร์สเรียน
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium truncate max-w-[40ch]">
              {course.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0">
                  {course.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-brand-200 text-brand-700"
                >
                  {course.level}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                {course.title}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                {course.shortDescription}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                {course.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                    <span className="font-semibold text-slate-900">
                      {course.rating}
                    </span>
                    <span className="text-slate-500">
                      ({course.reviewsCount.toLocaleString()} รีวิว)
                    </span>
                  </div>
                )}
                {course.students > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>{course.students.toLocaleString()} ผู้เรียน</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-600">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessons} บทเรียน</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{course.hours} ชั่วโมง</span>
                </div>
              </div>
            </div>

            {/* Mobile video preview */}
            <div className="lg:hidden">
              <VideoPreview
                color={course.color}
                title={course.title}
                preview={course.previewVideo}
                previewVideoEndpoint={previewSource?.endpoint}
                previewDurationSeconds={previewSource?.duration_seconds}
              />
            </div>

            {/* Instructor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                ผู้สอน
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-brand-100">
                  <AvatarFallback className="bg-brand-700 text-white font-semibold">
                    {course.instructor.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {course.instructor.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {course.instructor.role}
                  </div>
                </div>
                <Button
                  variant="outline"
                  render={<Link href="/#instructor" />}
                  nativeButton={false}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 hidden sm:inline-flex"
                >
                  ดูประวัติ
                </Button>
              </div>
            </div>

            {/* About this course */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                เกี่ยวกับคอร์สนี้
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {course.longDescription}
              </p>
            </section>

            {/* What you'll learn */}
            <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">
                สิ่งที่คุณจะได้เรียนรู้
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.whatYouLearn.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum (only when authored in the DB) */}
            {curriculum.length > 0 && (
              <section>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    เนื้อหาในคอร์ส
                  </h2>
                  <p className="text-sm text-slate-500">
                    {curriculum.length} บท · {curriculumLessonCount} คลิป
                    {curriculumSeconds > 0 && ` · ${formatMinutes(curriculumSeconds)}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                  {curriculum.map((chapter, i) => (
                    <details key={chapter.chapterIndex} open={i === 0} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                        <span className="font-semibold text-slate-900">
                          {chapter.title}
                        </span>
                        <span className="flex items-center gap-3 text-sm text-slate-500 shrink-0">
                          {chapter.lessons.length} คลิป
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <ul className="px-5 pb-4 space-y-1">
                        {chapter.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 py-2 text-sm"
                          >
                            {lesson.isFreePreview ? (
                              <PlayCircle className="h-4 w-4 text-brand-600 shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className="flex-1 text-slate-700">
                              {lesson.title}
                            </span>
                            {lesson.isFreePreview && (
                              <Badge className="bg-gold-100 text-gold-900 hover:bg-gold-100 border-0">
                                ดูฟรี
                              </Badge>
                            )}
                            {formatClip(lesson.durationSeconds) && (
                              <span className="text-slate-400 tabular-nums">
                                {formatClip(lesson.durationSeconds)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ before buying */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                คำถามก่อนซื้อ
              </h2>
              <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                {faqs.map((faq) => (
                  <details key={faq.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky right card (desktop) */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Video preview - desktop only */}
              <div className="hidden lg:block">
                <VideoPreview
                color={course.color}
                title={course.title}
                preview={course.previewVideo}
                previewVideoEndpoint={previewSource?.endpoint}
                previewDurationSeconds={previewSource?.duration_seconds}
              />
              </div>

              {/* Price card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-3xl font-bold text-slate-900">
                    ฿{course.price.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <span className="text-base text-slate-400 line-through mb-1">
                      ฿{course.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {discount > 0 ? (
                  <div className="flex items-center gap-2 mb-5">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
                      ลด {discount}%
                    </Badge>
                  </div>
                ) : (
                  <div className="mb-5" />
                )}

                <CourseActions
                  item={{
                    id: course.id,
                    title: course.title,
                    instructor: course.instructor.name,
                    price: course.price,
                    originalPrice: course.originalPrice,
                    color: course.color,
                    category: course.category,
                  }}
                />


                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-brand-600" />
                    คอร์สนี้รวม
                  </div>
                  <ul className="space-y-2.5">
                    {course.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-brand-600 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <QrCode className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    ชำระผ่าน QR พร้อมเพย์ เข้าเรียนได้ทันทีหลังจ่าย
                  </div>
                  <div className="flex items-start gap-2">
                    <InfinityIcon className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    ซื้อครั้งเดียว ไม่มีค่ารายเดือน
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    <span>
                      อ่าน
                      <Link href="/terms" className="mx-1 text-brand-700 underline underline-offset-2">
                        เงื่อนไขการใช้งาน
                      </Link>
                      เรื่องการคืนเงินก่อนซื้อ
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
