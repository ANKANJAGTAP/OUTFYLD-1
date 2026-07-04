'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ScrollIndicator — a fixed vertical pitch-line on the right whose lime fill
 * and marker travel DOWN as you scroll down and back UP as you scroll up,
 * bound 1:1 to scroll position. A mono percentage rides alongside the marker.
 * Auto-hides on pages too short to scroll; fades in once you leave the top.
 * Works with Lenis (reads window.scrollY, which Lenis drives).
 */
export function ScrollIndicator() {
  const fill = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<'hidden' | 'idle' | 'shown'>('hidden');

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      // nothing meaningful to indicate on a short page
      if (max < 240) {
        setState('hidden');
        return;
      }
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      if (fill.current) fill.current.style.height = `${p * 100}%`;
      if (marker.current) {
        // top%/translateY(-p%) keeps the marker inside the track at both ends
        marker.current.style.top = `${p * 100}%`;
        marker.current.style.transform = `translateY(-${p * 100}%)`;
      }
      if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(2, '0');
      setState(window.scrollY > 60 ? 'shown' : 'idle');
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (state === 'hidden') return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 ease-night md:block ${
        state === 'shown' ? 'opacity-100' : 'opacity-40'
      }`}
    >
      {/* track */}
      <div className="relative h-[36vh] max-h-[380px] w-px bg-pitchline">
        {/* lime fill grows from the top down to the marker */}
        <div
          ref={fill}
          className="absolute left-0 top-0 w-px bg-flood-500"
          style={{ height: '0%' }}
        />
        {/* the moving marker: short lime bar + mono % readout */}
        <div ref={marker} className="absolute left-0 top-0 flex items-center gap-2" style={{ top: 0 }}>
          <span
            ref={pct}
            className="-translate-x-full pr-2.5 font-mono text-[10px] tabular-nums tracking-[0.14em] text-flood-500"
          >
            00
          </span>
          <span className="block h-4 w-[3px] -translate-x-[1px] bg-flood-500 shadow-flood" />
        </div>
      </div>
    </div>
  );
}
