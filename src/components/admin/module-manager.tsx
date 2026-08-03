"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  durationSec: number;
  hasVideo: boolean;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export function ModuleManager({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Module[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addModule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: String(fd.get("title")) }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  async function addLesson(moduleId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        durationSec: Number(fd.get("durationSec") || 0),
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  async function uploadVideo(lessonId: string, file: File | null) {
    if (!file) return;
    setBusy(true);
    setMessage("Subiendo video…");
    const fd = new FormData();
    fd.append("video", file);
    const res = await fetch(`/api/admin/lessons/${lessonId}/video`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? "Video subido correctamente" : data.error || "Error al subir");
    if (res.ok) router.refresh();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
          Módulos y clases
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Subí los videos desde acá. Se sirven por streaming protegido (sin
          descarga directa).
        </p>
      </div>

      {modules.map((mod) => (
        <div key={mod.id} className="surface space-y-4 p-6">
          <h3 className="text-xl font-semibold text-[var(--brand)]">{mod.title}</h3>
          <ul className="space-y-4">
            {mod.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="rounded-xl border border-[var(--line)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {lesson.hasVideo ? "Video cargado" : "Sin video"} ·{" "}
                      {Math.round(lesson.durationSec / 60)} min
                    </p>
                  </div>
                  <label className="btn btn-ghost !cursor-pointer !px-4 !py-2 text-sm">
                    {busy ? "…" : "Subir video"}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) =>
                        uploadVideo(lesson.id, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>

          <form
            onSubmit={(e) => addLesson(mod.id, e)}
            className="grid gap-3 border-t border-[var(--line)] pt-4 md:grid-cols-[1fr_1fr_120px_auto]"
          >
            <input name="title" placeholder="Nueva clase" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="description" placeholder="Descripción" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="durationSec" type="number" placeholder="Segundos" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <button type="submit" className="btn btn-primary !py-2 text-sm" disabled={busy}>
              Agregar
            </button>
          </form>
        </div>
      ))}

      <form onSubmit={addModule} className="surface flex flex-col gap-3 p-6 sm:flex-row">
        <input
          name="title"
          placeholder="Nombre del módulo"
          required
          className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3"
        />
        <button type="submit" className="btn btn-accent" disabled={busy}>
          Agregar módulo
        </button>
      </form>
      {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
    </section>
  );
}
