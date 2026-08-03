import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVideoToken } from "@/lib/video-token";
import { getUploadRoot } from "@/lib/utils";
import { userOwnsCourse } from "@/lib/enrollment";

type Ctx = { params: Promise<{ lessonId: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: Ctx) {
  const { lessonId } = await ctx.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyVideoToken(token);
  } catch {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }

  if (payload.lessonId !== lessonId) {
    return NextResponse.json({ error: "Token no corresponde" }, { status: 403 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson?.videoPath) {
    return NextResponse.json({ error: "Video no encontrado" }, { status: 404 });
  }

  const owns = await userOwnsCourse(payload.userId, lesson.module.courseId);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!owns && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const filePath = path.join(getUploadRoot(), lesson.videoPath);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo ausente" }, { status: 404 });
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");
  const contentType = lesson.videoMime || "video/mp4";

  const commonHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    // Desalienta descarga / indexación
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (Number.isNaN(start) || start >= fileSize || end >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }
    const chunkSize = end - start + 1;
    const nodeStream = createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": String(chunkSize),
      },
    });
  }

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Length": String(fileSize),
    },
  });
}
