// Combine the static catalog in data.ts with admin-created rows in
// public.courses. Static ids (1-9) and DB ids (100+) never collide.
import type { Course } from "./data";

export type DBCourseRow = {
  id: number;
  title: string;
  short_description: string;
  long_description: string;
  category: string;
  level: Course["level"];
  lessons: number;
  hours: number;
  students: number;
  rating: number;
  reviews_count: number;
  price: number;
  original_price: number;
  color: string;
  instructor_name: string;
  instructor_role: string;
  instructor_initials: string;
  what_you_learn: string[];
  features: string[];
  is_published: boolean;
};

export function dbRowToCourse(row: DBCourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    category: row.category,
    level: row.level,
    lessons: row.lessons,
    hours: row.hours,
    students: row.students,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    price: row.price,
    originalPrice: row.original_price,
    color: normalizeCourseColor(row.color),
    instructor: {
      name: row.instructor_name,
      role: row.instructor_role,
      initials: row.instructor_initials,
    },
    whatYouLearn: row.what_you_learn,
    features: row.features,
  };
}

// Merge static + DB. DB rows always go AFTER static ones in the resulting
// array (chronologically newer); if an id appears in both, static wins.
export function mergeCourses(
  staticCourses: Course[],
  dbRows: DBCourseRow[]
): Course[] {
  const staticIds = new Set(staticCourses.map((c) => c.id));
  const fromDb = dbRows
    .filter((r) => !staticIds.has(r.id))
    .map(dbRowToCourse);
  return [...staticCourses, ...fromDb];
}

// Load a single course by id, checking the static catalog first (no network)
// then falling back to a Supabase fetch. Caller passes the Supabase client
// so this file stays decoupled from the singleton.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCourseById(
  staticCourses: Course[],
  supabase: any,
  id: number
): Promise<Course | null> {
  const fromStatic = staticCourses.find((c) => c.id === id);
  if (fromStatic) return fromStatic;
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  // Surface real DB errors (timeout/permission) instead of silently treating
  // them as "course not found".
  if (error) {
    console.error("[loadCourseById] query failed", id, error.message);
  }
  return data ? dbRowToCourse(data as DBCourseRow) : null;
}

export type NewCourseInput = {
  title: string;
  short_description: string;
  long_description: string;
  category: string;
  level: Course["level"];
  lessons: number;
  hours: number;
  price: number;
  original_price: number;
  color: string;
  instructor_name: string;
  instructor_role: string;
  instructor_initials: string;
  what_you_learn: string[];
  features: string[];
};

export const COURSE_LEVELS = [
  "ระดับเริ่มต้น",
  "ระดับกลาง",
  "ระดับสูง",
  "ทุกระดับ",
] as const;

export const COURSE_COLOR_PRESETS = [
  { label: "เขียวแบรนด์", value: "from-brand-500 to-brand-800" },
  { label: "มรกตเข้ม", value: "from-emerald-600 to-brand-900" },
  { label: "เขียวน้ำทะเล", value: "from-teal-500 to-teal-800" },
  { label: "เขียวคราม", value: "from-teal-600 to-cyan-900" },
  { label: "เขียวมรกต", value: "from-emerald-500 to-emerald-800" },
  { label: "เขียวป่า", value: "from-green-600 to-brand-950" },
  { label: "เขียวหยก", value: "from-brand-600 to-teal-900" },
  { label: "ทอง", value: "from-gold-600 to-gold-800" },
  { label: "เขียวมะกอก", value: "from-lime-600 to-green-800" },
];

// Courses (and persisted cart items) saved before the green rebrand still
// hold the old blue-era gradient strings — map each to its green
// replacement on read so they match the current theme.
const LEGACY_COURSE_COLORS: Record<string, string> = {
  "from-blue-500 to-blue-700": "from-brand-500 to-brand-800",
  "from-indigo-500 to-indigo-700": "from-emerald-600 to-brand-900",
  "from-sky-500 to-sky-700": "from-teal-500 to-teal-800",
  "from-cyan-500 to-blue-600": "from-teal-600 to-cyan-900",
  "from-emerald-500 to-teal-700": "from-emerald-500 to-emerald-800",
  "from-rose-500 to-pink-700": "from-green-600 to-brand-950",
  "from-violet-500 to-purple-700": "from-brand-600 to-teal-900",
  "from-orange-500 to-red-600": "from-gold-600 to-gold-800",
  "from-lime-500 to-green-700": "from-lime-600 to-green-800",
};

export function normalizeCourseColor(color: string): string {
  return LEGACY_COURSE_COLORS[color] ?? color;
}
