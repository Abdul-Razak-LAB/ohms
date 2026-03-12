import { AppError } from "@/common/errors/app-error";
import { prisma } from "@/platform/db/prisma";
import { env } from "@/platform/config/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type SignedUploadRequest = {
  homeId: string;
  folder: "documents" | "media" | "reports";
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  deviceInfo?: Record<string, unknown>;
  gps?: Record<string, unknown>;
};

const maxSizes: Record<string, number> = {
  documents: 10 * 1024 * 1024,
  media: 50 * 1024 * 1024,
  reports: 20 * 1024 * 1024
};

const allowedByFolder: Record<SignedUploadRequest["folder"], string[]> = {
  documents: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  media: ["audio/mpeg", "audio/mp4", "video/mp4", "image/jpeg", "image/png", "image/webp"],
  reports: ["application/pdf", "text/csv", "application/json"]
};

function getR2Client() {
  const endpoint = env.R2_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
  if (!endpoint || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new AppError("MEDIA_STORAGE_NOT_CONFIGURED", "R2 storage is not fully configured", 503);
  }

  return new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    }
  });
}

export async function createSignedUpload(request: SignedUploadRequest) {
  const limit = maxSizes[request.folder];
  if (request.sizeBytes > limit) {
    throw new AppError("MEDIA_SIZE_EXCEEDED", "File exceeds allowed size", 422, {
      maxSize: limit
    });
  }

  if (!allowedByFolder[request.folder].includes(request.contentType)) {
    throw new AppError("MEDIA_CONTENT_TYPE_NOT_ALLOWED", "Content type is not allowed for this folder", 422, {
      folder: request.folder,
      allowed: allowedByFolder[request.folder]
    });
  }

  const objectKey = `${request.homeId}/${request.folder}/${crypto.randomUUID()}`;
  const client = getR2Client();
  const bucket = env.R2_BUCKET;
  if (!bucket) {
    throw new AppError("MEDIA_STORAGE_NOT_CONFIGURED", "R2 bucket is not configured", 503);
  }
  const expiresInSeconds = 300;
  const uploadCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: request.contentType,
    ChecksumSHA256: request.checksumSha256
  });
  const uploadUrl = await getSignedUrl(client, uploadCommand, { expiresIn: expiresInSeconds });

  const attachment = await prisma.attachment.create({
    data: {
      homeId: request.homeId,
      kind: request.folder,
      bucket,
      objectKey,
      contentType: request.contentType,
      sizeBytes: request.sizeBytes,
      checksumSha256: request.checksumSha256,
      deviceInfo: (request.deviceInfo || {}) as never,
      gps: (request.gps || {}) as never,
      metadata: {} as never
    }
  });

  return {
    uploadUrl,
    expiresInSeconds,
    attachmentId: attachment.id,
    objectKey
  };
}
