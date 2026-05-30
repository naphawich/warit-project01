// Seed public.lessons from the client-side curriculum generator so admin can
// then upload videos against each row. Idempotent (uses upsert).
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { courses as catalog } from "@/lib/data";
import { dbRowToCourse, type DBCourseRow } from "@/lib/courses-db";
import { generateCurriculum, flattenLessons } from "@/lib/lessons";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;

  const { courseId } = await params;
  const numericId = Number(courseId);

  // Static catalog hits first; fall back to public.courses for DB-created
  // courses (ids 100+).
  let course = catalog.find((c) => c.id === numericId);
  if (!course) {
    const { data } = await admin
      .from("courses")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();
    if (data) course = dbRowToCourse(data as DBCourseRow);
  }
  if (!course) {
    return NextResponse.json({ error: "course_not_found" }, { status: 404 });
  }

  const chapters = generateCurriculum(course);
  const lessons = flattenLessons(chapters);

  // Build rows referencing chapter/lesson positions
  const rows: Array<{
    course_id: number;
    chapter_index: number;
    lesson_index: number;
    global_index: number;
    title: string;
    duration_seconds: number;
  }> = [];

  let globalIdx = 1;
  for (let c = 0; c < chapters.length; c++) {
    const chapter = chapters[c];
    for (let l = 0; l < chapter.lessons.length; l++) {
      const lesson = chapter.lessons[l];
      rows.push({
        course_id: course.id,
        chapter_index: c,
        lesson_index: l,
        global_index: globalIdx,
        title: lesson.title,
        duration_seconds: Math.round(lesson.durationMinutes * 60),
      });
      globalIdx++;
    }
  }

  const { error } = await admin
    .from("lessons")
    .upsert(rows, { onConflict: "course_id,global_index" });

  if (error) {
    console.error("[seed-lessons] upsert failed", error);
    return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seeded: rows.length });
}
