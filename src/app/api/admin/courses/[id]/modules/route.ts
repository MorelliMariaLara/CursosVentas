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
  const parsed = z.object({ title: z.string().min(2) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Título inválido" }, { status: 400 });
  }

  const count = await prisma.module.count({ where: { courseId } });
  const mod = await prisma.module.create({
    data: {
      courseId,
      title: parsed.data.title,
      sortOrder: count + 1,
    },
  });

  return NextResponse.json({ id: mod.id });
}
