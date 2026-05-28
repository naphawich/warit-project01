"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";

type Props = {
  item: CartItem;
};

export function CourseActions({ item }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const inCart = useCart((s) => s.items.some((i) => i.id === item.id));

  useEffect(() => setMounted(true), []);

  const handleBuyNow = () => {
    addItem(item);
    router.push("/cart");
  };

  const handleAddToCart = () => {
    if (!inCart) addItem(item);
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBuyNow}
        className="w-full h-12 bg-brand-700 hover:bg-brand-800 text-white shadow-lg shadow-brand-700/25 text-base"
      >
        <ShoppingCart className="h-4 w-4 mr-1.5" />
        ซื้อคอร์สนี้
      </Button>
      <Button
        onClick={handleAddToCart}
        variant="outline"
        disabled={mounted && inCart}
        className="w-full h-11 border-brand-200 text-brand-700 hover:bg-brand-50 disabled:opacity-100 disabled:bg-brand-50 disabled:border-brand-200"
      >
        {mounted && inCart ? (
          <>
            <Check className="h-4 w-4 mr-1.5" />
            อยู่ในตะกร้าแล้ว
          </>
        ) : (
          "เพิ่มลงตะกร้า"
        )}
      </Button>
    </div>
  );
}
