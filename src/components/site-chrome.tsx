import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const appName = process.env.APP_NAME || "Academia Certifica";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/70 bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--brand)]">
            {appName}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-soft)] md:flex">
          <Link href="/cursos" className="hover:text-[var(--brand)]">
            Cursos
          </Link>
          <Link href="/verificar" className="hover:text-[var(--brand)]">
            Verificar certificado
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-[var(--brand)]">
              Admin
            </Link>
          )}
          {session?.user && (
            <Link href="/mis-cursos" className="hover:text-[var(--brand)]">
              Mis cursos
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-[var(--muted)] sm:inline">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn btn-ghost !px-4 !py-2 text-sm">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost !px-4 !py-2 text-sm">
                Ingresar
              </Link>
              <Link href="/registro" className="btn btn-primary !px-4 !py-2 text-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] py-10">
      <div className="container flex flex-col gap-3 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {appName}. Cursos y certificaciones en
          video.
        </p>
        <div className="flex gap-4">
          <Link href="/cursos">Catálogo</Link>
          <Link href="/verificar">Verificar certificado</Link>
        </div>
      </div>
    </footer>
  );
}
