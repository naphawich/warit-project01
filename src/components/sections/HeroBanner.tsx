"use client";

import { motion } from "motion/react";
import { ArrowRight, PlayCircle, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroBanner() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/40"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1E40AF 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <Badge className="w-fit bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              คอร์สใหม่ล่าสุด พร้อมโปรโมชั่นพิเศษ
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              เรียนรู้ทักษะใหม่
              <br />
              ก้าวสู่{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-700">มืออาชีพ</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-brand-200/70 -z-0" />
              </span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              แพลตฟอร์มคอร์สเรียนออนไลน์คุณภาพสูง สอนโดยผู้เชี่ยวชาญตัวจริง
              เรียนได้ทุกที่ทุกเวลา พร้อมใบประกาศนียบัตรหลังเรียนจบ
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25 group h-12 px-6"
              >
                เริ่มเรียน
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-brand-200 text-brand-700 hover:bg-brand-50 h-12 px-6"
              >
                <PlayCircle className="mr-1 h-4 w-4" />
                ดูตัวอย่างคอร์ส
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-slate-200/70">
              <div>
                <div className="text-2xl font-bold text-slate-900">10K+</div>
                <div className="text-sm text-slate-500">ผู้เรียน</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">50+</div>
                <div className="text-sm text-slate-500">คอร์ส</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">4.9★</div>
                <div className="text-sm text-slate-500">คะแนนรีวิว</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800 rounded-3xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200 rounded-3xl" />

              <div className="relative h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-brand-700/40">
                  <User className="h-32 w-32" strokeWidth={1} />
                  <span className="text-sm font-medium">
                    [ พื้นที่สำหรับรูปภาพ ]
                  </span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -left-6 top-12 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-slate-100"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">เรียนจบแล้ว</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    +1,240 คน วันนี้
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-slate-100"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  ✓
                </div>
                <div>
                  <div className="text-xs text-slate-500">ใบประกาศ</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    ออกให้ทุกคอร์ส
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
