/**
 * Defer non-critical scroll-choreography setup off the hydration flush.
 * Without this, every section's dynamic `import('gsap')` resolves in the
 * same tick and ~15 ScrollTriggers initialize inside one long main-thread
 * task — measurable TBT on throttled mobile. requestIdleCallback spreads
 * that work into idle slices (with a timeout so triggers still exist well
 * before the user reaches them).
 */
export function deferIdle(cb: () => void, timeout = 1200): () => void {
  if (typeof window === 'undefined') return () => {};
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 1);
  return () => clearTimeout(id);
}
