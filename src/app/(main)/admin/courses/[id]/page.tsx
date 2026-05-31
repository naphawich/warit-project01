"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Play,
  BookOpen,
  ArrowRight,
  Film,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { courses as catalog } from "@/lib/data";
import type { Course } from "@/lib/data";
import { loadCourseById } from "@/lib/courses-db";
import {
  uploadFileMultipart,
  type UploadHandle,
  type UploadProgress,
} from "@/lib/multipart-upload-client";

type PreviewRow = {
  course_id: number;
  video_storage_key: string | null;
  video_size_bytes: number | null;
  duration_seconds: number | null;
  video_uploaded_at: string | null;
};

type UploadState = {
  phase: "idle" | "uploading" | "error";
  progress?: UploadProgress;
  error?: string;
  handle?: UploadHandle;
};

function bytesPretty(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatClock(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ไม่มี session");
  return session.access_token;
}

export default function AdminCoursePage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const isStatic = catalog.some((c) => c.id === courseId);

  const [course, setCourse] = useState<Course | undefined | null>(() =>
    catalog.find((c) => c.id === courseId)
  );
  useEffect(() => {
    if (course !== undefined) return;
    let active = true;
    (async () => {
      const found = await loadCourseById(catalog, supabase, courseId);
      if (active) setCourse(found);
    })();
    return () => {
      active = false;
    };
  }, [course, courseId]);

  const [error, setError] = useState<string | null>(null);

  // ── Editable course text ────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [savingText, setSavingText] = useState(false);
  const [savedText, setSavedText] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  if (course && !hydrated) {
    setHydrated(true);
    setTitle(course.title);
    setShortDesc(course.shortDescription);
    setLongDesc(course.longDescription);
  }

  const saveText = async () => {
    if (!course) return;
    setSavingText(true);
    setSavedText(false);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          short_description: shortDesc,
          long_description: longDesc,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail ?? json.error ?? "บันทึกไม่สำเร็จ");
      setSavedText(true);
      setTimeout(() => setSavedText(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSavingText(false);
    }
  };

  // ── Preview clip ──────────────────────────────────────────────────────────
  const [preview, setPreview] = useState<PreviewRow | null | undefined>(
    undefined
  );
  const fetchPreview = useCallback(async () => {
    const { data } = await supabase
      .from("course_previews")
      .select("*")
      .eq("course_id", courseId)
      .maybeSingle();
    setPreview((data as PreviewRow) ?? null);
  }, [courseId]);
  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  const [upload, setUpload] = useState<UploadState>({ phase: "idle" });
  const [deletingPreview, setDeletingPreview] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);

  const startPreviewUpload = async (file: File) => {
    setUpload({ phase: "uploading" });
    setError(null);
    try {
      const token = await getToken();
      const handle = uploadFileMultipart({
        file,
        previewCourseId: courseId,
        accessToken: token,
        onProgress: (progress) =>
          setUpload({ phase: "uploading", progress, handle }),
      });
      setUpload({ phase: "uploading", handle });
      await handle.promise;
      setUpload({ phase: "idle" });
      setPlayUrl(null);
      await fetchPreview();
    } catch (e) {
      setUpload({
        phase: "error",
        error: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ",
      });
    }
  };

  const deletePreview = async () => {
    if (!window.confirm("ลบวิดีโอตัวอย่างของคอร์สนี้ใช่หรือไม่?")) return;
    setDeletingPreview(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/course-preview/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail ?? json.error ?? "ลบไม่สำเร็จ");
      setPlayUrl(null);
      await fetchPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setDeletingPreview(false);
    }
  };

  const playPreview = async () => {
    if (playUrl || loadingPlay) return;
    setLoadingPlay(true);
    try {
      const res = await fetch(`/api/course-preview/${courseId}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { url?: string };
      if (res.ok && json.url) setPlayUrl(json.url);
    } finally {
      setLoadingPlay(false);
    }
  };

  if (course === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">ไม่พบคอร์ส</h1>
        <Button
          render={<Link href="/admin" />}
          nativeButton={false}
          className="bg-brand-700 hover:bg-brand-800 text-white"
        >
          กลับหน้า Admin
        </Button>
      </div>
    );
  }

  const hasPreview = !!preview?.video_storage_key;

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
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
            <span className="text-slate-900 font-medium truncate">
              {course.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
            จัดการคอร์ส
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Course details ──────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            ชื่อและคำอธิบาย
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            ข้อมูลนี้จะแสดงในหน้ารายละเอียดคอร์ส
          </p>

          {isStatic ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              คอร์สตัวอย่างนี้ถูกกำหนดไว้ในระบบ (ไม่ใช่คอร์สที่สร้างเอง)
              จึงแก้ชื่อ/คำอธิบายผ่านหน้านี้ไม่ได้ — แต่ยังอัปโหลดวิดีโอตัวอย่างและ
              จัดการบทเรียนได้ตามปกติ
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ชื่อคอร์ส
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                  placeholder="ชื่อคอร์ส"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  คำอธิบายสั้น
                </label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 resize-y"
                  placeholder="คำโปรยสั้นๆ ของคอร์ส"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  คำอธิบายแบบยาว
                </label>
                <textarea
                  value={longDesc}
                  onChange={(e) => setLongDesc(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 resize-y"
                  placeholder="รายละเอียดเกี่ยวกับคอร์สนี้"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={saveText}
                  disabled={savingText}
                  className="bg-brand-700 hover:bg-brand-800 text-white"
                >
                  {savingText ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      บันทึก
                    </>
                  )}
                </Button>
                {savedText && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    บันทึกแล้ว
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Preview clip ────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Film className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-900">วิดีโอตัวอย่าง</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            คลิปนี้จะเล่นได้ในหน้ารายละเอียดคอร์ส ให้ผู้สนใจดูก่อนตัดสินใจซื้อ —
            เวลาจะอัปเดตอัตโนมัติตามไฟล์ที่อัปโหลด
          </p>

          {preview === undefined ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Player / placeholder */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                {hasPreview && playUrl ? (
                  <video
                    src={playUrl}
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload"
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${course.color} flex items-center justify-center`}
                  >
                    {hasPreview ? (
                      <button
                        onClick={playPreview}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-2xl hover:bg-white hover:scale-110 transition-all"
                        aria-label="เล่นตัวอย่าง"
                      >
                        {loadingPlay ? (
                          <Loader2 className="h-8 w-8 text-brand-700 animate-spin" />
                        ) : (
                          <Play
                            className="h-8 w-8 text-brand-700 ml-1"
                            fill="currentColor"
                          />
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center text-white/70 gap-2">
                        <BookOpen className="h-12 w-12" strokeWidth={1.3} />
                        <span className="text-sm">ยังไม่มีวิดีโอตัวอย่าง</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              {hasPreview && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    มีวิดีโอตัวอย่าง
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatClock(preview?.duration_seconds)}
                  </span>
                  <span>{bytesPretty(preview?.video_size_bytes)}</span>
                  {preview?.video_uploaded_at && (
                    <span>
                      อัปเมื่อ{" "}
                      {new Date(preview.video_uploaded_at).toLocaleString(
                        "th-TH"
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Upload progress */}
              {upload.phase === "uploading" && (
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>กำลังอัปโหลด...</span>
                    <span className="font-medium tabular-nums">
                      {upload.progress
                        ? `${upload.progress.percent.toFixed(1)}%`
                        : "เริ่มต้น..."}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-700 transition-all"
                      style={{ width: `${upload.progress?.percent ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {upload.phase === "error" && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                  <span>{upload.error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {upload.phase === "uploading" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      upload.handle?.cancel();
                      setUpload({ phase: "idle" });
                    }}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    ยกเลิก
                  </Button>
                ) : (
                  <>
                    <PreviewUploadButton
                      label={hasPreview ? "แทนที่วิดีโอ" : "อัปโหลดวิดีโอตัวอย่าง"}
                      primary={!hasPreview}
                      onPick={startPreviewUpload}
                    />
                    {hasPreview && (
                      <Button
                        onClick={deletePreview}
                        disabled={deletingPreview}
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        {deletingPreview ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            ลบ
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Lessons entry point ─────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">บทเรียน</h2>
              </div>
              <p className="text-sm text-slate-500">
                เพิ่ม/ลบบทและบทเรียน แก้ชื่อ-คำอธิบาย และอัปโหลดวิดีโอของแต่ละบท
              </p>
            </div>
            <Button
              render={<Link href={`/admin/courses/${course.id}/lessons`} />}
              nativeButton={false}
              className="bg-brand-700 hover:bg-brand-800 text-white flex-shrink-0"
            >
              จัดการบทเรียน
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewUploadButton({
  label,
  primary,
  onPick,
}: {
  label: string;
  primary?: boolean;
  onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <Button
        onClick={() => ref.current?.click()}
        className={
          primary
            ? "bg-violet-600 hover:bg-violet-700 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-0"
        }
      >
        <Upload className="h-4 w-4 mr-1.5" />
        {label}
      </Button>
    </>
  );
}
