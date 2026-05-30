import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import {
  completeMultipartUpload,
  abortMultipartUpload,
  headObject,
} from "@/lib/r2-server";

export const runtime = "nodejs";

type Body = {
  lessonId: string;
  key: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
  durationSeconds?: number;
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

  if (
    !body.lessonId ||
    !body.key ||
    !body.uploadId ||
    !Array.isArray(body.parts) ||
    body.parts.length === 0
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    await completeMultipartUpload(
      body.key,
      body.uploadId,
      body.parts.map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag,
      }))
    );
  } catch (e) {
    console.error("[upload/complete] multipart complete failed", e);
    await abortMultipartUpload(body.key, body.uploadId);
    return NextResponse.json(
      { error: "r2_complete_failed" },
      { status: 502 }
    );
  }

  // Confirm with R2 + record the result
  const head = await headObject(body.key);
  const { error: updateErr } = await admin
    .from("lessons")
    .update({
      video_storage_key: body.key,
      video_size_bytes: head?.size ?? null,
      video_uploaded_at: new Date().toISOString(),
      duration_seconds: body.durationSeconds ?? null,
    })
    .eq("id", body.lessonId);

  if (updateErr) {
    console.error("[upload/complete] DB update failed", updateErr);
    return NextResponse.json(
      { error: "db_update_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, key: body.key, size: head?.size });
}
