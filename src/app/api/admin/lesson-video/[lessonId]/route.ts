// DELETE /api/admin/lesson-video/[lessonId]
// Removes the video from R2 and clears the storage key/size/upload time
// on the lessons row. The lesson row itself is kept.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { deleteObject } from "@/lib/r2-server";

export const runtime = "nodejs";

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

  const { data: lesson, error: lessonErr } = await admin
    .from("lessons")
    .select("video_storage_key")
    .eq("id", lessonId)
    .single();

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
  }
  if (!lesson.video_storage_key) {
    return NextResponse.json({ ok: true, no_video: true });
  }

  // Best-effort R2 delete. If the object is already gone, R2 still 204s.
  try {
    await deleteObject(lesson.video_storage_key);
  } catch (e) {
    console.error("[delete-video] R2 delete failed", e);
    return NextResponse.json(
      { error: "r2_delete_failed" },
      { status: 502 }
    );
  }

  const { error: updateErr } = await admin
    .from("lessons")
    .update({
      video_storage_key: null,
      video_size_bytes: null,
      video_uploaded_at: null,
    })
    .eq("id", lessonId);

  if (updateErr) {
    console.error("[delete-video] DB clear failed", updateErr);
    return NextResponse.json(
      { error: "db_update_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
