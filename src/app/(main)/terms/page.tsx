import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "เงื่อนไขการใช้งาน | Warit Academy",
};

export default function TermsPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">เงื่อนไขการใช้งาน</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          เงื่อนไขการใช้งาน
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          ปรับปรุงล่าสุด: มิถุนายน 2569 (ฉบับร่าง — ควรให้ผู้เชี่ยวชาญด้านกฎหมายตรวจสอบก่อนเผยแพร่จริง)
        </p>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              1. การยอมรับเงื่อนไข
            </h2>
            <p>
              การสมัครสมาชิกหรือใช้งาน Warit Academy ถือว่าท่านยอมรับเงื่อนไขการใช้งานฉบับนี้
              หากท่านไม่เห็นด้วย โปรดงดใช้บริการ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              2. บัญชีผู้ใช้
            </h2>
            <p>
              ท่านต้องให้ข้อมูลที่ถูกต้องในการสมัคร และรับผิดชอบในการรักษาความลับของรหัสผ่าน
              ห้ามแบ่งปันบัญชีหรือสิทธิ์เข้าถึงคอร์สแก่ผู้อื่น
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              3. การซื้อคอร์สและสิทธิ์การเข้าถึง
            </h2>
            <p>
              เมื่อชำระเงินสำเร็จ ท่านจะได้รับสิทธิ์เข้าถึงคอร์สนั้นแบบตลอดชีพสำหรับการใช้งานส่วนบุคคล
              เนื้อหาทั้งหมดได้รับการคุ้มครองลิขสิทธิ์ ห้ามทำซ้ำ เผยแพร่ บันทึก หรือจำหน่ายต่อ
              ไม่ว่าด้วยวิธีใด
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              4. นโยบายการคืนเงิน
            </h2>
            <p>
              เนื่องจากเป็นสินค้าดิจิทัลที่เข้าถึงเนื้อหาได้ทันทีหลังชำระเงิน โดยทั่วไปจึงไม่สามารถ
              ขอคืนเงินได้ เว้นแต่กรณีที่ระบบมีข้อผิดพลาดทำให้ท่านไม่สามารถเข้าถึงคอร์สที่ซื้อได้
              โปรดติดต่อทีมงานภายใน 7 วันนับจากวันที่ชำระเงิน
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              5. ข้อจำกัดความรับผิด
            </h2>
            <p>
              เราพยายามให้บริการอย่างต่อเนื่องและถูกต้องที่สุด แต่ไม่รับประกันว่าบริการจะปราศจาก
              การหยุดชะงักหรือข้อผิดพลาดโดยสิ้นเชิง
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              6. การติดต่อ
            </h2>
            <p>
              คำถามเกี่ยวกับเงื่อนไขนี้ ติดต่อ{" "}
              <span className="text-brand-700">contact@warit-academy.com</span>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
