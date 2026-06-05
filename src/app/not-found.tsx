import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-7xl font-extrabold text-brand-600">404</p>
        <h1 className="text-2xl font-bold text-slate-900">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-slate-500 max-w-sm mx-auto">
          หน้านี้อาจถูกย้ายหรือลบออกไปแล้ว กรุณาตรวจสอบ URL อีกครั้ง
        </p>
      </div>
      <Button render={<Link href="/" />} nativeButton={false}>
        กลับหน้าแรก
      </Button>
    </div>
  );
}
