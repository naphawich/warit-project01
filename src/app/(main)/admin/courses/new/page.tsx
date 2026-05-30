"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import {
  COURSE_LEVELS,
  COURSE_COLOR_PRESETS,
  type NewCourseInput,
} from "@/lib/courses-db";
import { courses as staticCatalog } from "@/lib/data";

const DEFAULT_FEATURES = [
  "เรียนได้ตลอดชีพ",
  "ใบประกาศนียบัตร",
  "เข้าถึงได้ทุกอุปกรณ์",
  "กลุ่มผู้เรียนสำหรับถาม-ตอบ",
];

function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

export default function NewCoursePage() {
  const router = useRouter();

  // Suggest categories from existing static catalog
  const categorySuggestions = useMemo(
    () => Array.from(new Set(staticCatalog.map((c) => c.category))),
    []
  );

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<NewCourseInput["level"]>("ระดับเริ่มต้น");
  const [lessons, setLessons] = useState<number | "">(20);
  const [hours, setHours] = useState<number | "">(10);
  const [price, setPrice] = useState<number | "">(1990);
  const [originalPrice, setOriginalPrice] = useState<number | "">(2990);
  const [color, setColor] = useState(COURSE_COLOR_PRESETS[0].value);
  const [instructorName, setInstructorName] = useState("");
  const [instructorRole, setInstructorRole] = useState("");
  const [whatYouLearn, setWhatYouLearn] = useState<string[]>([
    "",
    "",
    "",
  ]);
  const [features, setFeatures] = useState<string[]>(DEFAULT_FEATURES);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateListItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    value: string
  ) => {
    const next = [...list];
    next[idx] = value;
    setter(next);
  };
  const addListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => setter((s) => [...s, ""]);
  const removeListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number
  ) => setter((s) => s.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !shortDesc.trim() || !category.trim()) {
      setError("กรุณากรอกข้อมูลที่จำเป็น (ชื่อคอร์ส, คำอธิบายสั้น, หมวดหมู่)");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("ไม่มี session — โปรด login ใหม่");
        return;
      }

      const payload: NewCourseInput = {
        title: title.trim(),
        short_description: shortDesc.trim(),
        long_description: longDesc.trim(),
        category: category.trim(),
        level,
        lessons: Number(lessons) || 0,
        hours: Number(hours) || 0,
        price: Number(price) || 0,
        original_price: Number(originalPrice) || 0,
        color,
        instructor_name: instructorName.trim(),
        instructor_role: instructorRole.trim(),
        instructor_initials: deriveInitials(instructorName),
        what_you_learn: whatYouLearn.filter((s) => s.trim().length > 0),
        features: features.filter((s) => s.trim().length > 0),
      };

      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || json.error || "บันทึกไม่สำเร็จ");
        return;
      }
      // Jump straight to lesson manager so admin can start uploading
      router.push(`/admin/courses/${json.id}/lessons`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/admin"
              className="hover:text-brand-700 transition-colors"
            >
              Admin
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium">เพิ่มคอร์สใหม่</span>
          </nav>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10"
      >
        <div className="mb-8">
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
            เพิ่มคอร์สใหม่
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            สร้างคอร์สใหม่
          </h1>
          <p className="text-slate-600">
            หลังบันทึกแล้ว ระบบจะพาไปหน้าจัดการบทเรียนเพื่ออัปโหลดวิดีโอ
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live preview card */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div
            className={`aspect-video bg-gradient-to-br ${color} flex items-center justify-center`}
          >
            <BookOpen
              className="h-20 w-20 text-white/30"
              strokeWidth={1.5}
            />
          </div>
          <div className="p-5">
            <div className="text-xs font-medium text-brand-700 mb-1">
              {category || "หมวดหมู่"}
            </div>
            <div className="font-semibold text-slate-900 text-lg leading-snug min-h-[2.5rem]">
              {title || "ชื่อคอร์ส"}
            </div>
            <div className="text-sm text-slate-600 mt-1 line-clamp-2">
              {shortDesc || "คำอธิบายสั้น"}
            </div>
          </div>
        </div>

        {/* Section: Basics */}
        <Section
          title="ข้อมูลพื้นฐาน"
          subtitle="หัวข้อ คำอธิบาย และหมวดหมู่"
        >
          <div className="space-y-5">
            <FieldGroup label="ชื่อคอร์ส" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น พื้นฐานชีววิทยา ม.4 สำหรับเตรียมเข้ามหาวิทยาลัย"
                className="h-11"
                disabled={submitting}
                required
              />
            </FieldGroup>

            <FieldGroup
              label="คำอธิบายสั้น"
              required
              hint="ปรากฏใต้ชื่อคอร์สและในการ์ดบนรายการ — 1-2 ประโยค"
            >
              <textarea
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                rows={2}
                placeholder="คำอธิบายแบบสั้น 1-2 ประโยค"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                disabled={submitting}
                required
              />
            </FieldGroup>

            <FieldGroup
              label="คำอธิบายแบบเต็ม"
              hint="ปรากฏในหน้ารายละเอียดคอร์ส — เขียนได้ยาว"
            >
              <textarea
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
                rows={5}
                placeholder="อธิบายเนื้อหา + เหมาะกับใคร + จะได้อะไรหลังจบคอร์ส"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                disabled={submitting}
              />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="หมวดหมู่" required>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="เช่น ชีววิทยา"
                  list="category-suggestions"
                  className="h-11"
                  disabled={submitting}
                  required
                />
                <datalist id="category-suggestions">
                  {categorySuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </FieldGroup>

              <FieldGroup label="ระดับ" required>
                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(e.target.value as NewCourseInput["level"])
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  disabled={submitting}
                >
                  {COURSE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>
          </div>
        </Section>

        {/* Section: Numbers */}
        <Section
          title="ขนาดและราคา"
          subtitle="จำนวนบทเรียน ระยะเวลา และราคา"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FieldGroup label="จำนวนบทเรียน">
              <Input
                type="number"
                min={0}
                value={lessons}
                onChange={(e) =>
                  setLessons(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="h-11"
                disabled={submitting}
              />
            </FieldGroup>
            <FieldGroup label="ชั่วโมงรวม">
              <Input
                type="number"
                min={0}
                value={hours}
                onChange={(e) =>
                  setHours(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="h-11"
                disabled={submitting}
              />
            </FieldGroup>
            <FieldGroup label="ราคา (฿)">
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="h-11"
                disabled={submitting}
              />
            </FieldGroup>
            <FieldGroup label="ราคาเดิม (฿)">
              <Input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) =>
                  setOriginalPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="h-11"
                disabled={submitting}
              />
            </FieldGroup>
          </div>
        </Section>

        {/* Section: Theme color */}
        <Section
          title="สีของคอร์ส"
          subtitle="สีไล่ระดับใน thumbnail ของคอร์ส"
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {COURSE_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setColor(preset.value)}
                className={`relative aspect-video rounded-xl bg-gradient-to-br ${preset.value} overflow-hidden ring-offset-2 transition-all ${
                  color === preset.value
                    ? "ring-2 ring-brand-700 scale-105"
                    : "hover:scale-105"
                }`}
              >
                <span className="absolute bottom-1 left-2 right-2 text-[10px] font-medium text-white text-shadow-sm text-left">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Section: Instructor */}
        <Section title="ผู้สอน" subtitle="ข้อมูลผู้สอนของคอร์สนี้">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="ชื่อผู้สอน" required>
              <Input
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="เช่น วริศ ฤทธิ์มานะ"
                className="h-11"
                disabled={submitting}
                required
              />
            </FieldGroup>
            <FieldGroup label="ตำแหน่ง / สังกัด">
              <Input
                value={instructorRole}
                onChange={(e) => setInstructorRole(e.target.value)}
                placeholder="เช่น ติวเตอร์ชีววิทยา ม.ปลาย"
                className="h-11"
                disabled={submitting}
              />
            </FieldGroup>
          </div>
          {instructorName.trim() && (
            <div className="mt-3 text-xs text-slate-500">
              ตัวอักษรย่อที่จะใช้: <span className="font-semibold">{deriveInitials(instructorName)}</span>
            </div>
          )}
        </Section>

        {/* Section: What you'll learn */}
        <Section
          title="สิ่งที่ผู้เรียนจะได้"
          subtitle="ลิสต์สิ่งที่ผู้เรียนจะได้หลังจบคอร์ส (เพิ่ม-ลบได้)"
        >
          <ListEditor
            items={whatYouLearn}
            placeholder="เช่น เข้าใจหลักการสมดุลกรด-เบส"
            onChange={(idx, value) =>
              updateListItem(whatYouLearn, setWhatYouLearn, idx, value)
            }
            onRemove={(idx) => removeListItem(setWhatYouLearn, idx)}
            onAdd={() => addListItem(setWhatYouLearn)}
            disabled={submitting}
          />
        </Section>

        {/* Section: Features */}
        <Section
          title="สิ่งที่คอร์สนี้รวม"
          subtitle="ปรากฏใต้ราคาในหน้ารายละเอียด"
        >
          <ListEditor
            items={features}
            placeholder="เช่น เรียนได้ตลอดชีพ"
            onChange={(idx, value) =>
              updateListItem(features, setFeatures, idx, value)
            }
            onRemove={(idx) => removeListItem(setFeatures, idx)}
            onAdd={() => addListItem(setFeatures)}
            disabled={submitting}
          />
        </Section>

        <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-slate-200">
          <Button
            type="button"
            render={<Link href="/admin" />}
            nativeButton={false}
            variant="outline"
            className="border-slate-200 text-slate-700"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                บันทึก + จัดการบทเรียน
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-5">
      <div className="mb-5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function FieldGroup({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-slate-700 text-sm mb-1.5 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function ListEditor({
  items,
  placeholder,
  onChange,
  onAdd,
  onRemove,
  disabled,
}: {
  items: string[];
  placeholder: string;
  onChange: (idx: number, value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {items.map((value, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(idx, e.target.value)}
            placeholder={placeholder}
            className="flex-1 h-10"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onRemove(idx)}
            disabled={disabled || items.length === 1}
            className="border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        disabled={disabled}
        className="border-dashed border-slate-300 text-slate-600 hover:border-brand-300 hover:text-brand-700 w-full"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        เพิ่มข้อ
      </Button>
    </div>
  );
}
