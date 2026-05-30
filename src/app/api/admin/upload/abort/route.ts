import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { abortMultipartUpload } from "@/lib/r2-server";

export const runtime = "nodejs";

type Body = { key: string; uploadId: string };

export async function POST(req: Request) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.key || !body?.uploadId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  await abortMultipartUpload(body.key, body.uploadId);
  return NextResponse.json({ ok: true });
}
