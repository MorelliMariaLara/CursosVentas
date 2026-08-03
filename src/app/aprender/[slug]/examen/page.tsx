import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { userOwnsCourse, getCourseProgress } from "@/lib/enrollment";
import { ExamForm } from "@/components/exam-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function ExamPage({ params }: Props) {
  const session = await requireSession();
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      exam: {
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!course?.exam) notFound();

  const owns = await userOwnsCourse(session.user.id, course.id);
  if (!owns) redirect(`/cursos/${course.slug}`);

  const progress = await getCourseProgress(session.user.id, course.id);
  if (!progress?.allCompleted) {
    redirect(`/aprender/${course.slug}`);
  }

  const existingCert = await prisma.certificate.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });
  if (existingCert) {
    redirect(`/mis-cursos`);
  }

  const questions = course.exam.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: JSON.parse(q.optionsJson) as string[],
  }));

  return (
    <div className="container max-w-3xl py-14">
      <p className="eyebrow">Evaluación</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {course.exam.title}
      </h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        {course.exam.description ||
          `Necesitás ${course.passingScore}% para aprobar y obtener el certificado.`}
      </p>
      <ExamForm examId={course.exam.id} questions={questions} courseSlug={course.slug} />
    </div>
  );
}
