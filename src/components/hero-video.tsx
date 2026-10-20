"use client";

import { useEffect, useRef } from "react";

type Props = { className?: string };

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

/**
 * Animación decorativa del hero (pizza → jugo → hamburguesa → mochila Dfly, en bucle).
 * Sin `autoPlay`: solo se reproduce si el usuario no pidió menos movimiento ni ahorro de datos,
 * y se pausa fuera de pantalla o con la pestaña oculta. En los demás casos queda el póster.
 */
export function HeroVideo({ className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    let visible = true;

    const sync = () => {
      if (visible && !document.hidden && !reduce.matches && !saveData) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    reduce.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster="/videos/hero-food-poster.jpg"
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-hidden
    >
      <source src="/videos/hero-food.mp4" type="video/mp4" />
    </video>
  );
}
