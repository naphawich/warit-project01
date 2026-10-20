"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

// Speed is picked from the player's own menu; we only remember the choice.
const RATE_KEY = "warit-video-rate";
// How often (ms) a playing video persists its position.
const SAVE_EVERY_MS = 10_000;

type Props = {
  src: string;
  // Unique per user + lesson; namespaces the local position cache.
  storageKey: string;
  // Last position synced from the server (cross-device), if any.
  serverPosition?: number | null;
  // Called with the current position to persist it server-side.
  onSavePosition?: (seconds: number) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function readNumber(key: string): number | null {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function LessonVideo({ src, storageKey, serverPosition, onSavePosition }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaveRef = useRef(0);
  const posKey = `warit-video-pos-${storageKey}`;
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  const save = (seconds: number) => {
    try {
      localStorage.setItem(posKey, String(Math.floor(seconds)));
    } catch {
      // storage unavailable — server copy still works
    }
    onSavePosition?.(Math.floor(seconds));
  };

  // Resume from the furthest known point. Also runs after the signed URL is
  // refreshed (new src), so a long session no longer jumps back to 0:00.
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const savedRate = readNumber(RATE_KEY);
    if (savedRate && savedRate <= 4) video.playbackRate = savedRate;
    const pos = Math.max(readNumber(posKey) ?? 0, serverPosition ?? 0);
    // Skip tiny offsets and the last few seconds (treat as finished).
    if (pos > 5 && pos < video.duration - 10) {
      video.currentTime = pos;
      setResumedAt(pos);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.paused) return;
    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_EVERY_MS) return;
    lastSaveRef.current = now;
    save(video.currentTime);
  };

  const rememberRate = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      localStorage.setItem(RATE_KEY, String(video.playbackRate));
    } catch {
      // ignore
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    save(0);
    setResumedAt(null);
    void video.play();
  };

  return (
    <div>
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/15">
        <video
          ref={videoRef}
          src={src}
          controls
          controlsList="nodownload"
          playsInline
          // Only fetch the moov/header, not the body, until play.
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onRateChange={rememberRate}
          onPause={() => videoRef.current && save(videoRef.current.currentTime)}
          // Finished — next visit starts from the beginning.
          onEnded={() => save(0)}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {resumedAt !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <span>เล่นต่อจาก {formatTime(resumedAt)}</span>
          <button
            type="button"
            onClick={restart}
            className="inline-flex h-11 items-center gap-1 rounded-lg px-2 text-brand-700 hover:bg-brand-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            เริ่มใหม่
          </button>
        </div>
      )}
    </div>
  );
}
