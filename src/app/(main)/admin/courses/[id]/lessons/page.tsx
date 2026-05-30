"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Upload,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { courses as catalog } from "@/lib/data";
import {
  uploadFileMultipart,
  type UploadHandle,
  type UploadProgress,
} from "@/lib/multipart-upload-client";

type LessonRow = {
  id: string;
  course_id: number;
  chapter_index: number;
  lesson_index: number;
  global_index: number;
  title: string;
  duration_seconds: number | null;
  video_storage_key: string | null;
  video_size_bytes: number | null;
  video_uploaded_at: string | null;
};

type LessonUploadState = {
  phase: "idle" | "uploading" | "complete" | "error";
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

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} นาที`;
}

export default function AdminLessonsPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const course = useMemo(
    () => catalog.find((c) => c.id === courseId),
    [courseId]
  );

  const [lessons, setLessons] = useState<LessonRow[] | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, LessonUploadState>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const fetchLessons = useCallback(async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("global_index", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setLessons((data as LessonRow[]) ?? []);
  }, [courseId]);

  useEffect(() => {
    void fetchLessons();
  }, [fetchLessons]);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("ไม่มี session");
      const res = await fetch(`/api/admin/seed-lessons/${courseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "seed failed");
      await fetchLessons();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const startUpload = async (lesson: LessonRow, file: File) => {
    setUploads((u) => ({ ...u, [lesson.id]: { phase: "uploading" } }));
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("ไม่มี session");

      const handle = uploadFileMultipart({
        file,
        lessonId: lesson.id,
        accessToken: session.access_token,
        onProgress: (progress) =>
          setUploads((u) => ({
            ...u,
            [lesson.id]: { phase: "uploading", progress, handle },
          })),
      });

      setUploads((u) => ({
        ...u,
        [lesson.id]: { phase: "uploading", handle },
      }));

      await handle.promise;
      setUploads((u) => ({ ...u, [lesson.id]: { phase: "complete" } }));
      await fetchLessons();
    } catch (e) {
      setUploads((u) => ({
        ...u,
        [lesson.id]: {
          phase: "error",
          error: e instanceof Error ? e.message : "Upload failed",
        },
      }));
    }
  };

  const cancelUpload = (lessonId: string) => {
    setUploads((u) => {
      u[lessonId]?.handle?.cancel();
      return { ...u, [lessonId]: { phase: "idle" } };
    });
  };

  const deleteVideo = async (lesson: LessonRow) => {
    if (
      !window.confirm(
        `ลบวิดีโอของบทเรียน "${lesson.title}" ใช่หรือไม่?\nไฟล์จะถูกลบจาก R2 และไม่สามารถกู้คืนได้`
      )
    ) {
      return;
    }
    setError(null);
    setDeleting((d) => ({ ...d, [lesson.id]: true }));
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("ไม่มี session");
      const res = await fetch(`/api/admin/lesson-video/${lesson.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "delete failed");
      await fetchLessons();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting((d) => ({ ...d, [lesson.id]: false }));
    }
  };

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          ไม่พบคอร์ส
        </h1>
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

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white">
      <div className="border-b border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              หน้าแรก
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/admin" className="hover:text-brand-700 transition-colors">
              Admin
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 font-medium truncate">
              {course.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
            จัดการบทเรียน
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {course.title}
          </h1>
          <p className="text-slate-600">
            อัปโหลดวิดีโอ MP4 สำหรับแต่ละบทเรียน — รองรับไฟล์ใหญ่ ผ่าน multipart
            upload ตรงไป Cloudflare R2
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lessons === null ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
              <Sparkles className="h-8 w-8 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              ยังไม่ได้ตั้งค่าบทเรียนสำหรับคอร์สนี้
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              คลิกปุ่มด้านล่างเพื่อสร้าง {course.lessons} บทเรียนตามโครงสร้างคอร์ส —
              คุณจะอัปโหลดวิดีโอแต่ละบทได้ทันที
            </p>
            <Button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-brand-700 hover:bg-brand-800 text-white"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  สร้างบทเรียน ({course.lessons} บท)
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, i) => {
              const state = uploads[lesson.id];
              const hasVideo = !!lesson.video_storage_key;
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold flex-shrink-0">
                      {lesson.global_index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {lesson.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span>บทที่ {lesson.chapter_index + 1}</span>
                        {lesson.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        )}
                        {hasVideo && lesson.video_size_bytes && (
                          <span>{bytesPretty(lesson.video_size_bytes)}</span>
                        )}
                      </div>

                      {state?.phase === "uploading" && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>กำลังอัปโหลด...</span>
                            <span className="font-medium tabular-nums">
                              {state.progress
                                ? `${state.progress.percent.toFixed(1)}% • ${bytesPretty(
                                    state.progress.bytesUploaded
                                  )} / ${bytesPretty(state.progress.totalBytes)}`
                                : "เริ่มต้น..."}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                              style={{
                                width: `${state.progress?.percent ?? 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {state?.phase === "error" && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                          <span>{state.error}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex gap-2">
                      {state?.phase === "uploading" ? (
                        <Button
                          variant="outline"
                          onClick={() => cancelUpload(lesson.id)}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          ยกเลิก
                        </Button>
                      ) : (
                        <>
                          {hasVideo && (
                            <Button
                              variant="outline"
                              onClick={() => deleteVideo(lesson)}
                              disabled={deleting[lesson.id]}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              {deleting[lesson.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <UploadButton
                            lesson={lesson}
                            label={hasVideo ? "แทนที่" : "อัปโหลด"}
                            onPick={startUpload}
                            primary={!hasVideo}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {hasVideo && state?.phase !== "uploading" && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      อัปโหลดแล้ว — บันทึกเมื่อ{" "}
                      {lesson.video_uploaded_at
                        ? new Date(lesson.video_uploaded_at).toLocaleString(
                            "th-TH"
                          )
                        : "—"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadButton({
  lesson,
  label,
  primary = false,
  onPick,
}: {
  lesson: LessonRow;
  label: string;
  primary?: boolean;
  onPick: (lesson: LessonRow, file: File) => void;
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
          if (file) onPick(lesson, file);
          e.target.value = "";
        }}
      />
      <Button
        onClick={() => ref.current?.click()}
        className={
          primary
            ? "bg-brand-700 hover:bg-brand-800 text-white"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-0"
        }
      >
        <Upload className="h-4 w-4 mr-1.5" />
        {label}
      </Button>
    </>
  );
}
