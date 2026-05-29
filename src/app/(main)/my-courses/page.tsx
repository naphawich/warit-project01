"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  BookOpen,
  ArrowRight,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/use-user";
import { courses as catalog } from "@/lib/data";

type Entitlement = {
  course_id: number;
  acquired_at: string;
  order_id: string | null;
};

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?next=/my-courses");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("user_courses")
        .select("course_id, acquired_at, order_id")
        .order("acquired_at", { ascending: false });
      if (!active) return;
      setEntitlements((data as Entitlement[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const myCourses = entitlements
    .map((e) => {
      const c = catalog.find((c) => c.id === e.course_id);
      return c ? { ...c, acquired_at: e.acquired_at } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">คอร์สของฉัน</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="max-w-3xl mb-10">
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            คอร์สของฉัน
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            พื้นที่เรียนรู้ของคุณ
          </h1>
          <p className="text-slate-600 leading-relaxed">
            คอร์สทั้งหมดที่คุณซื้อแล้ว เรียนได้ตลอดชีพ
            ทบทวนซ้ำได้ไม่จำกัด
          </p>
        </div>

        {myCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-brand-700/5 hover:border-brand-200 transition-all"
              >
                <Link
                  href={`/learn/${course.id}`}
                  className="block"
                  aria-label={course.title}
                >
                  <div
                    className={`aspect-video bg-gradient-to-br ${course.color} relative flex items-center justify-center overflow-hidden`}
                  >
                    <BookOpen
                      className="h-20 w-20 text-white/30 group-hover:scale-110 transition-transform"
                      strokeWidth={1.5}
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-500/95 text-white border-0 hover:bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        คุณเป็นเจ้าของ
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    <div className="text-xs font-medium text-brand-700">
                      {course.category}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-brand-700 transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} บทเรียน
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {course.hours} ชม.
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 pt-3 border-t border-slate-100">
                      ซื้อเมื่อ{" "}
                      {new Date(course.acquired_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <Button
                      size="sm"
                      className="bg-brand-700 hover:bg-brand-800 text-white pointer-events-none"
                    >
                      เริ่มเรียน
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
        <ShoppingBag className="h-10 w-10 text-brand-700" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        ยังไม่มีคอร์สที่ซื้อ
      </h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        เริ่มต้นเส้นทางการเรียนรู้ของคุณ
        เลือกคอร์สที่คุณสนใจและเรียนรู้ตามจังหวะของตัวเอง
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          render={<Link href="/courses" />}
          nativeButton={false}
          className="h-11 px-6 bg-brand-700 hover:bg-brand-800 text-white"
        >
          เลือกคอร์สเรียน
        </Button>
      </div>
    </div>
  );
}
