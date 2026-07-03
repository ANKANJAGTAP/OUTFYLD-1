'use client';

import { useEffect, useRef } from 'react';
import type { PlatformStats } from '@/lib/turfs';
import { deferIdle } from './deferIdle';

/**
 * Broadcast ticker — sports-TV live-score strip between the scoreboard and
 * the ticket stubs. Seamless infinite marquee (two identical halves, -50%
 * wrap, no jump). Scroll velocity adds to the ticker speed and briefly
 * REVERSES it when scrolling up (ScrollTrigger.getVelocity), easing back to
 * base speed when idle. prefers-reduced-motion: a static line.
 */
export function BroadcastTicker({ stats }: { stats: PlatformStats }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // static line

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
        const tween = gsap.to(el, { xPercent: -50, ease: 'none', duration: 32, repeat: -1 });
        let speedTween: gsap.core.Timeline | null = null;

        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            const v = self.getVelocity();
            if (Math.abs(v) < 40) return;
            speedTween?.kill();
            // scroll down → faster forward; scroll up → brief reverse; then ease home
            speedTween = gsap
              .timeline()
              .to(tween, {
                timeScale: gsap.utils.clamp(-4, 6, v / 300),
                duration: 0.2,
                ease: 'power1.out',
              })
              .to(tween, { timeScale: 1, duration: 1.4, ease: 'power2.out' }, '+=0.45');
          },
        });
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  const cell = (
    <>
      <span className="mx-4 inline-block text-flood-500">●</span>
      <span>LIVE</span>
      <span className="mx-4 text-pitchline">—</span>
      <span>
        {stats.turfs} turfs across {stats.cities} cities
      </span>
      <span className="mx-4 text-pitchline">—</span>
      <span>Book in 3 taps</span>
      <span className="mx-4 text-pitchline">—</span>
      <span>OutFyld</span>
    </>
  );

  // two identical halves → xPercent -50 wraps seamlessly
  const half = (
    <div className="flex shrink-0 items-center whitespace-nowrap">
      {Array.from({ length: 4 }, (_, i) => (
        <span key={i} className="inline-flex items-center">
          {cell}
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative z-[2] border-y border-pitchline bg-pitch-800/[0.95]">
      <p className="sr-only">
        Live: {stats.turfs} turfs across {stats.cities} cities. Book in 3 taps on OutFyld.
      </p>
      <div
        ref={root}
        aria-hidden
        className="overflow-hidden py-3 font-mono text-xs uppercase tracking-[0.22em] text-chalk-400"
      >
        <div ref={track} className="nm-ticker-track">
          {half}
          {half}
        </div>
      </div>
    </div>
  );
}
