"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Plus,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { motion } from "motion/react";
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

type ChapterRow = {
  id: string;
  course_id: number;
  chapter_index: number;
  title: string;
};

type LessonRow = {
  id: string;
  course_id: number;
  chapter_index: number;
  lesson_index: number;
  global_index: number;
  title: string;
  description: string | null;
  duration_seconds: number | null;
  video_storage_key: string | null;
  video_size_bytes: number | null;
  video_uploaded_at: string | null;
  is_preview: boolean;
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

// mm:ss for short clips, otherwise h ชม. m นาที
function formatClock(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("ไม่มี session");
  return session.access_token;
}

export default function AdminLessonsPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
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

  const [chapters, setChapters] = useState<ChapterRow[] | null>(null);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, LessonUploadState>>({});

  const fetchData = useCallback(async () => {
    const [chRes, lsRes] = await Promise.all([
      supabase
        .from("chapters")
        .select("*")
        .eq("course_id", courseId)
        .order("chapter_index", { ascending: true }),
      supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("global_index", { ascending: true }),
    ]);
    if (chRes.error) return setError(chRes.error.message);
    if (lsRes.error) return setError(lsRes.error.message);
    setChapters((chRes.data as ChapterRow[]) ?? []);
    setLessons((lsRes.data as LessonRow[]) ?? []);
  }, [courseId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const apiCall = useCallback(
    async (path: string, method: string, body?: unknown) => {
      const token = await getToken();
      const res = await fetch(path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.detail ?? json.error ?? `${method} ${path} failed`);
      }
      return json;
    },
    []
  );

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      setBusy(true);
      try {
        await fn();
        await fetchData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setBusy(false);
      }
    },
    [fetchData]
  );

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await apiCall(`/api/admin/seed-lessons/${courseId}`, "POST");
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const addChapter = () =>
    run(() => apiCall("/api/admin/chapters", "POST", { courseId }));

  const renameChapter = (chapterId: string, title: string) =>
    run(() => apiCall(`/api/admin/chapters/${chapterId}`, "PATCH", { title }));

  const deleteChapter = (chapter: ChapterRow) => {
    const count = lessons.filter(
      (l) => l.chapter_index === chapter.chapter_index
    ).length;
    if (
      !window.confirm(
        `ลบบท "${chapter.title}" ใช่หรือไม่?\nบทเรียน ${count} บท และวิดีโอทั้งหมดในบทนี้จะถูกลบถาวร`
      )
    )
      return;
    void run(() => apiCall(`/api/admin/chapters/${chapter.id}`, "DELETE"));
  };

  const addLesson = (chapterId: string) =>
    run(() => apiCall("/api/admin/lessons", "POST", { chapterId }));

  const patchLesson = (lessonId: string, patch: Partial<LessonRow>) =>
    run(() => apiCall(`/api/admin/lessons/${lessonId}`, "PATCH", patch));

  const deleteLesson = (lesson: LessonRow) => {
    if (
      !window.confirm(
        `ลบบทเรียน "${lesson.title}" ใช่หรือไม่?\nวิดีโอที่อัปโหลดไว้จะถูกลบถาวร`
      )
    )
      return;
    void run(() => apiCall(`/api/admin/lessons/${lesson.id}`, "DELETE"));
  };

  const togglePreview = (lesson: LessonRow) =>
    patchLesson(lesson.id, { is_preview: !lesson.is_preview });

  // ── Video upload ───────────────────────────────────────────────────────
  const startUpload = async (lesson: LessonRow, file: File) => {
    setUploads((u) => ({ ...u, [lesson.id]: { phase: "uploading" } }));
    try {
      const token = await getToken();
      const handle = uploadFileMultipart({
        file,
        lessonId: lesson.id,
        accessToken: token,
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
      await fetchData();
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

  const deleteVideo = (lesson: LessonRow) => {
    if (
      !window.confirm(
        `ลบวิดีโอของบทเรียน "${lesson.title}" ใช่หรือไม่?\nไฟล์จะถูกลบจาก R2 แต่บทเรียนยังอยู่`
      )
    )
      return;
    void run(() =>
      apiCall(`/api/admin/lesson-video/${lesson.id}`, "DELETE")
    );
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

  const isEmpty = chapters !== null && chapters.length === 0;

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-white to-white min-h-[calc(100vh-4rem)]">
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
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 mb-3">
              จัดการบทเรียน
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {course.title}
            </h1>
            <p className="text-slate-600 max-w-2xl">
              เพิ่ม/ลบบทและบทเรียน แก้ชื่อ-คำอธิบาย อัปโหลดวิดีโอ และเลือกคลิปตัวอย่าง —
              เวลาของแต่ละบทจะอัปเดตอัตโนมัติตามวิดีโอที่อัปโหลด
            </p>
          </div>
          {!isEmpty && chapters !== null && (
            <Button
              onClick={addChapter}
              disabled={busy}
              className="bg-brand-700 hover:bg-brand-800 text-white flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              เพิ่มบท
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {chapters === null ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
              <Sparkles className="h-8 w-8 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              ยังไม่มีบทเรียนสำหรับคอร์สนี้
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              สร้างโครงสร้างอัตโนมัติตามจำนวนบทของคอร์ส แล้วค่อยแก้ไขทีหลัง
              หรือจะเริ่มสร้างบทเองตั้งแต่ต้นก็ได้
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleSeed}
                disabled={seeding || busy}
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
                    สร้างอัตโนมัติ ({course.lessons} บทเรียน)
                  </>
                )}
              </Button>
              <Button
                onClick={addChapter}
                disabled={busy}
                variant="outline"
                className="border-brand-200 text-brand-700 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                เริ่มสร้างบทเอง
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {chapters.map((chapter) => {
              const chapterLessons = lessons
                .filter((l) => l.chapter_index === chapter.chapter_index)
                .sort((a, b) => a.lesson_index - b.lesson_index);
              return (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  lessons={chapterLessons}
                  uploads={uploads}
                  busy={busy}
                  onRename={renameChapter}
                  onDelete={deleteChapter}
                  onAddLesson={addLesson}
                  onPatchLesson={patchLesson}
                  onDeleteLesson={deleteLesson}
                  onTogglePreview={togglePreview}
                  onUpload={startUpload}
                  onCancelUpload={cancelUpload}
                  onDeleteVideo={deleteVideo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chapter card ───────────────────────────────────────────────────────────
function ChapterCard({
  chapter,
  lessons,
  uploads,
  busy,
  onRename,
  onDelete,
  onAddLesson,
  onPatchLesson,
  onDeleteLesson,
  onTogglePreview,
  onUpload,
  onCancelUpload,
  onDeleteVideo,
}: {
  chapter: ChapterRow;
  lessons: LessonRow[];
  uploads: Record<string, LessonUploadState>;
  busy: boolean;
  onRename: (id: string, title: string) => void;
  onDelete: (chapter: ChapterRow) => void;
  onAddLesson: (chapterId: string) => void;
  onPatchLesson: (lessonId: string, patch: Partial<LessonRow>) => void;
  onDeleteLesson: (lesson: LessonRow) => void;
  onTogglePreview: (lesson: LessonRow) => void;
  onUpload: (lesson: LessonRow, file: File) => void;
  onCancelUpload: (lessonId: string) => void;
  onDeleteVideo: (lesson: LessonRow) => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  // Reset the editable buffer when the server value changes (React-recommended
  // "adjust state during render" pattern — no effect needed).
  const [serverTitle, setServerTitle] = useState(chapter.title);
  if (chapter.title !== serverTitle) {
    setServerTitle(chapter.title);
    setTitle(chapter.title);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100">
        <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-brand-700">
          บทที่ {chapter.chapter_index + 1}
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t && t !== chapter.title) onRename(chapter.id, t);
            else setTitle(chapter.title);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="flex-1 min-w-0 bg-transparent font-semibold text-slate-900 rounded-md px-2 py-1 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-300 focus:outline-none transition-colors"
          placeholder="ชื่อบท"
        />
        <Button
          onClick={() => onDelete(chapter)}
          disabled={busy}
          variant="outline"
          className="flex-shrink-0 border-red-200 text-red-700 hover:bg-red-50 h-8 px-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y divide-slate-100">
        {lessons.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-slate-400">
            ยังไม่มีบทเรียนในบทนี้
          </div>
        ) : (
          lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              state={uploads[lesson.id]}
              busy={busy}
              onPatch={onPatchLesson}
              onDelete={onDeleteLesson}
              onTogglePreview={onTogglePreview}
              onUpload={onUpload}
              onCancelUpload={onCancelUpload}
              onDeleteVideo={onDeleteVideo}
            />
          ))
        )}
      </div>

      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-white">
        <Button
          onClick={() => onAddLesson(chapter.id)}
          disabled={busy}
          variant="outline"
          className="border-brand-200 text-brand-700 hover:bg-brand-50 h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มบทเรียน
        </Button>
      </div>
    </div>
  );
}

// ── Lesson item ──────────────────────────────────────────────────────────
function LessonItem({
  lesson,
  state,
  busy,
  onPatch,
  onDelete,
  onTogglePreview,
  onUpload,
  onCancelUpload,
  onDeleteVideo,
}: {
  lesson: LessonRow;
  state?: LessonUploadState;
  busy: boolean;
  onPatch: (lessonId: string, patch: Partial<LessonRow>) => void;
  onDelete: (lesson: LessonRow) => void;
  onTogglePreview: (lesson: LessonRow) => void;
  onUpload: (lesson: LessonRow, file: File) => void;
  onCancelUpload: (lessonId: string) => void;
  onDeleteVideo: (lesson: LessonRow) => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [desc, setDesc] = useState(lesson.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  // Sync editable buffers to server values on change (adjust-during-render).
  const [serverTitle, setServerTitle] = useState(lesson.title);
  if (lesson.title !== serverTitle) {
    setServerTitle(lesson.title);
    setTitle(lesson.title);
  }
  const [serverDesc, setServerDesc] = useState(lesson.description ?? "");
  if ((lesson.description ?? "") !== serverDesc) {
    setServerDesc(lesson.description ?? "");
    if (!editingDesc) setDesc(lesson.description ?? "");
  }

  const hasVideo = !!lesson.video_storage_key;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="px-4 sm:px-5 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-sm font-bold flex-shrink-0 mt-0.5">
          {lesson.global_index}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title (inline editable) */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              const t = title.trim();
              if (t && t !== lesson.title) onPatch(lesson.id, { title: t });
              else setTitle(lesson.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-full bg-transparent font-semibold text-slate-900 rounded-md px-2 py-1 -ml-2 hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-brand-300 focus:outline-none transition-colors"
            placeholder="ชื่อบทเรียน"
          />

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 px-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatClock(lesson.duration_seconds)}
              {hasVideo && (
                <span className="text-slate-400">(จากคลิป)</span>
              )}
            </span>
            {hasVideo && lesson.video_size_bytes != null && (
              <span>{bytesPretty(lesson.video_size_bytes)}</span>
            )}
            {hasVideo && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                มีวิดีโอ
              </span>
            )}
            {lesson.is_preview && (
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-0 h-5 px-1.5 text-[10px]">
                <Eye className="h-3 w-3 mr-0.5" />
                คลิปตัวอย่าง
              </Badge>
            )}
          </div>

          {/* Description (inline editable) */}
          <div className="mt-2">
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  autoFocus
                  className="w-full text-sm text-slate-700 rounded-lg border border-brand-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-y"
                  placeholder="คำอธิบายบทเรียน (ไม่บังคับ)"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onPatch(lesson.id, { description: desc });
                      setEditingDesc(false);
                    }}
                    disabled={busy}
                    className="bg-brand-700 hover:bg-brand-800 text-white h-7 px-3 text-xs"
                  >
                    บันทึก
                  </Button>
                  <Button
                    onClick={() => {
                      setDesc(lesson.description ?? "");
                      setEditingDesc(false);
                    }}
                    variant="outline"
                    className="border-slate-200 text-slate-600 h-7 px-3 text-xs"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingDesc(true)}
                className="text-left text-sm text-slate-500 hover:text-brand-700 flex items-start gap-1.5 group"
              >
                <Pencil className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                <span className={lesson.description ? "" : "italic"}>
                  {lesson.description || "เพิ่มคำอธิบาย..."}
                </span>
              </button>
            )}
          </div>

          {/* Upload progress */}
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
                  style={{ width: `${state.progress?.percent ?? 0}%` }}
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
      </div>

      {/* Action bar */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-12">
        {state?.phase === "uploading" ? (
          <Button
            variant="outline"
            onClick={() => onCancelUpload(lesson.id)}
            className="border-red-200 text-red-700 hover:bg-red-50 h-8 px-3 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            ยกเลิก
          </Button>
        ) : (
          <>
            <UploadButton
              lesson={lesson}
              label={hasVideo ? "แทนที่วิดีโอ" : "อัปโหลดวิดีโอ"}
              onPick={onUpload}
              primary={!hasVideo}
            />
            {hasVideo && (
              <>
                <Button
                  onClick={() => onTogglePreview(lesson)}
                  disabled={busy}
                  variant="outline"
                  className={
                    lesson.is_preview
                      ? "border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 h-8 px-3 text-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 h-8 px-3 text-xs"
                  }
                >
                  {lesson.is_preview ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      เลิกเป็นตัวอย่าง
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      ตั้งเป็นคลิปตัวอย่าง
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => onDeleteVideo(lesson)}
                  disabled={busy}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                  title="ลบเฉพาะวิดีโอ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <div className="flex-1" />
            <Button
              onClick={() => onDelete(lesson)}
              disabled={busy}
              variant="outline"
              className="border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-8 px-2 text-xs"
              title="ลบบทเรียนนี้"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              ลบบทเรียน
            </Button>
          </>
        )}
      </div>
    </motion.div>
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
            ? "bg-brand-700 hover:bg-brand-800 text-white h-8 px-3 text-xs"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 h-8 px-3 text-xs"
        }
      >
        <Upload className="h-3.5 w-3.5 mr-1" />
        {label}
      </Button>
    </>
  );
}
