"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "No se pudo crear la cuenta");
      return;
    }

    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/cursos");
    router.refresh();
  }

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow">Cuenta</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          Crear cuenta
        </h1>
      </div>
      <form onSubmit={onSubmit} className="surface mx-auto mt-8 max-w-md space-y-4 p-8">
        <div className="field">
          <label htmlFor="name">Nombre completo</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
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
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creando…" : "Registrarme"}
        </button>
        <p className="text-center text-sm text-[var(--muted)]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[var(--brand)] underline">
            Ingresá
          </Link>
        </p>
      </form>
    </div>
  );
}
