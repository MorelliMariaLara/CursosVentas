import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { writeFile } from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUploadDirs, getUploadRoot } from "@/lib/utils";

type Ctx = { params: Promise<{ lessonId: string }> };

export const runtime = "nodejs";

const ALLOWED = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { lessonId } = await ctx.params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("video");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usá MP4, WebM o MOV." },
      { status: 400 },
    );
  }

  // Límite práctico ~500MB (ajustable según hosting)
  if (file.size > 500 * 1024 * 1024) {
    return NextResponse.json(
      { error: "El video supera el límite de 500MB" },
      { status: 400 },
    );
  }

  await ensureUploadDirs();
  const ext =
    file.type === "video/webm"
      ? "webm"
      : file.type === "video/quicktime"
        ? "mov"
        : "mp4";
  const filename = `${lessonId}-${randomUUID()}.${ext}`;
  const relative = path.join("videos", filename);
  const absolute = path.join(getUploadRoot(), relative);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      videoPath: relative.replace(/\\/g, "/"),
      videoMime: file.type,
    },
  });

  return NextResponse.json({ ok: true, path: relative });
}
