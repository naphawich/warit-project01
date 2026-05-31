// PATCH  /api/admin/chapters/[chapterId] — rename a chapter.
// DELETE /api/admin/chapters/[chapterId] — delete a chapter + all its lessons
//   (and their R2 videos). Remaining chapters are re-indexed so there are no
//   gaps in chapter_index.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { deleteObject } from "@/lib/r2-server";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;
  const { chapterId } = await params;

  let body: { title?: string };
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "missing_title" }, { status: 400 });
  }

  const { error } = await admin
    .from("chapters")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", chapterId);

  if (error) {
    console.error("[admin/chapters PATCH] failed", error);
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;
  const { chapterId } = await params;

  // Find the chapter so we know which course + index we're removing.
  const { data: chapter, error: chErr } = await admin
    .from("chapters")
    .select("course_id, chapter_index")
    .eq("id", chapterId)
    .single();
  if (chErr || !chapter) {
    return NextResponse.json({ error: "chapter_not_found" }, { status: 404 });
  }

  // Delete R2 videos for every lesson in this chapter (best effort).
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, video_storage_key")
    .eq("course_id", chapter.course_id)
    .eq("chapter_index", chapter.chapter_index);

  for (const l of lessons ?? []) {
    if (l.video_storage_key) {
      try {
        await deleteObject(l.video_storage_key);
      } catch (e) {
        console.warn("[admin/chapters DELETE] R2 delete failed", e);
      }
    }
  }

  // Remove lessons in this chapter, then the chapter itself.
  await admin
    .from("lessons")
    .delete()
    .eq("course_id", chapter.course_id)
    .eq("chapter_index", chapter.chapter_index);

  const { error: delErr } = await admin
    .from("chapters")
    .delete()
    .eq("id", chapterId);
  if (delErr) {
    console.error("[admin/chapters DELETE] chapter delete failed", delErr);
    return NextResponse.json(
      { error: "db_error", detail: delErr.message },
      { status: 500 }
    );
  }

  // Re-index the chapters that came after the deleted one so chapter_index
  // stays gap-free (and matches lesson.chapter_index after we shift those too).
  const { data: rest } = await admin
    .from("chapters")
    .select("id, chapter_index")
    .eq("course_id", chapter.course_id)
    .gt("chapter_index", chapter.chapter_index)
    .order("chapter_index", { ascending: true });

  for (const c of rest ?? []) {
    const newIdx = c.chapter_index - 1;
    await admin
      .from("chapters")
      .update({ chapter_index: newIdx })
      .eq("id", c.id);
    await admin
      .from("lessons")
      .update({ chapter_index: newIdx })
      .eq("course_id", chapter.course_id)
      .eq("chapter_index", c.chapter_index);
  }

  return NextResponse.json({ ok: true });
}
