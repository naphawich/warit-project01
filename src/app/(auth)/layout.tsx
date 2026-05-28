import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowLeft,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand side */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Warit Academy</span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            เริ่มต้นเส้นทาง
            <br />
            สู่ความเป็นมืออาชีพ
          </h2>
          <p className="text-brand-100/90 text-lg leading-relaxed mb-10 max-w-md">
            เข้าร่วมกับผู้เรียนกว่า 10,000 คน
            ที่ได้พัฒนาทักษะและประสบความสำเร็จไปกับเรา
          </p>

          <div className="space-y-4">
            {[
              { icon: Sparkles, text: "คอร์สคุณภาพสูง สอนโดยผู้เชี่ยวชาญ" },
              { icon: Award, text: "ใบประกาศนียบัตรหลังเรียนจบ" },
              { icon: ShieldCheck, text: "เรียนได้ตลอดชีพ พร้อมอัปเดตฟรี" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex-shrink-0">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-brand-50/95">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-brand-100/70">
          © {new Date().getFullYear()} Warit Academy. สงวนลิขสิทธิ์
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าหลัก
          </Link>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900">Warit Academy</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
