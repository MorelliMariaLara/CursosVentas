import { CourseCard } from "@/components/course-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cursos" };

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { modules: { include: { lessons: true } } },
  });

  return (
    <div className="container py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-[var(--brand)]">
          Cursos y certificaciones
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Elegí un programa, pagá con Mercado Pago y accedé al contenido al
          instante.
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="text-[var(--muted)]">No hay cursos publicados todavía.</p>
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
    </div>
  );
}
