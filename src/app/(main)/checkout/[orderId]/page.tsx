"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/use-user";
import { useCart } from "@/lib/cart-store";

type OrderRow = {
  id: string;
  user_id: string;
  total_amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  qr_image_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
  omise_charge_id: string | null;
};

type OrderItemRow = {
  course_id: number;
  course_title: string;
  price: number;
};

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const clearCart = useCart((s) => s.clear);

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [user, userLoading, router]);

  // Initial fetch
  useEffect(() => {
    if (!user || !orderId) return;
    let active = true;
    (async () => {
      const { data: o, error: oe } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (!active) return;
      if (oe || !o) {
        setError("ไม่พบคำสั่งซื้อนี้ หรือคุณไม่มีสิทธิ์เข้าถึง");
        setLoading(false);
        return;
      }
      setOrder(o as OrderRow);

      const { data: its } = await supabase
        .from("order_items")
        .select("course_id,course_title,price")
        .eq("order_id", orderId);
      if (!active) return;
      setItems((its as OrderItemRow[]) ?? []);
      setLoading(false);

      // If order is already paid, clear the cart locally
      if ((o as OrderRow).status === "paid") clearCart();
    })();
    return () => {
      active = false;
    };
  }, [user, orderId, clearCart]);

  // Realtime subscription: react to status changes
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as OrderRow;
          setOrder(next);
          if (next.status === "paid") clearCart();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, clearCart]);

  // Countdown
  useEffect(() => {
    if (!order?.expires_at) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(order.expires_at!).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.expires_at]);

  // Fetch QR image with auth + create blob URL (img tag can't send Bearer header)
  useEffect(() => {
    if (!order?.qr_image_url || !order?.id) return;
    let active = true;
    let createdUrl: string | null = null;
    (async () => {
      setQrError(false);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !active) return;
        const res = await fetch(`/api/qr/${order.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          if (active) setQrError(true);
          return;
        }
        const blob = await res.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setQrBlobUrl(createdUrl);
      } catch {
        if (active) setQrError(true);
      }
    })();
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [order?.qr_image_url, order?.id]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <ErrorState message={error ?? "ไม่พบคำสั่งซื้อ"} />
    );
  }

  if (order.status === "paid") {
    return <SuccessState order={order} items={items} />;
  }

  if (order.status === "expired" || order.status === "cancelled") {
    return (
      <ErrorState
        message={
          order.status === "expired"
            ? "QR Code หมดอายุแล้ว กรุณาทำรายการใหม่"
            : "คำสั่งซื้อนี้ถูกยกเลิก"
        }
      />
    );
  }

  if (order.status === "failed") {
    return (
      <ErrorState message="การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
    );
  }

  const totalBaht = order.total_amount / 100;
  const expired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/cart"
              className="hover:text-brand-700 transition-colors"
            >
              ตะกร้า
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">ชำระเงิน</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* QR side */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  PromptPay
                </Badge>
                {secondsLeft !== null && !expired && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    หมดอายุใน{" "}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {Math.floor(secondsLeft / 60)}:
                      {String(secondsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
                สแกน QR เพื่อชำระเงิน
              </h1>
              <p className="text-center text-slate-600 mb-6">
                ใช้แอปธนาคารใดก็ได้ที่รองรับ PromptPay
              </p>

              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-200 to-brand-400 opacity-50 blur-xl" />
                  <div className="relative bg-white rounded-2xl border-4 border-brand-700 p-3 shadow-lg">
                    {qrBlobUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrBlobUrl}
                        alt="PromptPay QR Code"
                        className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                      />
                    ) : qrError ? (
                      <div className="w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center gap-2 text-center px-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <div className="text-xs text-slate-500">
                          โหลด QR ไม่สำเร็จ
                          <br />
                          กรุณารีเฟรชหน้านี้
                        </div>
                      </div>
                    ) : (
                      <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 mb-1">ยอดชำระ</div>
                <div className="text-4xl font-bold text-brand-700">
                  ฿{totalBaht.toLocaleString()}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-start gap-3 mb-5">
                <Loader2 className="h-5 w-5 text-brand-600 animate-spin mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="font-semibold text-slate-900 mb-0.5">
                    กำลังรอการชำระเงิน
                  </div>
                  <div className="text-slate-600">
                    หน้านี้จะอัปเดตอัตโนมัติเมื่อเราได้รับเงิน
                    ไม่จำเป็นต้องรีเฟรช
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <Step icon={Smartphone} text="เปิดแอปธนาคาร" />
                <Step icon={CheckCircle2} text="สแกน QR" active />
                <Step icon={ShieldCheck} text="ยืนยันการจ่าย" />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                รายละเอียดคำสั่งซื้อ
              </h2>
              <div className="space-y-3 pb-4 border-b border-slate-100">
                {items.map((it) => (
                  <div
                    key={it.course_id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 line-clamp-2">
                        {it.course_title}
                      </div>
                    </div>
                    <div className="text-slate-700 whitespace-nowrap">
                      ฿{(it.price / 100).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between py-4">
                <span className="font-semibold text-slate-700">ยอดรวม</span>
                <span className="text-2xl font-bold text-brand-700">
                  ฿{totalBaht.toLocaleString()}
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-4">
                ID คำสั่งซื้อ:{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                  {order.id.slice(0, 8)}
                </code>
              </div>

              <Button
                render={<Link href="/cart" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-slate-200 text-slate-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                กลับไปที่ตะกร้า
              </Button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ชำระผ่าน Omise — ปลอดภัย 100%
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  text,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl p-3 ${
        active ? "bg-brand-50 border border-brand-200" : "bg-slate-50"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? "text-brand-700" : "text-slate-400"}`}
      />
      <div
        className={`text-xs font-medium ${
          active ? "text-brand-700" : "text-slate-600"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function SuccessState({
  order,
  items,
}: {
  order: OrderRow;
  items: OrderItemRow[];
}) {
  return (
    <div className="bg-gradient-to-b from-emerald-50/50 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-emerald-700/10 p-8 sm:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6"
            >
              <CheckCircle2
                className="h-12 w-12 text-emerald-600"
                strokeWidth={2}
              />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              ชำระเงินสำเร็จ! 🎉
            </h1>
            <p className="text-slate-600 mb-8 text-lg">
              ขอบคุณที่ร่วมเรียนกับเรา คุณสามารถเริ่มเรียนได้ทันที
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 mb-6 text-left">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                คอร์สของคุณ ({items.length})
              </div>
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.course_id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="line-clamp-1">{it.course_title}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between mt-4 pt-3 border-t border-slate-200 text-sm">
                <span className="text-slate-600">ยอดชำระ</span>
                <span className="font-bold text-slate-900">
                  ฿{(order.total_amount / 100).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                render={<Link href="/my-courses" />}
                nativeButton={false}
                size="lg"
                className="bg-brand-700 hover:bg-brand-800 text-white px-6 h-12"
              >
                เริ่มเรียนเลย
              </Button>
              <Button
                render={<Link href="/courses" />}
                nativeButton={false}
                size="lg"
                variant="outline"
                className="border-brand-200 text-brand-700 hover:bg-brand-50 px-6 h-12"
              >
                ดูคอร์สเพิ่ม
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-gradient-to-b from-red-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8 sm:p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
            <XCircle className="h-9 w-9 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            เกิดปัญหา
          </h1>
          <div className="flex items-start gap-2 mb-8 max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 text-left">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              render={<Link href="/cart" />}
              nativeButton={false}
              className="bg-brand-700 hover:bg-brand-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              กลับไปที่ตะกร้า
            </Button>
            <Button
              render={<Link href="/courses" />}
              nativeButton={false}
              variant="outline"
              className="border-brand-200 text-brand-700"
            >
              เลือกคอร์สใหม่
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
