import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ examId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { examId } = await ctx.params;
  const body = await request.json();
  const parsed = z
    .object({
      prompt: z.string().min(5),
      options: z.array(z.string().min(1)).length(4),
      correctOption: z.number().int().min(0).max(3),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const count = await prisma.examQuestion.count({ where: { examId } });
  const question = await prisma.examQuestion.create({
    data: {
      examId,
      prompt: parsed.data.prompt,
      optionsJson: JSON.stringify(parsed.data.options),
      correctOption: parsed.data.correctOption,
      sortOrder: count + 1,
    },
  });

  return NextResponse.json({ id: question.id });
}
