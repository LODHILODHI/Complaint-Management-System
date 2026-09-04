import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Local filesystem storage adapter.
 * Swap this module later for S3/cloud without changing route handlers.
 */

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type StoredFile = {
  fileUrl: string;
  fileType: string;
  originalName: string;
};

function getUploadRoot() {
  return path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");
}

function extensionFor(mime: string, originalName: string) {
  const fromName = path.extname(originalName);
  if (fromName) return fromName.toLowerCase();
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

export function validateUploadFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}". Only images and PDFs are allowed.`,
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" exceeds the 5MB size limit.`);
  }
}

export async function saveComplaintAttachment(
  complaintId: string,
  file: File,
): Promise<StoredFile> {
  validateUploadFile(file);

  const relativeDir = path.join("complaints", complaintId);
  const absoluteDir = path.join(getUploadRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const ext = extensionFor(file.type, file.name);
  const filename = `${randomUUID()}${ext}`;
  const absolutePath = path.join(absoluteDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const fileUrl = `/api/uploads/complaints/${complaintId}/${filename}`;

  return {
    fileUrl,
    fileType: file.type,
    originalName: file.name,
  };
}

export function resolveUploadAbsolutePath(relativeParts: string[]) {
  const root = getUploadRoot();
  const absolute = path.join(root, ...relativeParts);
  const normalizedRoot = path.normalize(root + path.sep);
  const normalizedPath = path.normalize(absolute);

  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error("Invalid path");
  }

  return normalizedPath;
}

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
