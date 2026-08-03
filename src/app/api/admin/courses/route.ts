import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

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

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  let slug = slugify(parsed.data.title);
  const exists = await prisma.course.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      slug,
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
