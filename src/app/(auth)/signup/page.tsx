"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [nextParam, setNextParam] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextParam(params.get("next") || "");
  }, []);

  const loginHref = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}`
    : "/login";

  const passwordValid = password.length >= 8;
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const showMismatch = confirm.length > 0 && !passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (!passwordsMatch) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!acceptTerms) {
      setError("กรุณายอมรับเงื่อนไขการใช้งาน");
      return;
    }

    setLoading(true);
    setEmailExists(false);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (authError) {
      const m = authError.message.toLowerCase();
      if (
        m.includes("already registered") ||
        m.includes("already exists") ||
        m.includes("user already")
      ) {
        setEmailExists(true);
        return;
      }
      setError(translateAuthError(authError.message));
      return;
    }

    // Supabase quirk: when "Confirm email" is on, signing up with an existing
    // email succeeds silently but returns identities = [] to prevent enumeration.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setEmailExists(true);
      return;
    }

    if (data.user) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          สมัครสมาชิกสำเร็จ!
        </h1>
        <p className="text-slate-600 leading-relaxed mb-6">
          เราได้ส่งอีเมลยืนยันไปที่ <strong>{email}</strong> แล้ว
          <br />
          กรุณาเปิดอีเมลเพื่อยืนยันบัญชี
        </p>
        <p className="text-sm text-slate-500 mb-8">
          ถ้าหาอีเมลไม่เจอ ลองดูในโฟลเดอร์ Spam หรือ Junk
        </p>
        <Button
          render={<Link href={loginHref} />}
          nativeButton={false}
          className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white"
        >
          ไปหน้าเข้าสู่ระบบ
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">สมัครสมาชิก</h1>
        <p className="text-slate-600">
          สร้างบัญชีใหม่ เริ่มต้นเรียนรู้กับคอร์สคุณภาพสูง
        </p>
      </div>

      {emailExists && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold mb-1">เคยใช้อีเมลนี้สมัครแล้ว</div>
            <div className="text-amber-700 mb-2">
              อีเมล <strong>{email}</strong> มีบัญชีอยู่แล้วในระบบ
            </div>
            <Link
              href={loginHref}
              className="inline-flex items-center gap-1 text-amber-900 hover:text-amber-950 font-semibold underline underline-offset-2"
            >
              เข้าสู่ระบบด้วยอีเมลนี้ →
            </Link>
          </div>
        </div>
      )}

      {error && !emailExists && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullname" className="text-slate-700">
            ชื่อ-นามสกุล
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="fullname"
              type="text"
              placeholder="สมชาย ใจดี"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-11"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700">
            อีเมล
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailExists) setEmailExists(false);
              }}
              className="pl-10 h-11"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700">
            รหัสผ่าน
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="toggle password visibility"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {password.length > 0 && (
            <div
              className={`flex items-center gap-1.5 text-xs ${
                passwordValid ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              อย่างน้อย 8 ตัวอักษร
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-slate-700">
            ยืนยันรหัสผ่าน
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`pl-10 pr-10 h-11 ${
                showMismatch ? "border-red-300 focus-visible:ring-red-200" : ""
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="toggle confirm password visibility"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {showMismatch && (
            <p className="text-xs text-red-600">รหัสผ่านไม่ตรงกัน</p>
          )}
          {passwordsMatch && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              รหัสผ่านตรงกัน
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(v) => setAcceptTerms(v === true)}
            className="mt-1"
          />
          <Label
            htmlFor="terms"
            className="text-sm text-slate-600 font-normal cursor-pointer leading-relaxed"
          >
            ฉันยอมรับ{" "}
            <Link
              href="#"
              className="text-brand-700 hover:underline font-medium"
            >
              เงื่อนไขการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link
              href="#"
              className="text-brand-700 hover:underline font-medium"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/20 mt-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังสร้างบัญชี...
            </>
          ) : (
            "สร้างบัญชี"
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">หรือสมัครด้วย</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
        >
          <GoogleIcon className="h-5 w-5 mr-2" />
          สมัครด้วย Google (เร็วๆ นี้)
        </Button>

        <p className="text-center text-sm text-slate-600 pt-4">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href={loginHref}
            className="text-brand-700 hover:text-brand-800 hover:underline font-semibold"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </motion.div>
  );
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) {
    return "อีเมลนี้ถูกใช้งานแล้ว ลองเข้าสู่ระบบแทน";
  }
  if (m.includes("password")) {
    return "รหัสผ่านไม่ปลอดภัยเพียงพอ ลองใช้รหัสที่ยาวขึ้น";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "รูปแบบอีเมลไม่ถูกต้อง";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "พยายามมากเกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  return message;
}
