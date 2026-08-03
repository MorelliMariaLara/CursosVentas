import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCheckoutPreference,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";

const schema = z.object({
  courseId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Curso inválido" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
  });
  if (!course || !course.published) {
    return NextResponse.json({ error: "Curso no disponible" }, { status: 404 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });
  if (existing?.status === "ACTIVE") {
    return NextResponse.json(
      { error: "Ya tenés acceso a este curso" },
      { status: 400 },
    );
  }

  // Modo demo: si no hay MP configurado, activar inscripción directa
  if (!isMercadoPagoConfigured()) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      update: { status: "ACTIVE", purchasedAt: new Date() },
      create: {
        userId: session.user.id,
        courseId: course.id,
        status: "ACTIVE",
        purchasedAt: new Date(),
      },
    });
    return NextResponse.json({
      demo: true,
      initPoint: `/aprender/${course.slug}?demo=1`,
      message:
        "Mercado Pago no está configurado. Se activó el acceso en modo demo.",
    });
  }

  const externalReference = `course_${course.id}_user_${session.user.id}_${randomUUID()}`;

  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
    update: { status: "PENDING" },
    create: {
      userId: session.user.id,
      courseId: course.id,
      status: "PENDING",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      enrollmentId: enrollment.id,
      amount: course.price,
      currency: course.currency,
      status: "PENDING",
      mpExternalReference: externalReference,
    },
  });

  try {
    const preference = await createCheckoutPreference({
      courseId: course.id,
      courseTitle: course.title,
      price: course.price,
      currency: course.currency,
      userId: session.user.id,
      userEmail: session.user.email,
      externalReference,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id },
    });

    return NextResponse.json({
      initPoint: preference.init_point || preference.sandbox_init_point,
      preferenceId: preference.id,
    });
  } catch (err) {
    console.error("MP preference error", err);
    return NextResponse.json(
      {
        error:
          "No se pudo crear el pago en Mercado Pago. Verificá MP_ACCESS_TOKEN.",
      },
      { status: 502 },
    );
  }
}
