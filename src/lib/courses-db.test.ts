import { describe, it, expect } from "vitest";
import { mergeCourses, dbRowToCourse, type DBCourseRow } from "./courses-db";
import type { Course } from "./data";

function makeCourse(id: number, overrides: Partial<Course> = {}): Course {
  return {
    id,
    title: `Course ${id}`,
    shortDescription: "short",
    longDescription: "long",
    category: "การออกแบบ",
    level: "ระดับเริ่มต้น",
    lessons: 10,
    hours: 5,
    students: 100,
    rating: 4.5,
    reviewsCount: 20,
    price: 990,
    originalPrice: 1990,
    color: "from-blue-500 to-blue-700",
    instructor: { name: "ครู", role: "ผู้สอน", initials: "ค" },
    whatYouLearn: ["a", "b"],
    features: ["f1"],
    ...overrides,
  };
}

function makeDbRow(id: number, overrides: Partial<DBCourseRow> = {}): DBCourseRow {
  return {
    id,
    title: `DB Course ${id}`,
    short_description: "db short",
    long_description: "db long",
    category: "การพัฒนาเว็บไซต์",
    level: "ระดับกลาง",
    lessons: 8,
    hours: 4,
    students: 50,
    rating: 4.2,
    reviews_count: 10,
    price: 1290,
    original_price: 2290,
    color: "from-indigo-500 to-indigo-700",
    instructor_name: "ครู DB",
    instructor_role: "ผู้สอน",
    instructor_initials: "ด",
    what_you_learn: ["x"],
    features: ["y"],
    is_published: true,
    ...overrides,
  };
}

describe("dbRowToCourse", () => {
  it("maps snake_case columns to the camelCase Course shape", () => {
    const c = dbRowToCourse(makeDbRow(100));
    expect(c.id).toBe(100);
    expect(c.shortDescription).toBe("db short");
    expect(c.reviewsCount).toBe(10);
    expect(c.originalPrice).toBe(2290);
    expect(c.instructor).toEqual({
      name: "ครู DB",
      role: "ผู้สอน",
      initials: "ด",
    });
    expect(c.whatYouLearn).toEqual(["x"]);
  });
});

describe("mergeCourses", () => {
  it("appends DB courses after static ones", () => {
    const result = mergeCourses([makeCourse(1), makeCourse(2)], [makeDbRow(100)]);
    expect(result.map((c) => c.id)).toEqual([1, 2, 100]);
  });

  it("lets the static course win when an id appears in both", () => {
    const result = mergeCourses(
      [makeCourse(1, { title: "STATIC" })],
      [makeDbRow(1, { title: "DB" })]
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("STATIC");
  });

  it("returns only static courses when there are no DB rows", () => {
    const result = mergeCourses([makeCourse(1)], []);
    expect(result.map((c) => c.id)).toEqual([1]);
  });
});
