// GET /api/course-preview/[courseId]
// Public signed URL for a course's preview clip (no auth — previews are meant
// to be watched by prospective buyers).
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/auth-server";
import { presignDownloadUrl } from "@/lib/r2-server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const numericId = Number(courseId);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const admin = adminClient();
  const { data, error } = await admin
    .from("course_previews")
    .select("video_storage_key")
    .eq("course_id", numericId)
    .maybeSingle();

  if (error || !data?.video_storage_key) {
    return NextResponse.json({ error: "no_preview" }, { status: 404 });
  }

  const url = await presignDownloadUrl(data.video_storage_key, 60 * 60);
  return NextResponse.json({
    url,
    expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
  });
}
