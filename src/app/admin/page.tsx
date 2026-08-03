import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("ADMIN");
  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      modules: { include: { lessons: true } },
      _count: { select: { enrollments: true } },
    },
  });
  const students = await prisma.user.count({ where: { role: "STUDENT" } });
  const payments = await prisma.payment.count({ where: { status: "APPROVED" } });

  return (
    <div className="container space-y-10 py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Administración</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl text-[var(--brand)]">
            Panel
          </h1>
        </div>
        <Link href="/admin/cursos/nuevo" className="btn btn-primary">
          Nuevo curso
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-sm text-[var(--muted)]">Cursos</p>
          <p className="text-3xl font-semibold text-[var(--brand)]">{courses.length}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm text-[var(--muted)]">Alumnos</p>
          <p className="text-3xl font-semibold text-[var(--brand)]">{students}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm text-[var(--muted)]">Pagos aprobados</p>
          <p className="text-3xl font-semibold text-[var(--brand)]">{payments}</p>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-deep)] text-[var(--muted)]">
            <tr>
              <th className="px-5 py-3 font-medium">Curso</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Clases</th>
              <th className="px-5 py-3 font-medium">Inscripciones</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const lessons = course.modules.flatMap((m) => m.lessons);
              return (
                <tr key={course.id} className="border-t border-[var(--line)]">
                  <td className="px-5 py-4 font-medium text-[var(--brand)]">
                    {course.title}
                  </td>
                  <td className="px-5 py-4">
                    {course.published ? "Publicado" : "Borrador"}
                  </td>
                  <td className="px-5 py-4">
                    {formatPrice(course.price, course.currency)}
                  </td>
                  <td className="px-5 py-4">{lessons.length}</td>
                  <td className="px-5 py-4">{course._count.enrollments}</td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/cursos/${course.id}`}
                      className="text-[var(--brand)] underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {courses.length === 0 && (
          <p className="p-6 text-[var(--muted)]">Todavía no hay cursos.</p>
        )}
      </div>
    </div>
  );
}
