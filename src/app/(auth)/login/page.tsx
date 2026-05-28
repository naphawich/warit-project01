"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          ยินดีต้อนรับกลับ 👋
        </h1>
        <p className="text-slate-600">
          เข้าสู่ระบบเพื่อเรียนคอร์สและติดตามความคืบหน้าของคุณ
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700">
              รหัสผ่าน
            </Label>
            <Link
              href="#"
              className="text-sm text-brand-700 hover:text-brand-800 hover:underline font-medium"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
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
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label
            htmlFor="remember"
            className="text-sm text-slate-600 font-normal cursor-pointer"
          >
            จดจำการเข้าสู่ระบบ
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/20"
        >
          เข้าสู่ระบบ
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">หรือเข้าสู่ระบบด้วย</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
        >
          <GoogleIcon className="h-5 w-5 mr-2" />
          เข้าสู่ระบบด้วย Google
        </Button>

        <p className="text-center text-sm text-slate-600 pt-4">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/signup"
            className="text-brand-700 hover:text-brand-800 hover:underline font-semibold"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
