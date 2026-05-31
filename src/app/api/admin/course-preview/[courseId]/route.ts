// DELETE /api/admin/course-preview/[courseId]
// Removes a course's preview clip from R2 and clears the course_previews row.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { deleteObject } from "@/lib/r2-server";

export const runtime = "nodejs";

export async function DELETE(
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

  const { data: row } = await admin
    .from("course_previews")
    .select("video_storage_key")
    .eq("course_id", numericId)
    .maybeSingle();

  if (row?.video_storage_key) {
    try {
      await deleteObject(row.video_storage_key);
    } catch (e) {
      console.warn("[admin/course-preview DELETE] R2 delete failed", e);
    }
  }

  const { error } = await admin
    .from("course_previews")
    .delete()
    .eq("course_id", numericId);

  if (error) {
    console.error("[admin/course-preview DELETE] failed", error);
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
