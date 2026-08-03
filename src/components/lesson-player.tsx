"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedVideoPlayer } from "@/components/protected-video-player";

type Props = {
  lessonId: string;
  hasVideo: boolean;
  watermark: string;
};

export function LessonPlayer({ lessonId, hasVideo, watermark }: Props) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStreamUrl(null);
      setError(null);
      if (!hasVideo) return;
      const res = await fetch(`/api/lessons/${lessonId}/token`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "No se pudo obtener el video");
        return;
      }
      setStreamUrl(data.streamUrl);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, hasVideo]);

  const onProgress = useCallback(
    async (watchedSec: number, completed: boolean) => {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedSec, completed }),
      });
    },
    [lessonId],
  );

  if (!hasVideo) {
    return (
      <div className="surface p-8 text-[var(--ink-soft)]">
        Esta clase todavía no tiene video cargado. El administrador puede
        subirlo desde el panel.
      </div>
    );
  }

  if (error) {
    return <div className="surface p-6 text-[var(--danger)]">{error}</div>;
  }

  if (!streamUrl) {
    return <div className="surface p-8 text-[var(--muted)]">Cargando video protegido…</div>;
  }

  return (
    <ProtectedVideoPlayer
      streamUrl={streamUrl}
      watermark={watermark}
      onProgress={onProgress}
    />
  );
}
