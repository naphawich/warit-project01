"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Menu,
  X,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  LogOut,
  UserCircle,
  BookOpen,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/lib/supabase";
import { useUser, getInitials } from "@/lib/use-user";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "หน้าแรก", href: "/" },
  { label: "คอร์สเรียน", href: "/courses" },
  { label: "ผู้สอน", href: "/#instructor" },
  { label: "รีวิว", href: "/#reviews" },
  { label: "คำถามที่พบบ่อย", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCart((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md shadow-sm border-b border-slate-200/70"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md shadow-brand-700/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Warit<span className="text-brand-700">Academy</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <CartButton mounted={mounted} count={cartCount} />
            <ProfileMenu />
          </div>

          <div className="md:hidden flex items-center gap-1">
            <CartButton mounted={mounted} count={cartCount} />
            <ProfileMenu />
            <button
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-200">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function CartButton({ mounted, count }: { mounted: boolean; count: number }) {
  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
      aria-label="ตะกร้าสินค้า"
    >
      <ShoppingCart className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function ProfileMenu() {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isLoggedIn = !loading && !!user;
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";
  const initials = getInitials(displayName);
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={`relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ring-offset-2 ${
              isLoggedIn
                ? "bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-700/30 hover:from-brand-700 hover:to-brand-900"
                : "bg-gradient-to-br from-brand-100 to-brand-200 text-brand-800 hover:from-brand-200 hover:to-brand-300"
            }`}
            aria-label="โปรไฟล์"
          >
            {isLoggedIn && avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : isLoggedIn ? (
              <span className="text-sm font-semibold">{initials}</span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2">
        {isLoggedIn ? (
          <LoggedInMenu
            displayName={displayName}
            email={user.email ?? ""}
            initials={initials}
            avatarUrl={avatarUrl}
            onLogout={handleLogout}
          />
        ) : (
          <LoggedOutMenu />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoggedInMenu({
  displayName,
  email,
  initials,
  avatarUrl,
  onLogout,
}: {
  displayName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="px-2 py-3 mb-1 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white font-semibold text-sm">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {displayName}
            </div>
            <div className="text-xs text-slate-500 truncate">{email}</div>
          </div>
        </div>
      </div>

      <DropdownMenuItem
        render={<Link href="/profile" />}
        className="cursor-pointer px-2 py-2.5 text-slate-700 hover:text-brand-700"
      >
        <UserCircle className="h-4 w-4 mr-2 text-brand-700" />
        โปรไฟล์ของฉัน
      </DropdownMenuItem>

      <DropdownMenuItem
        render={<Link href="/my-courses" />}
        className="cursor-pointer px-2 py-2.5 text-slate-700 hover:text-brand-700"
      >
        <BookOpen className="h-4 w-4 mr-2 text-brand-700" />
        คอร์สของฉัน
      </DropdownMenuItem>

      <DropdownMenuItem
        render={<Link href="/cart" />}
        className="cursor-pointer px-2 py-2.5 text-slate-700 hover:text-brand-700"
      >
        <ShoppingCart className="h-4 w-4 mr-2 text-brand-700" />
        ตะกร้าของฉัน
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={onLogout}
        className="cursor-pointer px-2 py-2.5 text-red-600 hover:bg-red-50 focus:bg-red-50"
      >
        <LogOut className="h-4 w-4 mr-2" />
        ออกจากระบบ
      </DropdownMenuItem>
    </>
  );
}

function LoggedOutMenu() {
  return (
    <>
      <div className="px-2 py-3 mb-1 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              ยินดีต้อนรับ
            </div>
            <div className="text-xs text-slate-500">
              เข้าสู่ระบบเพื่อเริ่มเรียน
            </div>
          </div>
        </div>
      </div>

      <DropdownMenuItem
        render={<Link href="/login" />}
        className="cursor-pointer px-2 py-2.5 text-slate-700 hover:text-brand-700"
      >
        <LogIn className="h-4 w-4 mr-2 text-brand-700" />
        เข้าสู่ระบบ
      </DropdownMenuItem>

      <DropdownMenuItem
        render={<Link href="/signup" />}
        className="cursor-pointer px-2 py-2.5 text-slate-700 hover:text-brand-700"
      >
        <UserPlus className="h-4 w-4 mr-2 text-brand-700" />
        สมัครสมาชิก
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <div className="px-2 py-2 text-xs text-slate-500 leading-relaxed">
        มีบัญชีอยู่แล้ว? เข้าสู่ระบบเพื่อดูคอร์สที่เรียนและบันทึกความคืบหน้า
      </div>
    </>
  );
}
