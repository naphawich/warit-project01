// Client-side helper that drives the S3-multipart upload via the
// /api/admin/upload endpoints.

export type UploadProgress = {
  bytesUploaded: number;
  totalBytes: number;
  percent: number;
};

export type UploadHandle = {
  promise: Promise<void>;
  cancel: () => void;
};

type Options = {
  file: File;
  // Provide exactly one target: a lesson row or a course-level preview clip.
  lessonId?: string;
  previewCourseId?: number;
  accessToken: string;
  onProgress?: (p: UploadProgress) => void;
  // How many parts to PUT concurrently. R2 handles plenty in parallel;
  // 4 is a safe middle ground for typical home internet.
  concurrency?: number;
};

// Read the real playback duration (seconds) from a video File using a hidden
// <video> element. Resolves null if the browser can't decode the metadata so
// the upload still proceeds — duration just stays unknown.
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      resolve(Number.isFinite(d) && d > 0 ? d : null);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

async function putPart(
  url: string,
  body: Blob,
  signal: AbortSignal,
  onProgressDelta: (delta: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    let last = 0;
    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      const delta = e.loaded - last;
      last = e.loaded;
      onProgressDelta(delta);
    });
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Part PUT failed: ${xhr.status} ${xhr.statusText}`));
        return;
      }
      const etag = xhr.getResponseHeader("ETag");
      if (!etag) {
        reject(new Error("Part PUT missing ETag"));
        return;
      }
      // ETag has surrounding quotes; CompleteMultipart accepts either, but
      // keep them for safety.
      resolve(etag.replace(/^"|"$/g, ""));
    };
    xhr.onerror = () => reject(new Error("Network error during part upload"));
    xhr.onabort = () => reject(new Error("aborted"));
    signal.addEventListener(
      "abort",
      () => {
        // Re-balance progress so the bar doesn't lie after cancel
        onProgressDelta(-last);
        xhr.abort();
      },
      { once: true }
    );
    xhr.send(body);
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 800,
  signal?: AbortSignal
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    if (signal?.aborted) throw new Error("aborted");
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (e instanceof Error && e.message === "aborted") throw e;
      // exponential backoff with light jitter
      const delay = baseDelayMs * Math.pow(2, i) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("upload failed");
}

export function uploadFileMultipart(opts: Options): UploadHandle {
  const concurrency = Math.max(1, Math.min(8, opts.concurrency ?? 4));
  const controller = new AbortController();

  const promise = (async () => {
    // 0. Capture the real clip duration before uploading so the lesson shows
    //    the exact runtime of the video that was used.
    const durationSeconds = await readVideoDuration(opts.file);
    const isPreview = opts.previewCourseId != null;
    const targetFields = isPreview
      ? { kind: "preview" as const, previewCourseId: opts.previewCourseId }
      : { kind: "lesson" as const, lessonId: opts.lessonId };

    // 1. INIT — server creates the multipart upload + pre-signs every part
    const initRes = await fetch("/api/admin/upload/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.accessToken}`,
      },
      body: JSON.stringify({
        ...targetFields,
        filename: opts.file.name,
        contentType: opts.file.type || "video/mp4",
        totalSize: opts.file.size,
      }),
    });
    if (!initRes.ok) {
      const detail = await initRes.text().catch(() => "");
      throw new Error(`Init failed: ${initRes.status} ${detail}`);
    }
    const {
      key,
      uploadId,
      partSize,
      partCount,
      urls,
    }: {
      key: string;
      uploadId: string;
      partSize: number;
      partCount: number;
      urls: string[];
    } = await initRes.json();

    // 2. UPLOAD PARTS — bounded parallelism
    const parts: { partNumber: number; etag: string }[] = new Array(partCount);
    let bytesUploaded = 0;
    const reportProgress = (delta: number) => {
      bytesUploaded = Math.max(0, bytesUploaded + delta);
      opts.onProgress?.({
        bytesUploaded,
        totalBytes: opts.file.size,
        percent: Math.min(100, (bytesUploaded / opts.file.size) * 100),
      });
    };

    let cursor = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (true) {
        if (controller.signal.aborted) throw new Error("aborted");
        const idx = cursor++;
        if (idx >= partCount) return;
        const start = idx * partSize;
        const end = Math.min(start + partSize, opts.file.size);
        const blob = opts.file.slice(start, end);
        const etag = await withRetry(
          () => putPart(urls[idx], blob, controller.signal, reportProgress),
          3,
          800,
          controller.signal
        );
        parts[idx] = { partNumber: idx + 1, etag };
      }
    });

    try {
      await Promise.all(workers);
    } catch (e) {
      // Best-effort abort so R2 doesn't keep paying for orphaned parts
      void fetch("/api/admin/upload/abort", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.accessToken}`,
        },
        body: JSON.stringify({ key, uploadId }),
      }).catch(() => {});
      throw e;
    }

    // 3. COMPLETE
    const completeRes = await fetch("/api/admin/upload/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.accessToken}`,
      },
      body: JSON.stringify({
        ...targetFields,
        key,
        uploadId,
        parts,
        durationSeconds,
      }),
    });
    if (!completeRes.ok) {
      const detail = await completeRes.text().catch(() => "");
      throw new Error(`Complete failed: ${completeRes.status} ${detail}`);
    }
  })();

  return {
    promise,
    cancel: () => controller.abort(),
  };
}
