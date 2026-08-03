import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleManager } from "@/components/admin/module-manager";
import { ExamManager } from "@/components/admin/exam-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditCoursePage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
      exam: {
        include: { questions: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="container space-y-10 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-[var(--muted)]">
            ← Volver
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
            {course.title}
          </h1>
          <p className="text-sm text-[var(--muted)]">/{course.slug}</p>
        </div>
        <Link href={`/cursos/${course.slug}`} className="btn btn-ghost !py-2 text-sm">
          Ver público
        </Link>
      </div>

      <CourseForm
        initial={{
          id: course.id,
          title: course.title,
          shortDescription: course.shortDescription,
          description: course.description,
          price: course.price,
          currency: course.currency,
          published: course.published,
          passingScore: course.passingScore,
        }}
      />

      <ModuleManager
        courseId={course.id}
        modules={course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            durationSec: l.durationSec,
            hasVideo: Boolean(l.videoPath),
          })),
        }))}
      />

      <ExamManager
        courseId={course.id}
        exam={
          course.exam
            ? {
                id: course.exam.id,
                title: course.exam.title,
                description: course.exam.description,
                questions: course.exam.questions.map((q) => ({
                  id: q.id,
                  prompt: q.prompt,
                  options: JSON.parse(q.optionsJson) as string[],
                  correctOption: q.correctOption,
                })),
              }
            : null
        }
      />
    </div>
  );
}
