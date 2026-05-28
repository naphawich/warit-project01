"use client";

import { motion } from "motion/react";
import { User, CheckCircle2, Globe } from "lucide-react";
import { LinkedinIcon, TwitterIcon } from "@/components/icons/SocialIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const expertise = [
  "UX/UI Design 10+ ปี",
  "ผู้ก่อตั้ง Studio ชื่อดัง",
  "วิทยากรงานสัมมนาระดับประเทศ",
  "ผู้เขียนหนังสือขายดี",
];

const stats = [
  { value: "10K+", label: "นักเรียน" },
  { value: "50+", label: "คอร์ส" },
  { value: "12", label: "ปีประสบการณ์" },
];

export function Instructor() {
  return (
    <section
      id="instructor"
      className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-brand-50/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-brand-700 rounded-full blur-2xl opacity-30 scale-110" />

              <div className="relative h-72 w-72 lg:h-80 lg:w-80 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 border-8 border-white shadow-2xl flex items-center justify-center">
                <User
                  className="h-32 w-32 text-brand-700/30"
                  strokeWidth={1}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-2 -right-2 bg-white rounded-2xl shadow-xl px-5 py-3 border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-600" />
                  <div>
                    <div className="text-xs text-slate-500">ได้รับการรับรอง</div>
                    <div className="font-semibold text-sm text-slate-900">
                      Verified Instructor
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
              พบกับผู้สอน
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              อาจารย์วฤศ ใจดี
            </h2>
            <p className="text-brand-700 font-medium mb-5">
              Senior Designer & Founder, Warit Studio
            </p>

            <p className="text-slate-600 leading-relaxed mb-6">
              ผู้เชี่ยวชาญด้านการออกแบบและพัฒนาผลิตภัณฑ์ดิจิทัล
              ด้วยประสบการณ์มากกว่า 12 ปี ได้ทำงานกับองค์กรชั้นนำมากมาย
              ทั้งในและต่างประเทศ มีความเชื่อว่าการเรียนรู้ที่ดีคือ
              การเรียนจากตัวอย่างจริงและลงมือทำ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {expertise.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-8 py-6 border-y border-slate-200 mb-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold text-brand-700">
                    {s.value}
                  </div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button className="bg-brand-700 hover:bg-brand-800 text-white">
                ดูคอร์สของผู้สอน
              </Button>
              <div className="flex items-center gap-2 ml-2">
                {[LinkedinIcon, TwitterIcon, Globe].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
