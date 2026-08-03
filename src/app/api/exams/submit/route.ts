import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userOwnsCourse, getCourseProgress } from "@/lib/enrollment";
import {
  generateCertificateCode,
  generateCertificatePdf,
} from "@/lib/utils";

const schema = z.object({
  examId: z.string(),
  answers: z.record(z.string(), z.number().int().min(0)),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: parsed.data.examId },
    include: {
      questions: true,
      course: true,
    },
  });
  if (!exam) {
    return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
  }

  const owns = await userOwnsCourse(session.user.id, exam.courseId);
  if (!owns) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const progress = await getCourseProgress(session.user.id, exam.courseId);
  if (!progress?.allCompleted) {
    return NextResponse.json(
      { error: "Debés completar todas las clases primero" },
      { status: 400 },
    );
  }

  let correct = 0;
  for (const q of exam.questions) {
    if (parsed.data.answers[q.id] === q.correctOption) correct += 1;
  }
  const score =
    exam.questions.length === 0
      ? 0
      : Math.round((correct / exam.questions.length) * 100);
  const passed = score >= exam.course.passingScore;

  await prisma.examAttempt.create({
    data: {
      userId: session.user.id,
      examId: exam.id,
      score,
      passed,
      answersJson: JSON.stringify(parsed.data.answers),
    },
  });

  if (!passed) {
    return NextResponse.json({ score, passed });
  }

  const existing = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: exam.courseId,
      },
    },
  });
  if (existing) {
    return NextResponse.json({
      score,
      passed,
      certificateCode: existing.code,
    });
  }

  const code = generateCertificateCode();
  const issuedAt = new Date();
  const pdfPath = await generateCertificatePdf({
    code,
    studentName: session.user.name,
    courseTitle: exam.course.title,
    score,
    issuedAt,
    appName: process.env.APP_NAME || "Academia Certifica",
  });

  const cert = await prisma.certificate.create({
    data: {
      code,
      userId: session.user.id,
      courseId: exam.courseId,
      issuedAt,
      pdfPath,
      studentName: session.user.name,
      courseTitle: exam.course.title,
      score,
    },
  });

  return NextResponse.json({
    score,
    passed,
    certificateCode: cert.code,
  });
}
