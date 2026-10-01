"use client";

import { motion } from "motion/react";
import {
  Infinity as InfinityIcon,
  Lightbulb,
  BookOpenCheck,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Lightbulb,
    title: "เข้าใจ ไม่ต้องท่องจำ",
    desc: "อธิบายด้วยภาพและแผนผัง เชื่อมโยงแต่ละบทเข้าด้วยกัน จนจำได้เพราะเข้าใจ",
  },
  {
    icon: BookOpenCheck,
    title: "ครบทุกบท ม.4–6",
    desc: "เนื้อหาตามหลักสูตร สสวท. ใช้ได้ทั้งเก็บเกรดในโรงเรียนและเตรียมสอบ A-Level",
  },
  {
    icon: GraduationCap,
    title: "สอนโดยครูวริศ",
    desc: "ผ่านการอบรม สอวน. ชีววิทยา ค่าย 2 มช. มีประสบการณ์ติวสอบเข้ามหาวิทยาลัย",
  },
  {
    icon: InfinityIcon,
    title: "ดูซ้ำได้ไม่จำกัด",
    desc: "ซื้อครั้งเดียว เรียนได้ตลอดชีพ ทุกอุปกรณ์ ย้อนดูบทที่ไม่เข้าใจได้ทุกเมื่อ",
  },
];

export function Features() {
  return (
    <section className="py-20 lg:py-28">
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
            ทำไมต้องเรียนชีวะกับครูวริศ
          </h2>
          <p className="text-slate-600">
            ออกแบบมาให้นักเรียน ม.ปลาย เข้าใจชีววิทยาจริง ไม่ใช่แค่จำไปสอบ
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
