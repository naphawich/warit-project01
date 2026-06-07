import { describe, it, expect } from "vitest";
import { formatDuration, generateCurriculum, flattenLessons } from "./lessons";
import type { Course } from "./data";

function makeCourse(lessons: number): Course {
  return {
    id: 42,
    title: "Test",
    shortDescription: "s",
    longDescription: "l",
    category: "การออกแบบ",
    level: "ระดับเริ่มต้น",
    lessons,
    hours: 5,
    students: 1,
    rating: 4.5,
    reviewsCount: 1,
    price: 100,
    originalPrice: 200,
    color: "from-blue-500 to-blue-700",
    instructor: { name: "ครู", role: "ผู้สอน", initials: "ค" },
    whatYouLearn: ["a"],
    features: ["f"],
  };
}

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
});

describe("generateCurriculum", () => {
  it("does not crash for a course with 0 lessons", () => {
    expect(() => generateCurriculum(makeCourse(0))).not.toThrow();
    const lessons = flattenLessons(generateCurriculum(makeCourse(0)));
    expect(lessons).toHaveLength(0);
  });

  it("produces exactly course.lessons lessons", () => {
    expect(flattenLessons(generateCurriculum(makeCourse(12)))).toHaveLength(12);
    expect(flattenLessons(generateCurriculum(makeCourse(3)))).toHaveLength(3);
  });

  it("assigns unique, contiguous 1-based lesson indexes", () => {
    const lessons = flattenLessons(generateCurriculum(makeCourse(8)));
    expect(lessons.map((l) => l.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(8);
  });
});
