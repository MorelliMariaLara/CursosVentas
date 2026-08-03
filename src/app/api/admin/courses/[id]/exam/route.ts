import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = await ctx.params;
  const body = await request.json();
  const parsed = z
    .object({
      title: z.string().min(2),
      description: z.string().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const exam = await prisma.exam.upsert({
    where: { courseId },
    update: {
      title: parsed.data.title,
      description: parsed.data.description || null,
    },
    create: {
      courseId,
      title: parsed.data.title,
      description: parsed.data.description || null,
    },
  });

  return NextResponse.json({ id: exam.id });
}
