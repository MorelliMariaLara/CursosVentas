import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ moduleId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { moduleId } = await ctx.params;
  const body = await request.json();
  const parsed = z
    .object({
      title: z.string().min(2),
      description: z.string().optional(),
      durationSec: z.number().int().min(0).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      durationSec: parsed.data.durationSec || 0,
      sortOrder: count + 1,
    },
  });

  return NextResponse.json({ id: lesson.id });
}
