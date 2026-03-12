import { AppError } from "@/common/errors/app-error";
import { prisma } from "@/platform/db/prisma";

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

export async function createSignedUpload(request: SignedUploadRequest) {
  const limit = maxSizes[request.folder];
  if (request.sizeBytes > limit) {
    throw new AppError("MEDIA_SIZE_EXCEEDED", "File exceeds allowed size", 422, {
      maxSize: limit
    });
  }

  const objectKey = `${request.homeId}/${request.folder}/${crypto.randomUUID()}`;

  // Placeholder URL generation. Replace with AWS SDK S3 presigner against R2.
  const uploadUrl = `https://r2-upload.local/${objectKey}?signature=placeholder`;

  const attachment = await prisma.attachment.create({
    data: {
      homeId: request.homeId,
      kind: request.folder,
      bucket: process.env.R2_BUCKET || "placeholder",
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
    expiresInSeconds: 300,
    attachmentId: attachment.id,
    objectKey
  };
}
