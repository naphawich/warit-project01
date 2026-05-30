// Server-only Cloudflare R2 client. R2 speaks the S3 protocol so we use the
// AWS SDK v3. Do NOT import from client components — secret access key
// must never reach the browser.
import {
  S3Client,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error(
    "Missing R2 env vars: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET"
  );
}

// R2 uses a single endpoint per account; bucket is supplied per request.
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

export const R2_BUCKET = bucket;

// ── Multipart upload helpers ──────────────────────────────────────────────

export async function startMultipartUpload(
  key: string,
  contentType: string
): Promise<string> {
  const resp = await r2.send(
    new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      // 24 h client cache — same signed URL within session reuses bytes;
      // Cloudflare CDN can also honor it on signed-URL hits.
      CacheControl: "public, max-age=86400",
    })
  );
  if (!resp.UploadId) throw new Error("R2 returned no UploadId");
  return resp.UploadId;
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );
}

// Pre-signed PUT URLs so the browser can upload chunks directly to R2.
// Vercel never sees the bytes.
export async function presignPartUrls(
  key: string,
  uploadId: string,
  partCount: number,
  expiresInSeconds = 60 * 60
): Promise<string[]> {
  const urls = await Promise.all(
    Array.from({ length: partCount }, (_, i) =>
      getSignedUrl(
        r2,
        new UploadPartCommand({
          Bucket: R2_BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: i + 1,
        }),
        { expiresIn: expiresInSeconds }
      )
    )
  );
  return urls;
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<void> {
  await r2.send(
    new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0)),
      },
    })
  );
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  try {
    await r2.send(
      new AbortMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: key,
        UploadId: uploadId,
      })
    );
  } catch (e) {
    console.warn("[r2] abort multipart failed", e);
  }
}

// ── Playback ──────────────────────────────────────────────────────────────

// Time-limited GET URL so only signed-in owners can fetch the video.
export async function presignDownloadUrl(
  key: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

export async function headObject(
  key: string
): Promise<{ size: number; contentType?: string } | null> {
  try {
    const resp = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );
    return {
      size: resp.ContentLength ?? 0,
      contentType: resp.ContentType,
    };
  } catch {
    return null;
  }
}
