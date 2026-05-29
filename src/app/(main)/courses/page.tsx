"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Clock,
  Users,
  Star,
  BookOpen,
  ArrowRight,
  ChevronRight,
  SlidersHorizontal,
  X,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { courses } from "@/lib/data";
import { useOwnedCourseIds } from "@/lib/use-ownership";

type SortKey = "popular" | "rating" | "price-asc" | "price-desc" | "newest";

const sortOptions: Record<SortKey, string> = {
  popular: "ยอดนิยม",
  rating: "คะแนนสูงสุด",
  "price-asc": "ราคา: น้อย → มาก",
  "price-desc": "ราคา: มาก → น้อย",
  newest: "ใหม่ล่าสุด",
};

export default function CoursesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ทั้งหมด");
  const [activeLevel, setActiveLevel] = useState<string>("ทั้งหมด");
  const [sort, setSort] = useState<SortKey>("popular");
  const ownedIds = useOwnedCourseIds();

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category));
    return ["ทั้งหมด", ...Array.from(set)];
  }, []);

  const levels = useMemo(() => {
    const set = new Set(courses.map((c) => c.level));
    return ["ทั้งหมด", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = courses.filter((c) => {
      if (activeCategory !== "ทั้งหมด" && c.category !== activeCategory)
        return false;
      if (activeLevel !== "ทั้งหมด" && c.level !== activeLevel) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.shortDescription.toLowerCase().includes(q))
        return false;
      return true;
    });
    switch (sort) {
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result = [...result].sort((a, b) => b.id - a.id);
        break;
      default:
        result = [...result].sort((a, b) => b.students - a.students);
    }
    return result;
  }, [query, activeCategory, activeLevel, sort]);

  const hasFilters =
    query !== "" || activeCategory !== "ทั้งหมด" || activeLevel !== "ทั้งหมด";

  const clearAll = () => {
    setQuery("");
    setActiveCategory("ทั้งหมด");
    setActiveLevel("ทั้งหมด");
  };

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
            <span className="text-slate-900 font-medium">คอร์สเรียนทั้งหมด</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Page header */}
        <div className="max-w-3xl mb-10">
          <Badge className="bg-brand-100 text-brand-800 hover:bg-brand-100 border-0 mb-4">
            คอร์สเรียนทั้งหมด
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            ค้นพบคอร์สที่ใช่สำหรับคุณ
          </h1>
          <p className="text-slate-600 leading-relaxed">
            เลือกจาก {courses.length} คอร์สคุณภาพสูง
            ครอบคลุมหลากหลายหมวดหมู่ สอนโดยผู้เชี่ยวชาญตัวจริง
          </p>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="ค้นหาคอร์สที่คุณสนใจ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-11"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Level filter */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center justify-between gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 min-w-44">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      ระดับ: {activeLevel}
                    </span>
                  </button>
                }
              />
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="min-w-44 p-1"
              >
                <DropdownMenuRadioGroup
                  value={activeLevel}
                  onValueChange={setActiveLevel}
                >
                  {levels.map((lvl) => (
                    <DropdownMenuRadioItem
                      key={lvl}
                      value={lvl}
                      className="py-2"
                    >
                      {lvl}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center justify-between gap-2 h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 min-w-52">
                    <span>เรียงตาม: {sortOptions[sort]}</span>
                  </button>
                }
              />
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="min-w-52 p-1"
              >
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  {(Object.keys(sortOptions) as SortKey[]).map((key) => (
                    <DropdownMenuRadioItem
                      key={key}
                      value={key}
                      className="py-2"
                    >
                      {sortOptions[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category chips */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-700 text-white shadow-sm shadow-brand-700/30"
                      : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result counter */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-600">
            แสดง{" "}
            <span className="font-semibold text-slate-900">
              {filtered.length}
            </span>{" "}
            จาก{" "}
            <span className="font-semibold text-slate-900">
              {courses.length}
            </span>{" "}
            คอร์ส
          </p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-sm text-slate-500 hover:text-brand-700 transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-2xl mx-auto">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              ไม่พบคอร์สที่ค้นหา
            </h3>
            <p className="text-slate-600 mb-6">
              ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองดูครับ
            </p>
            <Button
              onClick={clearAll}
              className="bg-brand-700 hover:bg-brand-800 text-white"
            >
              ล้างตัวกรอง
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => {
              const isOwned = ownedIds?.has(course.id) ?? false;
              const linkHref = isOwned
                ? `/learn/${course.id}`
                : `/courses/${course.id}`;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                  className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-700/5 ${
                    isOwned
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-slate-200 hover:border-brand-200"
                  }`}
                >
                  <Link
                    href={linkHref}
                    className="block"
                    aria-label={course.title}
                  >
                    <div
                      className={`aspect-video bg-gradient-to-br ${course.color} relative flex items-center justify-center overflow-hidden`}
                    >
                      <BookOpen
                        className="h-20 w-20 text-white/30 group-hover:scale-110 transition-transform duration-500"
                        strokeWidth={1.5}
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-white/20 text-white backdrop-blur-md border-0 hover:bg-white/30">
                          {course.level}
                        </Badge>
                        {isOwned && (
                          <Badge className="bg-emerald-500 text-white border-0 hover:bg-emerald-500 shadow-md">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            ซื้อแล้ว
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                      <div>
                        <div className="text-xs font-medium text-brand-700 mb-2">
                          {course.category}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-brand-700 transition-colors">
                          {course.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.lessons} บทเรียน</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{course.hours} ชม.</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-semibold text-slate-700">
                              {course.rating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Users className="h-4 w-4" />
                            <span>{course.students.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-2">
                        {isOwned ? (
                          <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            คุณเป็นเจ้าของแล้ว
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs text-slate-400 line-through">
                              ฿{course.originalPrice.toLocaleString()}
                            </div>
                            <div className="text-xl font-bold text-brand-700">
                              ฿{course.price.toLocaleString()}
                            </div>
                          </div>
                        )}
                        <Button
                          size="sm"
                          className={`group/btn pointer-events-none text-white ${
                            isOwned
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-brand-700 hover:bg-brand-800"
                          }`}
                        >
                          {isOwned ? (
                            <>
                              <Play className="h-3.5 w-3.5 mr-1" fill="currentColor" />
                              เริ่มเรียน
                            </>
                          ) : (
                            <>
                              ดูคอร์ส
                              <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
