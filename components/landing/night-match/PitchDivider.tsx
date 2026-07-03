'use client';

import { useEffect, useRef } from 'react';
import { deferIdle } from './deferIdle';

/**
 * PitchDivider — the Night Match layout motif, now alive.
 * The 4° chalked touchline DRAWS itself as it scrolls into view
 * (SVG stroke-dashoffset scrubbed to scroll — draws on entry, undraws
 * on scroll-back) and the lime corner-flag tick pops on completion,
 * reversing with it. Draw direction runs toward the flag.
 * Reduced motion: fully drawn, static.
 */
export function PitchDivider({
  flag = 'right',
  className = '',
}: {
  flag?: 'left' | 'right' | 'none';
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const line = el.querySelector<SVGLineElement>('.nm-pitchline-path');
    const tick = el.querySelector<HTMLElement>('.nm-pitchline-tick');
    if (!line) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      line.style.strokeDashoffset = '0'; // fully drawn, static
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 58%', scrub: 0.7 },
        });
        tl.fromTo(
          line,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.85, ease: 'none' }
        );
        if (tick) {
          tl.fromTo(
            tick,
            { scale: 0, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.15, ease: 'none' },
            0.85 // pops as the line completes, reverses with it
          );
        }
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className={`relative h-16 w-full overflow-hidden ${className}`}>
      {/* 4° chalk line — drawn via dashoffset, direction runs toward the flag */}
      <svg
        className="absolute inset-x-[-5%] top-1/2 h-[2px] w-[110%] -rotate-[4deg]"
        style={{ overflow: 'visible' }}
      >
        <line
          className="nm-pitchline-path"
          x1={flag === 'left' ? '100%' : '0%'}
          y1="1"
          x2={flag === 'left' ? '0%' : '100%'}
          y2="1"
          stroke="#1F2D26"
          strokeWidth="1.5"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
      </svg>
      {/* corner-flag tick */}
      {flag !== 'none' && (
        <div
          className={`nm-pitchline-tick absolute top-1/2 h-2 w-2 -translate-y-1/2 bg-flood-500 shadow-flood ${
            flag === 'right' ? 'right-6 sm:right-12' : 'left-6 sm:left-12'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
        />
      )}
    </div>
  );
}
