import { createReadStream } from "fs";
import { access, stat } from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";
import { Readable } from "stream";
import { fail, handleError } from "@/lib/api-response";
import { resolveUploadAbsolutePath } from "@/lib/storage";

type RouteContext = { params: Promise<{ path: string[] }> };

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { path: parts } = await context.params;
    if (!parts?.length) {
      return fail("File not found", 404);
    }

    const absolutePath = resolveUploadAbsolutePath(parts);

    try {
      await access(absolutePath);
    } catch {
      return fail("File not found", 404);
    }

    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) {
      return fail("File not found", 404);
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const nodeStream = createReadStream(absolutePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
