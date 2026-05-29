"use client";

import { useState } from "react";
import { Play, X, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { PreviewVideo } from "@/lib/data";

type Props = {
  color: string;
  title: string;
  preview?: PreviewVideo;
};

export function VideoPreview({ color, title, preview }: Props) {
  const [open, setOpen] = useState(false);
  const [thumbFallback, setThumbFallback] = useState(false);

  const youtubeThumb =
    preview?.type === "youtube"
      ? thumbFallback
        ? `https://img.youtube.com/vi/${preview.id}/hqdefault.jpg`
        : `https://img.youtube.com/vi/${preview.id}/maxresdefault.jpg`
      : null;

  const durationLabel = preview?.durationLabel ?? "2:14 นาที";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full aspect-video rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 border border-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        aria-label="ดูตัวอย่างคอร์ส"
      >
        {youtubeThumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb}
              alt={`${title} preview`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setThumbFallback(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 group-hover:from-black/80 transition-colors" />
          </>
        ) : (
          <>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${color}`}
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <BookOpen className="h-28 w-28 text-white" strokeWidth={1.2} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 group-hover:from-black/70 transition-colors" />
          </>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-white/60 animate-ping" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <Play
                className="h-8 w-8 text-brand-700 ml-1"
                fill="currentColor"
              />
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-medium text-white">
            <Play className="h-3 w-3" fill="currentColor" />
            ตัวอย่างคอร์ส • {durationLabel}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>

              {preview?.type === "youtube" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${preview.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                    <Play
                      className="h-20 w-20 opacity-50"
                      fill="currentColor"
                    />
                    <div className="text-center">
                      <div className="font-semibold mb-1">{title}</div>
                      <div className="text-sm text-white/70">
                        [ พื้นที่สำหรับวิดีโอตัวอย่าง ]
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
