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
  lessonId: string;        // existing public.lessons row to attach to
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

  if (!body.lessonId || !body.totalSize || body.totalSize <= 0) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400 }
    );
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
  const ts = Date.now();
  const key = `course-${lesson.course_id}/lesson-${lesson.global_index}-${ts}.mp4`;
  const contentType = body.contentType || "video/mp4";

  // Init multipart on R2
  const uploadId = await startMultipartUpload(key, contentType);

  // Compute part plan + pre-sign every part. Browser will PUT them in
  // parallel and only return ETags to the complete endpoint.
  const partSize = DEFAULT_PART_SIZE;
  const partCount = Math.ceil(body.totalSize / partSize);
  const urls = await presignPartUrls(key, uploadId, partCount);

  return NextResponse.json({
    key,
    uploadId,
    partSize,
    partCount,
    urls,
  });
}
