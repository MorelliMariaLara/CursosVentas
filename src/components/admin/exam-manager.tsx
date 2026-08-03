"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
};

type Exam = {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
};

export function ExamManager({
  courseId,
  exam,
}: {
  courseId: string;
  exam: Exam | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureExam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/courses/${courseId}/exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error");
      return;
    }
    router.refresh();
  }

  async function addQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!exam) return;
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const options = [
      String(fd.get("opt0")),
      String(fd.get("opt1")),
      String(fd.get("opt2")),
      String(fd.get("opt3")),
    ];
    const res = await fetch(`/api/admin/exams/${exam.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: String(fd.get("prompt")),
        options,
        correctOption: Number(fd.get("correctOption")),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
          Evaluación final
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tras completar las clases, el alumno rinde este examen para obtener el
          certificado.
        </p>
      </div>

      {!exam ? (
        <form onSubmit={ensureExam} className="surface space-y-4 p-6">
          <div className="field">
            <label htmlFor="title">Título del examen</label>
            <input id="title" name="title" required defaultValue="Evaluación final" />
          </div>
          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={2} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Crear examen
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="surface p-6">
            <h3 className="font-semibold text-[var(--brand)]">{exam.title}</h3>
            {exam.description && (
              <p className="mt-1 text-sm text-[var(--muted)]">{exam.description}</p>
            )}
            <ul className="mt-4 space-y-3">
              {exam.questions.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                  <p className="font-medium">
                    {i + 1}. {q.prompt}
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    Correcta: {q.options[q.correctOption]}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={addQuestion} className="surface space-y-3 p-6">
            <h4 className="font-semibold">Agregar pregunta</h4>
            <div className="field">
              <label htmlFor="prompt">Enunciado</label>
              <input id="prompt" name="prompt" required />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div className="field" key={i}>
                <label htmlFor={`opt${i}`}>Opción {i + 1}</label>
                <input id={`opt${i}`} name={`opt${i}`} required />
              </div>
            ))}
            <div className="field">
              <label htmlFor="correctOption">Opción correcta</label>
              <select id="correctOption" name="correctOption" defaultValue={0}>
                <option value={0}>Opción 1</option>
                <option value={1}>Opción 2</option>
                <option value={2}>Opción 3</option>
                <option value={3}>Opción 4</option>
              </select>
            </div>
            <button type="submit" className="btn btn-accent" disabled={busy}>
              Agregar pregunta
            </button>
          </form>
        </div>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
