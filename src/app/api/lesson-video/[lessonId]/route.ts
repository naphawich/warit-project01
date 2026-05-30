// Returns a time-limited signed URL for the lesson's video.
// Access is only granted to the lesson's course owner (entitlement) or to
// preview lessons that are marked is_preview = true.
import { NextResponse } from "next/server";
import { authenticateRequest, adminClient } from "@/lib/auth-server";
import { presignDownloadUrl } from "@/lib/r2-server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;

  const admin = adminClient();
  const { data: lesson, error: lessonErr } = await admin
    .from("lessons")
    .select("course_id, video_storage_key, is_preview")
    .eq("id", lessonId)
    .single();

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
  }
  if (!lesson.video_storage_key) {
    return NextResponse.json({ error: "no_video" }, { status: 404 });
  }

  // Preview lessons don't require auth
  if (!lesson.is_preview) {
    const authed = await authenticateRequest(req);
    if (!authed) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Admins can stream any video so they can verify uploads without
    // having to buy their own course.
    const { data: adminCheck } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", authed.user.id)
      .maybeSingle();

    if (!adminCheck?.is_admin) {
      // Owner check (uses service role so RLS doesn't get in the way; we
      // already validated identity via the bearer token)
      const { data: entitlement } = await admin
        .from("user_courses")
        .select("course_id")
        .eq("user_id", authed.user.id)
        .eq("course_id", lesson.course_id)
        .maybeSingle();

      if (!entitlement) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
  }

  const url = await presignDownloadUrl(lesson.video_storage_key, 60 * 60);
  return NextResponse.json({
    url,
    // Hint to the client when to refetch (slightly before expiry)
    expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
  });
}
