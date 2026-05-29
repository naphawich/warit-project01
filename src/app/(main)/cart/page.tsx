"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Trash2,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  BookOpen,
  Sparkles,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { useUser } from "@/lib/use-user";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const { user, loading: userLoading } = useUser();

  useEffect(() => setMounted(true), []);

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login?next=/cart");
      return;
    }
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?next=/cart");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.message || data.error || "ไม่สามารถเริ่มการชำระเงินได้");
        return;
      }
      router.push(`/checkout/${data.orderId}`);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setCheckingOut(false);
    }
  };

  const showLoginHint = mounted && !userLoading && !user;

  const subtotal = items.reduce((sum, i) => sum + i.originalPrice, 0);
  const total = items.reduce((sum, i) => sum + i.price, 0);
  const savings = subtotal - total;
  const isEmpty = mounted && items.length === 0;

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">ตะกร้าสินค้า</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              ตะกร้าสินค้า
            </h1>
            <p className="text-slate-600">
              {mounted ? `${items.length} คอร์สในตะกร้า` : "กำลังโหลด..."}
            </p>
          </div>
          {mounted && items.length > 0 && (
            <button
              onClick={clear}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              ล้างตะกร้า
            </button>
          )}
        </div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items list */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div className="flex gap-4">
                      <Link
                        href={`/courses/${item.id}`}
                        className={`relative shrink-0 w-28 sm:w-40 aspect-video rounded-xl overflow-hidden bg-gradient-to-br ${item.color} flex items-center justify-center group`}
                      >
                        <BookOpen
                          className="h-8 w-8 sm:h-10 sm:w-10 text-white/40 group-hover:scale-110 transition-transform"
                          strokeWidth={1.5}
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="text-xs text-brand-700 font-medium mb-1">
                          {item.category}
                        </div>
                        <Link
                          href={`/courses/${item.id}`}
                          className="font-semibold text-slate-900 leading-snug hover:text-brand-700 transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <div className="text-sm text-slate-500 mt-1">
                          โดย {item.instructor}
                        </div>

                        <div className="flex items-end justify-between mt-auto pt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-brand-700">
                              ฿{item.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              ฿{item.originalPrice.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
                            aria-label="ลบออกจากตะกร้า"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">ลบ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link
                href="/#courses"
                className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 hover:underline mt-4 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                เลือกคอร์สเพิ่มเติม
              </Link>
            </div>

            {/* Summary */}
            <aside>
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-900/5">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">
                    สรุปคำสั่งซื้อ
                  </h2>

                  <div className="space-y-3 text-sm pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        ราคารวม ({items.length} คอร์ส)
                      </span>
                      <span className="text-slate-700">
                        ฿{subtotal.toLocaleString()}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          ส่วนลด
                        </span>
                        <span className="font-medium">
                          -฿{savings.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between py-5">
                    <span className="text-slate-700 font-semibold">
                      ยอดชำระทั้งหมด
                    </span>
                    <span className="text-2xl font-bold text-brand-700">
                      ฿{total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="โค้ดส่วนลด"
                      className="h-11"
                    />
                    <Button
                      variant="outline"
                      className="h-11 border-brand-200 text-brand-700 hover:bg-brand-50"
                    >
                      ใช้
                    </Button>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={userLoading || checkingOut}
                    className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25 text-base disabled:opacity-70"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        กำลังสร้าง QR...
                      </>
                    ) : showLoginHint ? (
                      <>
                        <Lock className="h-4 w-4 mr-1.5" />
                        เข้าสู่ระบบเพื่อชำระเงิน
                      </>
                    ) : (
                      "ดำเนินการชำระเงิน"
                    )}
                  </Button>

                  {showLoginHint && (
                    <p className="text-center text-xs text-slate-500 mt-2">
                      ต้องเข้าสู่ระบบก่อนชำระเงิน
                    </p>
                  )}

                  {checkoutError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    ชำระเงินปลอดภัย 100%
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-brand-50/60 border border-brand-100 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white flex-shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 mb-1">
                        ซื้อ 2 คอร์สขึ้นไปลด 15%
                      </div>
                      <div className="text-slate-600 text-xs">
                        ระบบจะใช้ส่วนลดให้อัตโนมัติเมื่อเข้าเงื่อนไข
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-16 text-center max-w-2xl mx-auto">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
        <ShoppingBag className="h-10 w-10 text-brand-700" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        ตะกร้าของคุณว่างเปล่า
      </h2>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        ยังไม่มีคอร์สในตะกร้า ไปเลือกคอร์สที่คุณสนใจได้เลย
        เริ่มต้นเส้นทางการเรียนรู้ของคุณวันนี้
    </p>
      <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-8">
        🎉 มีโปรโมชั่นพิเศษวันนี้
      </Badge>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          render={<Link href="/#courses" />}
          nativeButton={false}
          className="h-11 px-6 bg-brand-700 hover:bg-brand-800 text-white"
        >
          ดูคอร์สแนะนำ
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          className="h-11 px-6 border-brand-200 text-brand-700 hover:bg-brand-50"
        >
          กลับหน้าหลัก
        </Button>
      </div>
    </div>
  );
}
