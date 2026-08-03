import { prisma } from "@/lib/prisma";
import { VerifyForm } from "@/components/verify-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verificar certificado" };

type Props = { searchParams: Promise<{ code?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const { code } = await searchParams;
  let result: null | {
    valid: boolean;
    studentName?: string;
    courseTitle?: string;
    issuedAt?: string;
    score?: number;
  } = null;

  if (code) {
    const cert = await prisma.certificate.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (cert) {
      result = {
        valid: true,
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        issuedAt: cert.issuedAt.toLocaleDateString("es-AR"),
        score: cert.score,
      };
    } else {
      result = { valid: false };
    }
  }

  return (
    <div className="container max-w-xl py-14">
      <p className="eyebrow">Validación</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        Verificar certificado
      </h1>
      <p className="mt-3 text-[var(--ink-soft)]">
        Ingresá el código que aparece en el PDF para confirmar su autenticidad.
      </p>
      <VerifyForm initialCode={code || ""} />
      {result && (
        <div className="surface mt-6 p-6">
          {result.valid ? (
            <div className="space-y-2">
              <p className="font-semibold text-[var(--ok)]">Certificado válido</p>
              <p>
                <strong>{result.studentName}</strong> — {result.courseTitle}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Emitido: {result.issuedAt} · Calificación: {result.score}%
              </p>
            </div>
          ) : (
            <p className="text-[var(--danger)]">
              No encontramos un certificado con ese código.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
