// PATCH /api/admin/courses/[id] — edit an existing DB course's editable text
// fields (title + descriptions). Static catalog courses (ids 1-9) have no DB
// row and can't be edited here.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";

export const runtime = "nodejs";

type Body = {
  title?: string;
  short_description?: string;
  long_description?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }
  const { admin } = authed;
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
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
  if (typeof body.short_description === "string") {
    update.short_description = body.short_description.trim();
  }
  if (typeof body.long_description === "string") {
    update.long_description = body.long_description.trim();
  }

  const { data, error } = await admin
    .from("courses")
    .update(update)
    .eq("id", numericId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[admin/courses PATCH] failed", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
  if (!data) {
    // No DB row (e.g. a static catalog course).
    return NextResponse.json({ error: "course_not_editable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
