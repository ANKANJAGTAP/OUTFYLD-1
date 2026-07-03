'use client';

import { useEffect, useRef } from 'react';
import { deferIdle } from './deferIdle';

/**
 * Discrete reveal for headings/copy: plays on enter, REVERSES when you
 * scroll back above it (toggleActions "play none none reverse"), so no
 * section is ever left in a dead end-state on re-entry.
 * GSAP is dynamically imported (bundle discipline); reduced motion renders
 * the rest state with no animation.
 */
export function Reveal({
  children,
  className = '',
  y = 24,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
        gsap.fromTo(
          el,
          { y, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            delay,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, [y, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
