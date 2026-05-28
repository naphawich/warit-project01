"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock, Users, Star, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { courses } from "@/lib/data";

export function FeaturedCourses() {
  return (
    <section id="courses" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            คอร์สแนะนำ
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            คอร์สเรียนยอดนิยม
          </h2>
          <p className="text-slate-600">
            คัดสรรคอร์สคุณภาพสูง ที่ได้รับความนิยมจากผู้เรียนทั่วประเทศ
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-brand-700/5 hover:border-brand-200 transition-all duration-300"
            >
              <Link
                href={`/courses/${course.id}`}
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
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-0 hover:bg-white/30">
                    {course.level}
                  </Badge>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <div className="text-xs font-medium text-brand-700 mb-2">
                    {course.category}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg leading-snug min-h-[3.5rem] group-hover:text-brand-700 transition-colors">
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

                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold text-slate-700">
                        {course.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users className="h-4 w-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-2">
                  <div>
                    <div className="text-xs text-slate-400 line-through">
                      ฿{course.originalPrice.toLocaleString()}
                    </div>
                    <div className="text-xl font-bold text-brand-700">
                      ฿{course.price.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-brand-700 hover:bg-brand-800 text-white group/btn pointer-events-none"
                  >
                    ดูคอร์ส
                    <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </div>
              </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            render={<Link href="/courses" />}
            nativeButton={false}
            variant="outline"
            size="lg"
            className="border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            ดูคอร์สทั้งหมด
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
