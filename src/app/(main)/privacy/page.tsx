import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | Warit Academy",
};

export default function PrivacyPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">
              นโยบายความเป็นส่วนตัว
            </span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 prose-slate">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          นโยบายความเป็นส่วนตัว
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          ปรับปรุงล่าสุด: มิถุนายน 2569 (ฉบับร่าง — ควรให้ผู้เชี่ยวชาญด้านกฎหมายตรวจสอบก่อนเผยแพร่จริง)
        </p>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              1. ข้อมูลที่เราเก็บรวบรวม
            </h2>
            <p>
              Warit Academy เก็บรวบรวมข้อมูลส่วนบุคคลเท่าที่จำเป็นเพื่อให้บริการ ได้แก่
              ชื่อ–นามสกุล อีเมล รูปโปรไฟล์ (หากอัปโหลด) ประวัติการสั่งซื้อคอร์ส
              และความคืบหน้าในการเรียน เราไม่เก็บข้อมูลบัตรเครดิตหรือบัญชีธนาคารของท่าน
              ข้อมูลการชำระเงินทั้งหมดดำเนินการโดยผู้ให้บริการชำระเงิน (Omise/Opn Payments)
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              2. วัตถุประสงค์ในการใช้ข้อมูล
            </h2>
            <p>
              เราใช้ข้อมูลเพื่อยืนยันตัวตน ให้สิทธิ์เข้าถึงคอร์สที่ซื้อ ส่งใบเสร็จและการแจ้งเตือนที่เกี่ยวข้อง
              บันทึกความคืบหน้าการเรียน และปรับปรุงคุณภาพบริการ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              3. การเปิดเผยข้อมูลแก่บุคคลที่สาม
            </h2>
            <p>
              เราเปิดเผยข้อมูลเฉพาะเท่าที่จำเป็นต่อผู้ให้บริการที่ช่วยดำเนินงาน เช่น
              ผู้ให้บริการชำระเงิน (Omise) ผู้ให้บริการอีเมล (Resend) และผู้ให้บริการโครงสร้างพื้นฐาน
              (Supabase, Vercel, Cloudflare) โดยผู้ให้บริการเหล่านี้ผูกพันตามข้อกำหนดการคุ้มครองข้อมูล
              เราไม่ขายข้อมูลส่วนบุคคลของท่าน
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              4. สิทธิของเจ้าของข้อมูล (PDPA)
            </h2>
            <p>
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิเข้าถึง แก้ไข
              ลบ หรือขอให้ระงับการใช้ข้อมูลส่วนบุคคลของท่าน รวมถึงเพิกถอนความยินยอม
              โดยติดต่อมายังช่องทางด้านล่าง
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              5. การติดต่อ
            </h2>
            <p>
              หากมีคำถามเกี่ยวกับนโยบายนี้ โปรดติดต่อ{" "}
              <span className="text-brand-700">contact@warit-academy.com</span>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
