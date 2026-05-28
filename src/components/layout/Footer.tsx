import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/SocialIcons";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-white">
                Warit<span className="text-brand-400">Academy</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              แพลตฟอร์มเรียนออนไลน์คุณภาพสูง
              สำหรับผู้ที่ต้องการพัฒนาทักษะอย่างมืออาชีพ
            </p>
            <div className="flex gap-3 mt-5">
              {[FacebookIcon, InstagramIcon, YoutubeIcon].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-brand-600 transition-colors"
                  aria-label="social"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">เมนูหลัก</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "หน้าแรก", href: "/" },
                { label: "คอร์สเรียน", href: "/courses" },
                { label: "ผู้สอน", href: "/#instructor" },
                { label: "รีวิว", href: "/#reviews" },
                { label: "คำถามที่พบบ่อย", href: "/#faq" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-brand-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">หมวดหมู่</h4>
            <ul className="space-y-2 text-sm">
              {[
                "การออกแบบ",
                "การพัฒนาเว็บไซต์",
                "การตลาดดิจิทัล",
                "ภาษาอังกฤษ",
                "ธุรกิจและการลงทุน",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    href="#"
                    className="hover:text-brand-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">ติดต่อเรา</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-brand-400 flex-shrink-0" />
                <span>กรุงเทพมหานคร, ประเทศไทย</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-brand-400 flex-shrink-0" />
                <span>02-xxx-xxxx</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-brand-400 flex-shrink-0" />
                <span>contact@warit-academy.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Warit Academy. สงวนลิขสิทธิ์ทุกประการ</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-brand-400 transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="#" className="hover:text-brand-400 transition-colors">
              เงื่อนไขการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
