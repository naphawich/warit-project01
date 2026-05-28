"use client";

import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { reviews } from "@/lib/data";

export function Reviews() {
  return (
    <section
      id="reviews"
      className="py-20 lg:py-28 bg-gradient-to-b from-brand-50/40 to-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            รีวิวจากผู้เรียน
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            เสียงตอบรับจากผู้เรียนจริง
          </h2>
          <p className="text-slate-600">
            ผู้เรียนกว่า 10,000 คน ที่ได้พัฒนาตนเองและประสบความสำเร็จไปกับเรา
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-white rounded-2xl p-7 border border-slate-200 hover:shadow-xl hover:shadow-brand-700/5 hover:border-brand-200 transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-brand-100" />

              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="text-slate-700 leading-relaxed mb-6 min-h-[7.5rem]">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Avatar className="h-11 w-11 border-2 border-brand-100">
                  <AvatarFallback className="bg-brand-700 text-white font-semibold text-sm">
                    {review.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {review.name}
                  </div>
                  <div className="text-xs text-slate-500">{review.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
