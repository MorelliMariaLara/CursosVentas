"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export function ExamForm({
  examId,
  questions,
  courseSlug,
}: {
  examId: string;
  questions: Question[];
  courseSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    certificateCode?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const answers: Record<string, number> = {};
    for (const q of questions) {
      const val = fd.get(`q_${q.id}`);
      if (val === null) {
        setError("Respondé todas las preguntas");
        setLoading(false);
        return;
      }
      answers[q.id] = Number(val);
    }

    const res = await fetch("/api/exams/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId, answers }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "No se pudo enviar el examen");
      return;
    }
    setResult(data);
    if (data.passed) {
      router.refresh();
    }
  }

  if (result) {
    return (
      <div className="surface mt-8 space-y-4 p-8">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
          {result.passed ? "¡Aprobaste!" : "No aprobaste esta vez"}
        </h2>
        <p className="text-[var(--ink-soft)]">
          Tu calificación: <strong>{result.score}%</strong>
        </p>
        {result.passed && result.certificateCode ? (
          <a
            href={`/api/certificates/${result.certificateCode}`}
            className="btn btn-accent"
          >
            Descargar certificado
          </a>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setResult(null);
            }}
          >
            Intentar de nuevo
          </button>
        )}
        <a href={`/aprender/${courseSlug}`} className="btn btn-ghost">
          Volver al curso
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      {questions.map((q, idx) => (
        <fieldset key={q.id} className="surface space-y-3 p-6">
          <legend className="font-semibold text-[var(--brand)]">
            {idx + 1}. {q.prompt}
          </legend>
          <div className="space-y-2">
            {q.options.map((opt, optIdx) => (
              <label
                key={optIdx}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] px-4 py-3 hover:bg-[var(--bg)]"
              >
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={optIdx}
                  required
                  className="mt-1"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Enviando…" : "Enviar evaluación"}
      </button>
    </form>
  );
}
