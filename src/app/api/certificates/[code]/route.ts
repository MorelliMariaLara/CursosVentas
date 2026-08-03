import { createReadStream, existsSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUploadRoot } from "@/lib/utils";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const cert = await prisma.certificate.findUnique({ where: { code } });
  if (!cert?.pdfPath) {
    return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
  }

  const filePath = path.join(getUploadRoot(), cert.pdfPath);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.code}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
