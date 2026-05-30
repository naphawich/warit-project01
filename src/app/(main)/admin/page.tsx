"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronRight,
  Upload,
  BookOpen,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { courses as staticCatalog } from "@/lib/data";
import { mergeCourses, type DBCourseRow } from "@/lib/courses-db";
import type { Course } from "@/lib/data";

export default function AdminHome() {
  const [courses, setCourses] = useState<Course[]>(staticCatalog);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("id", { ascending: true });
      if (!active) return;
      setCourses(mergeCourses(staticCatalog, (data as DBCourseRow[]) ?? []));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">Admin</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
              จัดการคอร์ส
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              คอร์สทั้งหมด
            </h1>
            <p className="text-slate-600">
              เลือกคอร์สที่ต้องการจัดการบทเรียน หรือสร้างคอร์สใหม่
            </p>
          </div>
          <Button
            render={<Link href="/admin/courses/new" />}
            nativeButton={false}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มคอร์สใหม่
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Add-course tile that doubles as a call-to-action */}
          <Link
            href="/admin/courses/new"
            className="group block aspect-square sm:aspect-auto sm:min-h-[280px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-400 bg-white/60 hover:bg-brand-50/40 transition-all flex flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 group-hover:bg-brand-200 transition-colors">
              <Plus className="h-7 w-7" />
            </div>
            <div className="font-semibold text-slate-700 group-hover:text-brand-700">
              เพิ่มคอร์สใหม่
            </div>
            <div className="text-xs text-slate-500 max-w-xs">
              สร้างคอร์สพร้อมหัวข้อ คำอธิบาย ผู้สอน และอัปโหลดบทเรียนได้ทันที
            </div>
          </Link>

          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
            >
              <Link
                href={`/admin/courses/${course.id}/lessons`}
                className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-brand-700/5 hover:border-brand-200 transition-all"
              >
                <div
                  className={`aspect-video bg-gradient-to-br ${course.color} flex items-center justify-center`}
                >
                  <BookOpen
                    className="h-16 w-16 text-white/30 group-hover:scale-110 transition-transform"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-medium text-brand-700">
                      {course.category}
                    </div>
                    {course.id >= 100 && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[10px] px-1.5 py-0">
                        ใหม่
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 mb-3 group-hover:text-brand-700 transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {course.lessons} บทเรียน
                    </span>
                    <span className="flex items-center gap-1 text-brand-700 font-medium">
                      <Upload className="h-3.5 w-3.5" />
                      จัดการ
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
