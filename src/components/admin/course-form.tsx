"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CourseValues = {
  id?: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  currency?: string;
  published?: boolean;
  passingScore?: number;
};

export function CourseForm({ initial }: { initial?: CourseValues }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      shortDescription: String(fd.get("shortDescription")),
      description: String(fd.get("description")),
      price: Number(fd.get("price")),
      currency: String(fd.get("currency") || "ARS"),
      published: fd.get("published") === "on",
      passingScore: Number(fd.get("passingScore") || 70),
    };

    const url = initial?.id
      ? `/api/admin/courses/${initial.id}`
      : "/api/admin/courses";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo guardar");
      return;
    }
    router.push(`/admin/cursos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="surface mt-8 space-y-4 p-8">
      <div className="field">
        <label htmlFor="title">Título</label>
        <input id="title" name="title" required defaultValue={initial?.title} />
      </div>
      <div className="field">
        <label htmlFor="shortDescription">Resumen corto</label>
        <input
          id="shortDescription"
          name="shortDescription"
          required
          defaultValue={initial?.shortDescription}
        />
      </div>
      <div className="field">
        <label htmlFor="description">Descripción completa</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={initial?.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="field">
          <label htmlFor="price">Precio</label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={initial?.price ?? 9990}
          />
        </div>
        <div className="field">
          <label htmlFor="currency">Moneda</label>
          <input
            id="currency"
            name="currency"
            defaultValue={initial?.currency || "ARS"}
          />
        </div>
        <div className="field">
          <label htmlFor="passingScore">% aprobación</label>
          <input
            id="passingScore"
            name="passingScore"
            type="number"
            min={1}
            max={100}
            defaultValue={initial?.passingScore ?? 70}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initial?.published ?? false}
        />
        Publicado en el catálogo
      </label>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Guardando…" : "Guardar curso"}
      </button>
    </form>
  );
}
