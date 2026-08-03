import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCourseProgress } from "@/lib/enrollment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis cursos" };

export default async function MyCoursesPage() {
  const session = await requireSession();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { course: true },
    orderBy: { purchasedAt: "desc" },
  });

  const withProgress = await Promise.all(
    enrollments.map(async (e) => ({
      ...e,
      progress: await getCourseProgress(session.user.id, e.courseId),
    })),
  );

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { course: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="container space-y-12 py-14">
      <div>
        <p className="eyebrow">Aula</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-[var(--brand)]">
          Mis cursos
        </h1>
      </div>

      {withProgress.length === 0 ? (
        <div className="surface p-8">
          <p className="text-[var(--ink-soft)]">Todavía no compraste ningún curso.</p>
          <Link href="/cursos" className="btn btn-primary mt-4">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {withProgress.map((item) => (
            <article key={item.id} className="surface p-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--brand)]">
                {item.course.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Progreso: {item.progress?.percent ?? 0}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-deep)]">
                <div
                  className="h-full rounded-full bg-[var(--brand)]"
                  style={{ width: `${item.progress?.percent ?? 0}%` }}
                />
              </div>
              <Link
                href={`/aprender/${item.course.slug}`}
                className="btn btn-primary mt-5 !py-2 text-sm"
              >
                Continuar
              </Link>
            </article>
          ))}
        </div>
      )}

      {certificates.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
            Mis certificados
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="surface flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-[var(--brand)]">{cert.courseTitle}</p>
                  <p className="text-sm text-[var(--muted)]">Código {cert.code}</p>
                </div>
                <Link
                  href={`/api/certificates/${cert.code}`}
                  className="btn btn-ghost !px-4 !py-2 text-sm"
                >
                  Descargar PDF
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
