'use client';

import { useEffect } from 'react';

/**
 * Night Match smooth-scroll provider.
 * Wraps the homepage only so dashboard/booking flows keep native scroll.
 * Lenis + GSAP are dynamically imported inside the effect so they stay OUT of
 * the initial bundle (off the LCP critical path) and load after first paint.
 * Honors prefers-reduced-motion by skipping smoothing entirely.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // native scroll, no easing

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      const onRaf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(onRaf);
      gsap.ticker.lagSmoothing(0);

      // Trigger positions depend on image/font layout — refresh once fully loaded
      const onLoad = () => ScrollTrigger.refresh();
      if (document.readyState === 'complete') onLoad();
      else window.addEventListener('load', onLoad, { once: true });

      cleanup = () => {
        window.removeEventListener('load', onLoad);
        gsap.ticker.remove(onRaf);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
