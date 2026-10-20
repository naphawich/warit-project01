"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Users,
  Star,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { courses as staticCatalog } from "@/lib/data";
import type { Course } from "@/lib/data";
import { useOwnedCourseIds } from "@/lib/use-ownership";
import { mergeCourses, type DBCourseRow } from "@/lib/courses-db";
import { supabase } from "@/lib/supabase";

export default function CoursesPage() {
  const ownedIds = useOwnedCourseIds();

  // Start with the static catalog so the page paints something instantly;
  // hydrate with DB rows once available.
  const [courses, setCourses] = useState<Course[]>(staticCatalog);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("id", { ascending: true });
      if (!active) return;
      setCourses(mergeCourses(staticCatalog, (data as DBCourseRow[]) ?? []));
    })();
    return () => {
      active = false;
    };
  }, []);

  // Catalog order follows the curriculum (ม.4 → ม.6 → A-Level).
  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.id - b.id),
    [courses]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">คอร์สเรียนทั้งหมด</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Page header */}
        <div className="max-w-3xl mb-10">
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            คอร์สเรียนทั้งหมด
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            คอร์สชีววิทยาทั้งหมด
          </h1>
          <p className="text-slate-600 leading-relaxed">
            {courses.length} คอร์ส ครอบคลุมชีววิทยา ม.4–6 ทุกบท
            และตะลุยโจทย์ A-Level สอนโดยครูวริศ
          </p>
        </div>

        {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map((course, i) => {
              const isOwned = ownedIds?.has(course.id) ?? false;
              const linkHref = isOwned
                ? `/learn/${course.id}`
                : `/courses/${course.id}`;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                  className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-700/5 ${
                    isOwned
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-slate-200 hover:border-brand-200"
                  }`}
                >
                  <Link
                    href={linkHref}
                    className="block"
                    aria-label={course.title}
                  >
                    <div
                      className={`aspect-video bg-gradient-to-br ${course.color} relative flex items-center justify-center overflow-hidden`}
                    >
                      <BookOpen
                        className="h-20 w-20 text-white/30 group-hover:scale-110 transition-transform duration-500"
                        strokeWidth={1.5}
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-white/20 text-white backdrop-blur-md border-0 hover:bg-white/30">
                          {course.level}
                        </Badge>
                        {isOwned && (
                          <Badge className="bg-emerald-500 text-white border-0 hover:bg-emerald-500 shadow-md">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            ซื้อแล้ว
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                      <div>
                        <div className="text-xs font-medium text-brand-700 mb-2">
                          {course.category}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-brand-700 transition-colors">
                          {course.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.lessons} บทเรียน</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{course.hours} ชม.</span>
                        </div>
                      </div>

                      {(course.rating > 0 || course.students > 0) && (
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            {course.rating > 0 && (
                              <div className="flex items-center gap-1 text-gold-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="font-semibold text-slate-700">
                                  {course.rating}
                                </span>
                              </div>
                            )}
                            {course.students > 0 && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Users className="h-4 w-4" />
                                <span>{course.students.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-end justify-between pt-2">
                        {isOwned ? (
                          <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            คุณเป็นเจ้าของแล้ว
                          </div>
                        ) : (
                          <div>
                            {course.originalPrice > course.price && (
                              <div className="text-xs text-slate-400 line-through">
                                ฿{course.originalPrice.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xl font-bold text-brand-700">
                              ฿{course.price.toLocaleString()}
                            </div>
                          </div>
                        )}
                        <Button
                          size="sm"
                          className={`group/btn pointer-events-none text-white ${
                            isOwned
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-brand-700 hover:bg-brand-800"
                          }`}
                        >
                          {isOwned ? (
                            <>
                              <Play className="h-3.5 w-3.5 mr-1" fill="currentColor" />
                              เริ่มเรียน
                            </>
                          ) : (
                            <>
                              ดูคอร์ส
                              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
      </div>
    </div>
  );
}
