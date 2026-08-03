"use client";

import { useState } from "react";

export function BuyCourseButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar el pago");
        return;
      }
      if (data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }
      setError("Mercado Pago no devolvió un enlace de pago");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn btn-accent w-full"
        disabled={loading}
        onClick={handleBuy}
      >
        {loading ? "Redirigiendo…" : "Comprar con Mercado Pago"}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
