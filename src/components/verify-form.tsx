"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function VerifyForm({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/verificar?code=${encodeURIComponent(code.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} className="surface mt-8 flex flex-col gap-3 p-6 sm:flex-row">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="CERT-XXXX-XXXX-XXXX-XXXX"
        className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
        required
      />
      <button type="submit" className="btn btn-primary">
        Verificar
      </button>
    </form>
  );
}
