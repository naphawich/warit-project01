// POST /api/admin/chapters — create a new chapter at the end of a course.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";

export const runtime = "nodejs";

type Body = {
  courseId: number;
  title?: string;
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

  const courseId = Number(body.courseId);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json({ error: "missing_course" }, { status: 400 });
  }

  // Next chapter_index = current max + 1 (0-based).
  const { data: last } = await admin
    .from("chapters")
    .select("chapter_index")
    .eq("course_id", courseId)
    .order("chapter_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextIndex = (last?.chapter_index ?? -1) + 1;

  const { data, error } = await admin
    .from("chapters")
    .insert({
      course_id: courseId,
      chapter_index: nextIndex,
      title: body.title?.trim() || `บทที่ ${nextIndex + 1}`,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[admin/chapters] insert failed", error);
    return NextResponse.json(
      { error: "db_error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, chapter: data });
}
