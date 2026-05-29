import type { Course, PreviewVideo } from "./data";

export type Lesson = {
  id: string;
  index: number;
  title: string;
  duration: string;
  durationMinutes: number;
  // When set, the lesson plays this real video instead of the placeholder mockup.
  video?: PreviewVideo;
};

export type Chapter = {
  id: string;
  index: number;
  title: string;
  lessons: Lesson[];
};

// Deterministic pseudo-random for stable durations across renders
function seeded(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const CHAPTER_TEMPLATES: Record<string, string[]> = {
  การออกแบบ: [
    "พื้นฐานและหลักการ",
    "เครื่องมือและ Workflow",
    "ฝึกปฏิบัติจริง",
    "เทคนิคขั้นสูง",
    "Portfolio และการนำเสนอ",
  ],
  การพัฒนาเว็บไซต์: [
    "ปูพื้นฐานและสภาพแวดล้อม",
    "Component และ Routing",
    "Data Fetching และ State",
    "Backend และฐานข้อมูล",
    "Optimize และ Deploy",
  ],
  การตลาดดิจิทัล: [
    "เข้าใจตลาดและลูกค้า",
    "วางแผนแคมเปญ",
    "ลงโฆษณาจริง",
    "วัดผลและปรับปรุง",
    "Scale และต่อยอด",
  ],
  ภาษาอังกฤษ: [
    "พื้นฐานและคำศัพท์",
    "การฟัง-การพูด",
    "การเขียน",
    "สถานการณ์ในที่ทำงาน",
    "เตรียมตัวสัมภาษณ์",
  ],
  ธุรกิจและการลงทุน: [
    "พื้นฐานและแนวคิด",
    "วิเคราะห์ข้อมูล",
    "วางแผนและตัดสินใจ",
    "ฝึกปฏิบัติจริง",
    "บริหารและต่อยอด",
  ],
  การถ่ายภาพ: [
    "ทฤษฎีการถ่ายภาพ",
    "องค์ประกอบและการจัดแสง",
    "ฝึกถ่ายงานจริง",
    "การแต่งภาพ",
    "สร้าง Portfolio",
  ],
};

const DEFAULT_CHAPTER_TITLES = [
  "บทที่ 1: เริ่มต้น",
  "บทที่ 2: หลักการสำคัญ",
  "บทที่ 3: ฝึกปฏิบัติ",
  "บทที่ 4: เทคนิคขั้นสูง",
  "บทที่ 5: สรุปและต่อยอด",
];

const LESSONS_PER_CHAPTER = 6;

export function generateCurriculum(course: Course): Chapter[] {
  const titles = CHAPTER_TEMPLATES[course.category] ?? DEFAULT_CHAPTER_TITLES;
  const chapterCount = Math.max(
    1,
    Math.min(titles.length, Math.ceil(course.lessons / LESSONS_PER_CHAPTER))
  );

  const rng = seeded(course.id);
  const chapters: Chapter[] = [];
  let lessonIndex = 1;
  let remaining = course.lessons;

  for (let c = 0; c < chapterCount; c++) {
    const isLast = c === chapterCount - 1;
    const lessonsInChapter = isLast
      ? remaining
      : Math.min(LESSONS_PER_CHAPTER, remaining - (chapterCount - 1 - c));
    const lessons: Lesson[] = [];

    for (let l = 0; l < lessonsInChapter; l++) {
      const isIntro = c === 0 && l === 0;
      // First lesson reuses the course preview clip as its intro video.
      const video = isIntro ? course.previewVideo : undefined;
      const minutes = isIntro && course.previewVideo
        ? 2 // intro clip is short by design
        : 5 + Math.floor(rng() * 18); // 5-22 min
      const seconds = isIntro ? 14 : Math.floor(rng() * 60);
      const duration = `${minutes}:${String(seconds).padStart(2, "0")}`;
      lessons.push({
        id: `${course.id}-${c}-${l}`,
        index: lessonIndex,
        title: lessonTitleFor(course, c, l, lessonIndex),
        duration,
        durationMinutes: minutes + seconds / 60,
        video,
      });
      lessonIndex++;
    }

    chapters.push({
      id: `${course.id}-${c}`,
      index: c + 1,
      title: titles[c] ?? `บทที่ ${c + 1}`,
      lessons,
    });
    remaining -= lessons.length;
  }

  return chapters;
}

function lessonTitleFor(
  course: Course,
  chapterIdx: number,
  lessonIdx: number,
  globalIdx: number
): string {
  // Use whatYouLearn items as a hint for the first chapter, otherwise generic
  if (chapterIdx === 0 && lessonIdx === 0) return "แนะนำคอร์สและภาพรวม";
  if (lessonIdx < course.whatYouLearn.length && chapterIdx === 0) {
    return course.whatYouLearn[lessonIdx];
  }
  return `บทเรียนที่ ${globalIdx}: ${course.category} ส่วนที่ ${globalIdx}`;
}

export function flattenLessons(chapters: Chapter[]): Lesson[] {
  return chapters.flatMap((c) => c.lessons);
}
