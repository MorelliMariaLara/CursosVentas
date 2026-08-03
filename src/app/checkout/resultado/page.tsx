import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function CheckoutResultPage({ searchParams }: Props) {
  const { status } = await searchParams;

  const copy =
    status === "success"
      ? {
          title: "Pago recibido",
          text: "Cuando Mercado Pago confirme el pago, tu curso se activará automáticamente. Revisá Mis cursos en unos segundos.",
        }
      : status === "pending"
        ? {
            title: "Pago pendiente",
            text: "Tu pago está en revisión. Te habilitaremos el acceso apenas se acredite.",
          }
        : {
            title: "Pago no completado",
            text: "No se concretó la compra. Podés intentar de nuevo desde el curso.",
          };

  return (
    <div className="container max-w-lg py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {copy.title}
      </h1>
      <p className="mt-4 text-[var(--ink-soft)]">{copy.text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/mis-cursos" className="btn btn-primary">
          Ir a mis cursos
        </Link>
        <Link href="/cursos" className="btn btn-ghost">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
