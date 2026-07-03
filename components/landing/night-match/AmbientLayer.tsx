'use client';

import { useEffect, useRef } from 'react';

/**
 * The ONE persistent ambient layer behind all sections — "you are holding
 * the light." position:fixed, z-[1]: above the page base, below every
 * section (sections are z-[2] with slightly-translucent pitch backgrounds
 * so the light bleeds through without changing their designed color).
 *
 * Contents:
 *  - site-wide cursor floodlight: a faint flood-glow radial that follows
 *    the pointer everywhere (damped rAF; pauses when the tab is hidden)
 *  - slow ambient haze: two glow blobs + one volumetric shaft drifting on
 *    60–90s CSS loops at 3–5% opacity (keyframes in globals.css)
 *
 * Pure CSS/DOM — deliberately NOT an R3F canvas; GPU stays reserved for
 * the set pieces. prefers-reduced-motion: blobs hold still (see CSS);
 * the cursor glow is input-driven, not autonomous, so it stays.
 */
export function AmbientLayer() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glow.current;
    if (!el) return;

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.4;
    let cx = tx;
    let cy = ty;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - cx) < 0.3 && Math.abs(ty - cy) < 0.3) {
        running = false; // settled — stop burning frames until the pointer moves
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!running && !document.hidden) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      wake();
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      } else wake();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {/* slow ambient haze — blobs + one volumetric shaft */}
      <div className="nm-blob nm-blob-a" />
      <div className="nm-blob nm-blob-b" />
      <div className="nm-shaft" />

      {/* site-wide cursor floodlight */}
      <div
        ref={glow}
        className="absolute left-0 top-0 h-[46rem] w-[46rem] rounded-full will-change-transform"
        style={{
          background:
            'radial-gradient(circle at center, rgba(200,241,53,0.075) 0%, rgba(226,240,214,0.04) 35%, transparent 68%)',
          transform: 'translate3d(-200vw, -200vh, 0)',
        }}
      />
    </div>
  );
}
