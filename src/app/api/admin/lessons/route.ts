// POST /api/admin/lessons — add a new (empty) lesson to a chapter.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";

export const runtime = "nodejs";

type Body = {
  chapterId: string;
  title?: string;
};

export async function POST(req: Request) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!body.chapterId) {
    return NextResponse.json({ error: "missing_chapter" }, { status: 400 });
  }

  // Resolve the chapter to learn its course + position.
  const { data: chapter, error: chErr } = await admin
    .from("chapters")
    .select("course_id, chapter_index")
    .eq("id", body.chapterId)
    .single();
  if (chErr || !chapter) {
    return NextResponse.json({ error: "chapter_not_found" }, { status: 404 });
  }

  // lesson_index = next within this chapter; global_index = next within course.
  const { data: lastInChapter } = await admin
    .from("lessons")
    .select("lesson_index")
    .eq("course_id", chapter.course_id)
    .eq("chapter_index", chapter.chapter_index)
    .order("lesson_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lessonIndex = (lastInChapter?.lesson_index ?? -1) + 1;

  const { data: lastGlobal } = await admin
    .from("lessons")
    .select("global_index")
    .eq("course_id", chapter.course_id)
    .order("global_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const globalIndex = (lastGlobal?.global_index ?? 0) + 1;

  const { data, error } = await admin
    .from("lessons")
    .insert({
      course_id: chapter.course_id,
      chapter_index: chapter.chapter_index,
      lesson_index: lessonIndex,
      global_index: globalIndex,
      title: body.title?.trim() || `บทเรียนที่ ${globalIndex}`,
      duration_seconds: null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[admin/lessons POST] insert failed", error);
    return NextResponse.json(
      { error: "db_error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, lesson: data });
}
