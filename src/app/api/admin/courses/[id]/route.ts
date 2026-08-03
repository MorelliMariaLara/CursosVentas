import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const schema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  price: z.number().min(0),
  currency: z.string().default("ARS"),
  published: z.boolean().optional(),
  passingScore: z.number().int().min(1).max(100).optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      title: parsed.data.title,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      price: parsed.data.price,
      currency: parsed.data.currency,
      published: parsed.data.published ?? false,
      passingScore: parsed.data.passingScore ?? 70,
    },
  });

  return NextResponse.json({ id: course.id });
}
