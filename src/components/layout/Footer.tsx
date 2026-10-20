import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/SocialIcons";
import { reviews } from "@/lib/data";
import { CONTACT, SOCIAL } from "@/lib/site";

const SOCIAL_LINKS = [
  { Icon: FacebookIcon, label: "Facebook", href: SOCIAL.facebook },
  { Icon: InstagramIcon, label: "Instagram", href: SOCIAL.instagram },
  { Icon: YoutubeIcon, label: "YouTube", href: SOCIAL.youtube },
].filter((s) => s.href);

export function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-brand-900">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-white">
                Warit<span className="text-gold-300">Biology</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-brand-200/70">
              ติวชีววิทยา ม.4–6 ออนไลน์ เน้นเข้าใจ ไม่ต้องท่องจำ
              พร้อมตะลุยโจทย์ A-Level กับครูวริศ
            </p>
            {SOCIAL_LINKS.length > 0 && (
              <div className="flex gap-3 mt-5">
                {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 hover:bg-gold-400 hover:text-brand-900 transition-colors"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">เมนูหลัก</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "หน้าแรก", href: "/" },
                { label: "คอร์สเรียน", href: "/courses" },
                { label: "ผู้สอน", href: "/#instructor" },
                ...(reviews.length > 0
                  ? [{ label: "รีวิว", href: "/#reviews" }]
                  : []),
                { label: "คำถามที่พบบ่อย", href: "/#faq" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-gold-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">ติดต่อเรา</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-gold-400 flex-shrink-0" />
                <span>{CONTACT.location}</span>
              </li>
              {CONTACT.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-gold-400 flex-shrink-0" />
                  <a href={`tel:${CONTACT.phone}`} className="hover:text-gold-300 transition-colors">
                    {CONTACT.phone}
                  </a>
                </li>
              )}
              {CONTACT.email && (
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-gold-400 flex-shrink-0" />
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-gold-300 transition-colors">
                    {CONTACT.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-200/60">
          <p>© {new Date().getFullYear()} Warit Biology. สงวนลิขสิทธิ์ทุกประการ</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gold-300 transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="hover:text-gold-300 transition-colors">
              เงื่อนไขการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
