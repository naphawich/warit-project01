"use client";

import { motion } from "motion/react";
import {
  Infinity as InfinityIcon,
  Award,
  Users,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: InfinityIcon,
    title: "เรียนได้ตลอดชีพ",
    desc: "ซื้อครั้งเดียว เข้าเรียนได้ไม่จำกัด พร้อมรับเนื้อหาอัปเดตใหม่ฟรี",
  },
  {
    icon: Award,
    title: "ใบประกาศนียบัตร",
    desc: "รับใบประกาศนียบัตรอย่างเป็นทางการ หลังเรียนจบทุกคอร์ส",
  },
  {
    icon: Users,
    title: "ผู้สอนเชี่ยวชาญ",
    desc: "เรียนกับผู้เชี่ยวชาญตัวจริง ที่มีประสบการณ์ทำงานในวงการมากกว่า 10 ปี",
  },
  {
    icon: Smartphone,
    title: "เรียนได้ทุกอุปกรณ์",
    desc: "รองรับทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์ เรียนได้ทุกที่ทุกเวลา",
  },
];

export function Features() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            จุดเด่นของเรา
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            ทำไมต้องเรียนกับเรา
          </h2>
          <p className="text-slate-600">
            แพลตฟอร์มที่ออกแบบมาเพื่อให้คุณเรียนรู้ได้อย่างมีประสิทธิภาพสูงสุด
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-white rounded-2xl p-7 border border-slate-200 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-700/5 transition-all duration-300"
            >
              <div className="absolute top-0 left-7 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-700/30 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="h-6 w-6" />
              </div>
              <div className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
