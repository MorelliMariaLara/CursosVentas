import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userOwnsCourse } from "@/lib/enrollment";

type Ctx = { params: Promise<{ lessonId: string }> };

const schema = z.object({
  watchedSec: z.number().int().min(0),
  completed: z.boolean(),
});

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { lessonId } = await ctx.params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  const owns = await userOwnsCourse(session.user.id, lesson.module.courseId);
  if (!owns) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      watchedSec: parsed.data.watchedSec,
      completed: parsed.data.completed,
      completedAt: parsed.data.completed ? new Date() : null,
    },
    create: {
      userId: session.user.id,
      lessonId,
      watchedSec: parsed.data.watchedSec,
      completed: parsed.data.completed,
      completedAt: parsed.data.completed ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
