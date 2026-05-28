"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordValid = password.length >= 8;
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const showMismatch = confirm.length > 0 && !passwordsMatch;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          สมัครสมาชิก
        </h1>
        <p className="text-slate-600">
          สร้างบัญชีใหม่ เริ่มต้นเรียนรู้กับคอร์สคุณภาพสูง
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
              className="pl-10 h-11"
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
              className="pl-10 h-11"
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
          <Checkbox id="terms" required className="mt-1" />
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
          className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/20 mt-2"
        >
          สร้างบัญชี
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">
              หรือสมัครด้วย
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
        >
          <GoogleIcon className="h-5 w-5 mr-2" />
          สมัครด้วย Google
        </Button>

        <p className="text-center text-sm text-slate-600 pt-4">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="text-brand-700 hover:text-brand-800 hover:underline font-semibold"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
