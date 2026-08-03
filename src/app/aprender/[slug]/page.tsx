import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { userOwnsCourse, getCourseProgress } from "@/lib/enrollment";
import { LessonPlayer } from "@/components/lesson-player";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string; demo?: string }>;
};

export default async function LearnPage({ params, searchParams }: Props) {
  const session = await requireSession();
  const { slug } = await params;
  const sp = await searchParams;

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
  if (!course) notFound();

  const owns = await userOwnsCourse(session.user.id, course.id);
  if (!owns) redirect(`/cursos/${course.slug}`);

  const lessons = course.modules.flatMap((m) => m.lessons);
  const activeLesson =
    lessons.find((l) => l.id === sp.lesson) || lessons[0] || null;

  const progressRows = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: lessons.map((l) => l.id) },
    },
  });
  const completedIds = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.lessonId),
  );

  const progress = await getCourseProgress(session.user.id, course.id);
  const certificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
      <aside className="surface h-fit p-5 lg:sticky lg:top-24">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-deep)]">
          Contenido
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--brand)]">
          {course.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Progreso {progress?.percent ?? 0}%
        </p>
        <div className="mt-5 space-y-4">
          {course.modules.map((mod) => (
            <div key={mod.id}>
              <p className="mb-2 text-sm font-semibold text-[var(--brand)]">
                {mod.title}
              </p>
              <ul className="space-y-1">
                {mod.lessons.map((lesson) => {
                  const done = completedIds.has(lesson.id);
                  const active = activeLesson?.id === lesson.id;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/aprender/${course.slug}?lesson=${lesson.id}`}
                        className={`block rounded-lg px-3 py-2 text-sm ${
                          active
                            ? "bg-[var(--brand)] text-white"
                            : "hover:bg-[var(--bg-deep)]"
                        }`}
                      >
                        {done ? "✓ " : ""}
                        {lesson.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {course.exam && (
          <div className="mt-6 border-t border-[var(--line)] pt-4">
            {progress?.allCompleted ? (
              certificate ? (
                <Link
                  href={`/api/certificates/${certificate.code}`}
                  className="btn btn-accent w-full !py-2 text-sm"
                >
                  Ver certificado
                </Link>
              ) : (
                <Link
                  href={`/aprender/${course.slug}/examen`}
                  className="btn btn-primary w-full !py-2 text-sm"
                >
                  Rendir evaluación
                </Link>
              )
            ) : (
              <p className="text-xs text-[var(--muted)]">
                Completá todas las clases para habilitar el examen.
              </p>
            )}
          </div>
        )}
      </aside>

      <section className="space-y-4">
        {sp.demo === "1" && (
          <div className="rounded-xl border border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            Modo demo: Mercado Pago no está configurado, se te dio acceso
            directo. Cuando configures <code>MP_ACCESS_TOKEN</code>, el checkout
            real se activará solo.
          </div>
        )}

        {activeLesson ? (
          <>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
                {activeLesson.title}
              </h2>
              {activeLesson.description && (
                <p className="mt-2 text-[var(--ink-soft)]">
                  {activeLesson.description}
                </p>
              )}
            </div>
            <LessonPlayer
              lessonId={activeLesson.id}
              hasVideo={Boolean(activeLesson.videoPath)}
              watermark={`${session.user.email} · ${session.user.id.slice(-6)}`}
            />
          </>
        ) : (
          <div className="surface p-8">
            <p>Este curso todavía no tiene clases. El administrador puede cargarlas desde el panel.</p>
          </div>
        )}
      </section>
    </div>
  );
}
