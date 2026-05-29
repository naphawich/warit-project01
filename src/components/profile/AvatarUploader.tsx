"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/auth-context";

type Props = {
  displayName: string;
  email: string;
};

const MAX_DIMENSION = 512;
const TARGET_TYPE = "image/webp";
const TARGET_QUALITY = 0.85;

// Client-side resize + recompress so we don't waste storage on phone-camera
// originals. Returns a Blob ready to upload.
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encode failed"))),
      TARGET_TYPE,
      TARGET_QUALITY
    );
  });
}

export function AvatarUploader({ displayName, email }: Props) {
  const { user, profile, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cache-bust so the same path shows the new image after re-upload
  const avatarUrl =
    previewUrl ?? (profile?.avatar_url ? `${profile.avatar_url}` : null);
  const initials = getInitials(displayName);

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setSaved(false);

    if (!user) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("ไฟล์ต้องเป็นรูปภาพ");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (จำกัด 8 MB)");
      return;
    }

    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const path = `${user.id}/avatar.webp`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          upsert: true,
          contentType: TARGET_TYPE,
          cacheControl: "3600",
        });
      if (upErr) throw upErr;

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      // Append a version query so caches refresh
      const versioned = `${publicUrl.publicUrl}?v=${Date.now()}`;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({ avatar_url: versioned })
        .eq("id", user.id);
      if (profErr) throw profErr;

      setPreviewUrl(versioned);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setError(null);
    setUploading(true);
    try {
      const path = `${user.id}/avatar.webp`;
      await supabase.storage.from("avatars").remove([path]);
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      setPreviewUrl(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-2xl sm:text-3xl font-bold shadow-lg overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-brand-100/80 mb-1">
          สมาชิก Warit Academy
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">{displayName}</h1>
        <div className="text-sm text-brand-100/90 truncate">{email}</div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button
            type="button"
            onClick={pickFile}
            disabled={uploading}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-md"
          >
            <Camera className="h-4 w-4 mr-1.5" />
            {avatarUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-red-500/30 hover:text-white hover:border-red-400/40 backdrop-blur-md"
            >
              <X className="h-4 w-4 mr-1.5" />
              ลบรูป
            </Button>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs text-emerald-100">
              <CheckCircle2 className="h-3 w-3" />
              บันทึกแล้ว
            </span>
          )}
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
