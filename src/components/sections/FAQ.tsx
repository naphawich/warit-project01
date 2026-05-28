"use client";

import { motion } from "motion/react";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { faqs } from "@/lib/data";

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            คำถามที่พบบ่อย
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            มีคำถาม? เรามีคำตอบ
          </h2>
          <p className="text-slate-600">
            รวบรวมคำถามที่ผู้เรียนสอบถามเข้ามาบ่อยที่สุด
            หากไม่พบคำตอบที่ต้องการสามารถติดต่อทีมงานได้ตลอด 24 ชั่วโมง
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-slate-200 rounded-xl px-5 bg-white hover:border-brand-200 transition-colors data-[state=open]:border-brand-300 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-left text-slate-900 font-medium py-5 hover:no-underline hover:text-brand-700">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
