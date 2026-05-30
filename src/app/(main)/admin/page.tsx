"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, Upload, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { courses } from "@/lib/data";

export default function AdminHome() {
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
        <div className="mb-8">
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
            จัดการคอร์ส
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            อัปโหลดวิดีโอบทเรียน
          </h1>
          <p className="text-slate-600">
            เลือกคอร์สที่ต้องการจัดการ — ระบบจะสร้างรายการบทเรียนให้อัตโนมัติ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <div className="text-xs font-medium text-brand-700 mb-1">
                    {course.category}
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
