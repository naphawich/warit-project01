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
    color: row.color,
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
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
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
  { label: "น้ำเงิน", value: "from-blue-500 to-blue-700" },
  { label: "คราม", value: "from-indigo-500 to-indigo-700" },
  { label: "ฟ้า", value: "from-sky-500 to-sky-700" },
  { label: "ฟ้าใส", value: "from-cyan-500 to-blue-600" },
  { label: "เขียวมรกต", value: "from-emerald-500 to-teal-700" },
  { label: "ชมพู", value: "from-rose-500 to-pink-700" },
  { label: "ม่วง", value: "from-violet-500 to-purple-700" },
  { label: "ส้ม", value: "from-orange-500 to-red-600" },
  { label: "เขียวมะนาว", value: "from-lime-500 to-green-700" },
];
