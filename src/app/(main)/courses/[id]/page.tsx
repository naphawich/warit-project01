import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Heart,
  Share2,
  Award,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VideoPreview } from "@/components/course/VideoPreview";
import { CourseActions } from "@/components/course/CourseActions";
import { courses as staticCatalog } from "@/lib/data";
import { dbRowToCourse, type DBCourseRow } from "@/lib/courses-db";

// Static IDs are known at build; DB IDs (100+) render on demand.
export function generateStaticParams() {
  return staticCatalog.map((c) => ({ id: String(c.id) }));
}

export const dynamicParams = true;

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

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await loadCourse(id);
  if (!course) notFound();

  const previewSource = await loadPreviewSource(course.id);

  const discount = Math.round(
    ((course.originalPrice - course.price) / course.originalPrice) * 100
  );

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white">
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
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-900">
                    {course.rating}
                  </span>
                  <span className="text-slate-500">
                    ({course.reviewsCount.toLocaleString()} รีวิว)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>{course.students.toLocaleString()} ผู้เรียน</span>
                </div>
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
                  <span className="text-base text-slate-400 line-through mb-1">
                    ฿{course.originalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
                    ลด {discount}%
                  </Badge>
                </div>

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

                <p className="mt-5 text-center text-xs text-slate-500">
                  รับประกันคืนเงิน 14 วัน หากไม่พอใจ
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
