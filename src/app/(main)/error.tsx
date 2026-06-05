"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = unstable_retry ?? reset ?? (() => window.location.reload());

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900">เกิดข้อผิดพลาดบางอย่าง</h2>
      <p className="text-slate-500 max-w-sm">
        ขออภัยในความไม่สะดวก กรุณาลองใหม่อีกครั้ง
      </p>
      <Button onClick={handleRetry}>ลองใหม่อีกครั้ง</Button>
    </div>
  );
}
