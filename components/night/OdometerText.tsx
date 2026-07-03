'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * OdometerText — scoreboard number that rolls whenever `value` changes
 * (unlike CountUp, which fires once on scroll-in). Used for live result
 * counts that re-roll as filters change. Reduced motion: snaps.
 */
export function OdometerText({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {display.toLocaleString('en-IN')}
    </span>
  );
}
