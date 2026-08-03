import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const appName = process.env.APP_NAME || "Academia Certifica";
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      modules: { include: { lessons: true } },
    },
  });

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow opacity-95" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4a35a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="container relative grid min-h-[78vh] items-center gap-10 py-16 text-[#f7f3ea] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="eyebrow fade-up !text-[var(--accent)]">{appName}</p>
            <h1 className="fade-up font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Formate. Certificate. Avanzá.
            </h1>
            <p className="fade-up-delay max-w-xl text-lg leading-relaxed text-[#d9e2df]">
              Cursos en video con evaluación final y certificado digital.
              Comprá con Mercado Pago y aprendé cuando quieras.
            </p>
            <div className="fade-up-delay-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/cursos" className="btn btn-accent">
                Ver cursos
              </Link>
              <Link
                href="/registro"
                className="btn border border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>
          <div className="fade-up-delay relative hidden min-h-[360px] lg:block">
            <div className="absolute inset-6 rounded-[28px] border border-[var(--accent)]/40 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-[2px]" />
            <div className="absolute bottom-10 left-10 right-10 rounded-2xl border border-white/15 bg-black/25 p-6 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">
                Incluye
              </p>
              <ul className="mt-3 space-y-2 text-[#e8efec]">
                <li>Videos protegidos sin descarga</li>
                <li>Evaluación al finalizar</li>
                <li>Certificado verificable</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">Catálogo</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
            Empezá por un curso
          </h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            Cada programa combina clases en video, seguimiento de progreso y una
            instancia evaluatoria para certificar tus conocimientos.
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="text-[var(--muted)]">Pronto publicaremos nuevos cursos.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const lessons = course.modules.flatMap((m) => m.lessons);
              return (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  title={course.title}
                  shortDescription={course.shortDescription}
                  price={course.price}
                  currency={course.currency}
                  lessonCount={lessons.length}
                  totalDuration={lessons.reduce((a, l) => a + l.durationSec, 0)}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
