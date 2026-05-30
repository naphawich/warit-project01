"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [check, setCheck] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login?next=/admin");
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!active) return;
      setCheck(data?.is_admin ? "ok" : "denied");
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, router]);

  if (userLoading || check === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (check === "denied") {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-5">
            <AlertCircle className="h-8 w-8 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-slate-600 mb-8">
            หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
          </p>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            กลับหน้าแรก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-sm text-amber-900">
          <Shield className="h-4 w-4" />
          <span>โหมดผู้ดูแลระบบ — เปลี่ยนแปลงที่นี่จะมีผลกับผู้ใช้จริง</span>
        </div>
      </div>
      {children}
    </div>
  );
}
