import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import {
  startMultipartUpload,
  presignPartUrls,
} from "@/lib/r2-server";

export const runtime = "nodejs";

// 8 MB matches the lower bound for S3-compat multipart parts (5 MB) with
// some headroom; gives ~125 parts for a 1 GB file.
const DEFAULT_PART_SIZE = 8 * 1024 * 1024;

type Body = {
  // Either attach to an existing lesson row, or upload a course-level
  // preview clip (kind === "preview" + previewCourseId).
  kind?: "lesson" | "preview";
  lessonId?: string;       // existing public.lessons row to attach to
  previewCourseId?: number; // course_id for a course-level preview clip
  filename: string;        // original filename, for content-type hint
  contentType?: string;    // e.g. "video/mp4"
  totalSize: number;       // bytes — used to compute part count
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

  if (!body.totalSize || body.totalSize <= 0) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
  if (body.totalSize > MAX_SIZE) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const contentTypeHeader = body.contentType || "video/mp4";
  if (!contentTypeHeader.startsWith("video/")) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
  }

  const isPreview = body.kind === "preview";
  const ts = Date.now();
  let key: string;

  if (isPreview) {
    const courseId = Number(body.previewCourseId);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: "missing_course" }, { status: 400 });
    }
    key = `course-${courseId}/preview-${ts}.mp4`;
  } else {
    if (!body.lessonId) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    // Look up the lesson — also tells us course_id for the storage key
    const { data: lesson, error: lessonErr } = await admin
      .from("lessons")
      .select("id, course_id, global_index")
      .eq("id", body.lessonId)
      .single();

    if (lessonErr || !lesson) {
      return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });
    }
    // Storage key. Include a timestamp so re-uploads don't collide and the old
    // file remains until we explicitly delete it.
    key = `course-${lesson.course_id}/lesson-${lesson.global_index}-${ts}.mp4`;
  }

  const contentType = contentTypeHeader;

  // Init multipart on R2
  let uploadId: string;
  try {
    uploadId = await startMultipartUpload(key, contentType);
  } catch (e) {
    console.error("[upload/init] startMultipartUpload failed", e);
    return NextResponse.json({ error: "upload_init_failed" }, { status: 502 });
  }

  // Compute part plan + pre-sign every part. Browser will PUT them in
  // parallel and only return ETags to the complete endpoint.
  const partSize = DEFAULT_PART_SIZE;
  const partCount = Math.ceil(body.totalSize / partSize);
  let urls: string[];
  try {
    urls = await presignPartUrls(key, uploadId, partCount);
  } catch (e) {
    console.error("[upload/init] presignPartUrls failed", e);
    return NextResponse.json({ error: "upload_init_failed" }, { status: 502 });
  }

  return NextResponse.json({
    key,
    uploadId,
    partSize,
    partCount,
    urls,
  });
}
