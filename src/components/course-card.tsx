import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/utils";

type CourseCardProps = {
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
  currency: string;
  lessonCount?: number;
  totalDuration?: number;
};

export function CourseCard({
  slug,
  title,
  shortDescription,
  price,
  currency,
  lessonCount,
  totalDuration,
}: CourseCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)]">
      <div className="hero-glow h-40 w-full" />
      <div className="space-y-3 p-6">
        <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--brand)]">
          <Link href={`/cursos/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          {shortDescription}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-[var(--muted)]">
          <span>
            {lessonCount ? `${lessonCount} clases` : "Curso online"}
            {totalDuration ? ` · ${formatDuration(totalDuration)}` : ""}
          </span>
          <strong className="text-base text-[var(--brand)]">
            {formatPrice(price, currency)}
          </strong>
        </div>
      </div>
    </article>
  );
}
