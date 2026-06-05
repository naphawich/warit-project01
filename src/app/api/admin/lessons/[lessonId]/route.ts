// PATCH  /api/admin/lessons/[lessonId] — edit title / description / duration /
//   preview flag of a lesson row.
// DELETE /api/admin/lessons/[lessonId] — remove the lesson row entirely
//   (also deletes its R2 video). Use /api/admin/lesson-video/[id] to drop just
//   the video while keeping the lesson.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { deleteObject } from "@/lib/r2-server";

export const runtime = "nodejs";

type PatchBody = {
  title?: string;
  description?: string | null;
  duration_seconds?: number | null;
  is_preview?: boolean;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;
  const { lessonId } = await params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ error: "missing_title" }, { status: 400 });
    update.title = t;
  }
  if (body.description !== undefined) {
    update.description = body.description?.trim() || null;
  }
  if (body.duration_seconds !== undefined) {
    update.duration_seconds =
      body.duration_seconds == null
        ? null
        : Math.max(0, Math.round(body.duration_seconds));
  }
  if (typeof body.is_preview === "boolean") {
    update.is_preview = body.is_preview;
  }

  const { error } = await admin
    .from("lessons")
    .update(update)
    .eq("id", lessonId);

  if (error) {
    console.error("[admin/lessons PATCH] failed", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;
  const { lessonId } = await params;

  const { data: lesson, error: lErr } = await admin
    .from("lessons")
    .select("id, course_id, chapter_index, lesson_index, global_index, video_storage_key")
    .eq("id", lessonId)
    .single();
  if (lErr || !lesson) {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
  }

  // Best-effort delete the video from R2 first.
  if (lesson.video_storage_key) {
    try {
      await deleteObject(lesson.video_storage_key);
    } catch (e) {
      console.warn("[admin/lessons DELETE] R2 delete failed", e);
    }
  }

  const { error: delErr } = await admin
    .from("lessons")
    .delete()
    .eq("id", lessonId);
  if (delErr) {
    console.error("[admin/lessons DELETE] failed", delErr);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  // Re-pack lesson_index within the chapter so there are no gaps.
  const { data: siblings } = await admin
    .from("lessons")
    .select("id, lesson_index")
    .eq("course_id", lesson.course_id)
    .eq("chapter_index", lesson.chapter_index)
    .gt("lesson_index", lesson.lesson_index)
    .order("lesson_index", { ascending: true });
  for (const s of siblings ?? []) {
    await admin
      .from("lessons")
      .update({ lesson_index: s.lesson_index - 1 })
      .eq("id", s.id);
  }

  return NextResponse.json({ ok: true });
}
