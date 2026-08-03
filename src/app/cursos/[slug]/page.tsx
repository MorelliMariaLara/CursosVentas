import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDuration, formatPrice } from "@/lib/utils";
import { BuyCourseButton } from "@/components/buy-course-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  return { title: course?.title || "Curso" };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: { lessons: { orderBy: { sortOrder: "asc" } } },
      },
      exam: true,
    },
  });
  if (!course || !course.published) notFound();

  const user = await getSessionUser();
  let owned = false;
  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    owned = enrollment?.status === "ACTIVE";
  }

  const lessons = course.modules.flatMap((m) => m.lessons);
  const totalDuration = lessons.reduce((a, l) => a + l.durationSec, 0);

  return (
    <div className="container grid gap-10 py-14 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-8">
        <div>
          <p className="eyebrow">Curso</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-[var(--brand)]">
            {course.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            {course.description}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
            Contenido
          </h2>
          {course.modules.map((mod) => (
            <div key={mod.id} className="surface p-5">
              <h3 className="font-semibold text-[var(--brand)]">{mod.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex justify-between gap-4">
                    <span>{lesson.title}</span>
                    <span className="text-[var(--muted)]">
                      {formatDuration(lesson.durationSec)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {course.exam && (
            <div className="surface border-[var(--accent)]/40 p-5">
              <h3 className="font-semibold text-[var(--brand)]">
                Evaluación final + certificado
              </h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Al completar las clases, rendí el examen (aprobación{" "}
                {course.passingScore}%). Si aprobás, emitimos tu certificado
                digital verificable.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="h-fit space-y-5 surface p-6 lg:sticky lg:top-24">
        <div className="hero-glow h-36 rounded-2xl" />
        <p className="text-3xl font-semibold text-[var(--brand)]">
          {formatPrice(course.price, course.currency)}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {lessons.length} clases · {formatDuration(totalDuration)} · Acceso
          inmediato tras el pago
        </p>

        {owned ? (
          <Link href={`/aprender/${course.slug}`} className="btn btn-primary w-full">
            Ir al curso
          </Link>
        ) : user ? (
          <BuyCourseButton courseId={course.id} />
        ) : (
          <Link
            href={`/login?callbackUrl=/cursos/${course.slug}`}
            className="btn btn-primary w-full"
          >
            Ingresá para comprar
          </Link>
        )}

        <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
          <li>✓ Streaming protegido (sin descarga)</li>
          <li>✓ Progreso guardado</li>
          <li>✓ Certificado al aprobar</li>
          <li>✓ Pago con Mercado Pago</li>
        </ul>
      </aside>
    </div>
  );
}
