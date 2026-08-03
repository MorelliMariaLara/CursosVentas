import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userOwnsCourse } from "@/lib/enrollment";
import { signVideoToken } from "@/lib/video-token";

type Ctx = { params: Promise<{ lessonId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { lessonId } = await ctx.params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson || !lesson.videoPath) {
    return NextResponse.json({ error: "Video no disponible" }, { status: 404 });
  }

  const owns = await userOwnsCourse(session.user.id, lesson.module.courseId);
  if (!owns && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const token = await signVideoToken({
    lessonId: lesson.id,
    userId: session.user.id,
  });

  return NextResponse.json({
    streamUrl: `/api/stream/${lesson.id}?token=${encodeURIComponent(token)}`,
    expiresIn: 900,
  });
}
