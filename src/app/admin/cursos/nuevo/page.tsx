import { requireRole } from "@/lib/session";
import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "Nuevo curso" };

export default async function NewCoursePage() {
  await requireRole("ADMIN");
  return (
    <div className="container max-w-2xl py-14">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        Nuevo curso
      </h1>
      <CourseForm />
    </div>
  );
}
