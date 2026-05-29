"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Mail,
  User as UserIcon,
  Calendar,
  Pencil,
  Save,
  X,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useUser, getInitials } from "@/lib/use-user";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refresh } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Sync name field with profile when it loads
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name]);

  // Auto-hide "saved" message
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refresh();
    setEditing(false);
    setSaved(true);
  };

  const handleCancel = () => {
    setName(profile?.full_name ?? "");
    setEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = profile?.full_name || user.email?.split("@")[0] || "";
  const initials = getInitials(displayName);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const emailVerified = !!user.email_confirmed_at;

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">โปรไฟล์ของฉัน</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hero card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white shadow-xl shadow-brand-700/20">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute top-0 -right-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />

            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1 w-full">
                <AvatarUploader
                  displayName={displayName}
                  email={user.email ?? ""}
                />
                {emailVerified && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ยืนยันอีเมลแล้ว
                  </div>
                )}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                ออกจากระบบ
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Profile details */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    ข้อมูลส่วนตัว
                  </h2>
                  {!editing && (
                    <Button
                      onClick={() => setEditing(true)}
                      variant="outline"
                      className="border-brand-200 text-brand-700 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4 mr-1.5" />
                      แก้ไข
                    </Button>
                  )}
                </div>

                {saved && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    บันทึกการเปลี่ยนแปลงแล้ว
                  </div>
                )}

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <Label className="text-slate-700 text-sm mb-2 block">
                      ชื่อ-นามสกุล
                    </Label>
                    {editing ? (
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="สมชาย ใจดี"
                          className="pl-10 h-11"
                          disabled={saving}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 text-slate-700">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <span>{profile?.full_name || "ยังไม่ได้ตั้งชื่อ"}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-700 text-sm mb-2 block">
                      อีเมล
                    </Label>
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{user.email}</span>
                      <span className="ml-auto text-xs text-slate-400">
                        แก้ไขไม่ได้
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700 text-sm mb-2 block">
                      สมาชิกตั้งแต่
                    </Label>
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 text-slate-700">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{memberSince}</span>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-2 mt-6 pt-5 border-t border-slate-100">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-brand-700 hover:bg-brand-800 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          บันทึก
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={saving}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      ยกเลิก
                    </Button>
                  </div>
                )}
              </section>

              {/* Raw data card */}
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-4 w-4 text-brand-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    ข้อมูลที่เก็บใน Supabase
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  ข้อมูลนี้บันทึกในตาราง <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-700">public.profiles</code>{" "}
                  พร้อม Row Level Security — คุณเห็นได้แค่แถวของตัวเอง
                </p>
                <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 text-xs overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    id: profile?.id,
    full_name: profile?.full_name,
    email: profile?.email,
    avatar_url: profile?.avatar_url,
    created_at: profile?.created_at,
    updated_at: profile?.updated_at,
  },
  null,
  2
)}
                </pre>
              </section>
            </div>

            {/* Stats / actions */}
            <aside className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">
                  สถิติของฉัน
                </h3>
                <div className="space-y-3 text-sm">
                  <Stat label="คอร์สที่เรียน" value="0" />
                  <Stat label="ชั่วโมงเรียน" value="0 ชม." />
                  <Stat label="ใบประกาศ" value="0" />
                </div>
                <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                  เริ่มเรียนคอร์สแรกของคุณ
                  เพื่อสะสมความก้าวหน้าและใบประกาศนียบัตร
                </p>
              </section>

              <section className="rounded-2xl bg-brand-50/60 border border-brand-100 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  สำรวจคอร์สเพิ่มเติม
                </h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  ดู 9 คอร์สคุณภาพสูงในแคตตาล็อกของเรา
                </p>
                <Button
                  render={<Link href="/courses" />}
                  nativeButton={false}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white"
                >
                  ดูคอร์สทั้งหมด
                </Button>
              </section>
            </aside>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
