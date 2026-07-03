'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SquadSelector — broadcast-graphics tab switcher: uppercase mono tabs on a
 * hairline, with a lime underline that SLIDES between selections (300ms,
 * ease-night). Used for the browse sport filter and booking status tabs.
 */
export function SquadSelector({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const wrap = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      const w = wrap.current;
      if (el && w) {
        setBar({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, options.length]);

  return (
    <div
      ref={wrap}
      className={`relative flex gap-6 overflow-x-auto border-b border-pitchline [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[o.value] = el;
          }}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap px-1 pb-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-200 ease-night ${
            value === o.value ? 'text-flood-500' : 'text-chalk-400 hover:text-chalk-100'
          }`}
        >
          {o.label}
        </button>
      ))}
      <span
        aria-hidden
        className="absolute bottom-0 h-[2px] bg-flood-500 shadow-flood transition-all duration-300 ease-night motion-reduce:transition-none"
        style={{ left: bar.left, width: bar.width }}
      />
    </div>
  );
}
