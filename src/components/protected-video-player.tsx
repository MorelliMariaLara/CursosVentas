"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  streamUrl: string;
  watermark: string;
  onProgress?: (watchedSec: number, completed: boolean) => void;
};

export function ProtectedVideoPlayer({
  streamUrl,
  watermark,
  onProgress,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastSent = useRef(0);

  const pauseWithNotice = useCallback((text: string) => {
    const video = videoRef.current;
    if (video && !video.paused) video.pause();
    setBlocked(true);
    setMessage(text);
  }, []);

  useEffect(() => {
    const onContext = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      // Bloquea atajos comunes de captura / herramientas de desarrollador frecuentes
      if (
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c", "s"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && ["s", "u"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        pauseWithNotice(
          "La captura o descarga de contenido está restringida por políticas de privacidad.",
        );
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", () => {
      // Al cambiar de ventana, pausamos para dificultar grabaciones externas
      videoRef.current?.pause();
    });

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pauseWithNotice]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const tick = () => {
      const watched = Math.floor(video.currentTime);
      const completed =
        video.duration > 0 && watched / video.duration >= 0.9;
      if (watched - lastSent.current >= 5 || completed) {
        lastSent.current = watched;
        onProgress(watched, completed);
      }
    };

    video.addEventListener("timeupdate", tick);
    video.addEventListener("ended", () =>
      onProgress(Math.floor(video.duration || 0), true),
    );
    return () => {
      video.removeEventListener("timeupdate", tick);
    };
  }, [onProgress, streamUrl]);

  return (
    <div
      className="protected-player no-select"
      data-watermark={watermark}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={streamUrl}
        controls
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        playsInline
        onPlay={() => {
          if (blocked) {
            videoRef.current?.pause();
          }
        }}
      />
      {blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-center">
          <div className="max-w-md space-y-4 text-white">
            <p className="text-lg">{message}</p>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                setBlocked(false);
                setMessage(null);
              }}
            >
              Entendido, continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
