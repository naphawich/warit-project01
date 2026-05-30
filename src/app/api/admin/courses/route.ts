// POST /api/admin/courses — create a new course row.
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin-server";
import { COURSE_LEVELS, type NewCourseInput } from "@/lib/courses-db";

export const runtime = "nodejs";

function validate(input: Partial<NewCourseInput>): {
  ok: true;
  data: NewCourseInput;
} | {
  ok: false;
  message: string;
} {
  if (!input.title?.trim()) return { ok: false, message: "ต้องมีชื่อคอร์ส" };
  if (!input.short_description?.trim())
    return { ok: false, message: "ต้องมีคำอธิบายสั้น" };
  if (!input.category?.trim())
    return { ok: false, message: "ต้องเลือกหมวดหมู่" };
  if (!input.level || !COURSE_LEVELS.includes(input.level))
    return { ok: false, message: "ระดับคอร์สไม่ถูกต้อง" };
  if (!input.instructor_name?.trim())
    return { ok: false, message: "ต้องมีชื่อผู้สอน" };
  if (typeof input.price !== "number" || input.price < 0)
    return { ok: false, message: "ราคาต้องเป็นตัวเลขไม่ติดลบ" };
  if (typeof input.original_price !== "number" || input.original_price < 0)
    return { ok: false, message: "ราคาเดิมต้องเป็นตัวเลขไม่ติดลบ" };

  return {
    ok: true,
    data: {
      title: input.title.trim(),
      short_description: input.short_description.trim(),
      long_description: (input.long_description ?? "").trim(),
      category: input.category.trim(),
      level: input.level,
      lessons: Math.max(0, Math.floor(input.lessons ?? 0)),
      hours: Math.max(0, Math.floor(input.hours ?? 0)),
      price: Math.floor(input.price),
      original_price: Math.floor(input.original_price),
      color: input.color?.trim() || "from-blue-500 to-blue-700",
      instructor_name: input.instructor_name.trim(),
      instructor_role: (input.instructor_role ?? "").trim(),
      instructor_initials: (input.instructor_initials ?? "").trim(),
      what_you_learn: (input.what_you_learn ?? []).filter(
        (s) => s.trim().length > 0
      ),
      features: (input.features ?? []).filter((s) => s.trim().length > 0),
    },
  };
}

export async function POST(req: Request) {
  const authed = await authenticateAdmin(req);
  if ("error" in authed) {
    return NextResponse.json(
      { error: authed.error },
      { status: authed.error === "unauthorized" ? 401 : 403 }
    );
  }

  let body: Partial<NewCourseInput>;
  try {
    body = (await req.json()) as Partial<NewCourseInput>;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: "validation_failed", message: result.message },
      { status: 400 }
    );
  }

  const { data, error } = await authed.admin
    .from("courses")
    .insert(result.data)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[admin/courses] insert failed", error);
    return NextResponse.json(
      { error: "db_error", detail: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
