"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/mis-cursos";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="surface mx-auto mt-8 max-w-md space-y-4 p-8">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-[var(--brand)] underline">
          Registrate
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container py-14">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow">Acceso</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          Ingresar
        </h1>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
