"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Check, Lock, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";
import { useUser } from "@/lib/use-user";
import { useIsCourseOwned } from "@/lib/use-ownership";

type Props = {
  item: CartItem;
};

// Persist intent across login redirect
const PENDING_KEY = "warit-pending-action";

type PendingAction = {
  action: "add-to-cart" | "buy-now";
  item: CartItem;
};

export function CourseActions({ item }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useUser();
  const { owned, loading: ownershipLoading } = useIsCourseOwned(item.id);
  const addItem = useCart((s) => s.addItem);
  const removeFromCart = useCart((s) => s.removeItem);
  const inCart = useCart((s) => s.items.some((i) => i.id === item.id));

  useEffect(() => setMounted(true), []);

  // If user owns this course, ensure it's not in cart
  useEffect(() => {
    if (mounted && owned && inCart) removeFromCart(item.id);
  }, [mounted, owned, inCart, removeFromCart, item.id]);

  // After login, resume pending action saved before redirect
  useEffect(() => {
    if (!mounted || loading || !user || ownershipLoading) return;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const pending: PendingAction = JSON.parse(raw);
      if (pending.item.id !== item.id) return;
      localStorage.removeItem(PENDING_KEY);
      if (owned) return; // already owns it — nothing to do
      addItem(pending.item);
      if (pending.action === "buy-now") {
        router.push("/cart");
      }
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
  }, [mounted, loading, user, ownershipLoading, owned, item.id, addItem, router]);

  // OWNED — show "เริ่มเรียน" CTA
  if (mounted && owned) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 mb-1">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-semibold text-emerald-900">
              คุณเป็นเจ้าของคอร์สนี้แล้ว
            </div>
            <div className="text-xs text-emerald-700">
              เริ่มเรียนได้ทุกเมื่อ
            </div>
          </div>
        </div>
        <Button
          render={<Link href={`/learn/${item.id}`} />}
          nativeButton={false}
          className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25 text-base"
        >
          <Play className="h-4 w-4 mr-1.5" fill="currentColor" />
          เริ่มเรียนเลย
        </Button>
        <Button
          render={<Link href="/my-courses" />}
          nativeButton={false}
          variant="outline"
          className="w-full h-11 border-brand-200 text-brand-700 hover:bg-brand-50"
        >
          ดูคอร์สทั้งหมดของฉัน
        </Button>
      </div>
    );
  }

  const redirectToLogin = (pending: PendingAction) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {
      // localStorage may be unavailable; proceed without pending state
    }
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  };

  const handleBuyNow = () => {
    if (!user) {
      redirectToLogin({ action: "buy-now", item });
      return;
    }
    addItem(item);
    router.push("/cart");
  };

  const handleAddToCart = () => {
    if (!user) {
      redirectToLogin({ action: "add-to-cart", item });
      return;
    }
    if (!inCart) addItem(item);
  };

  // Show login-required hint when not authenticated
  const showLoginHint = mounted && !loading && !user;
  const busy = loading || ownershipLoading;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBuyNow}
        disabled={busy}
        className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25 text-base disabled:opacity-70"
      >
        <ShoppingCart className="h-4 w-4 mr-1.5" />
        ซื้อคอร์สนี้
      </Button>
      <Button
        onClick={handleAddToCart}
        variant="outline"
        disabled={busy || (mounted && !!user && inCart)}
        className="w-full h-11 border-brand-200 text-brand-700 hover:bg-brand-50 disabled:opacity-100 disabled:bg-brand-50 disabled:border-brand-200"
      >
        {mounted && user && inCart ? (
          <>
            <Check className="h-4 w-4 mr-1.5" />
            อยู่ในตะกร้าแล้ว
          </>
        ) : (
          "เพิ่มลงตะกร้า"
        )}
      </Button>
      {showLoginHint && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
          <Lock className="h-3 w-3" />
          ต้องเข้าสู่ระบบก่อนซื้อคอร์ส
        </p>
      )}
    </div>
  );
}
