'use client';

/**
 * NightLoader — the sports loading state: a chalk football bouncing on the
 * pitch with squash-and-stretch, spinning panels and a floodlit ground
 * shadow. Replaces every generic spinner on full-page loads.
 * Reduced motion: static ball + label.
 */
export function NightLoader({
  label = 'Warming up…',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-6 ${className}`} role="status">
      <div className="relative h-[86px] w-20">
        {/* bouncing wrapper (translate + squash) */}
        <div className="nm-ball absolute left-1/2 top-0 h-9 w-9">
          {/* spinning face (panel patches) */}
          <div className="nm-ball-face h-full w-full" />
        </div>
        {/* ground shadow */}
        <div className="nm-ball-shadow absolute bottom-0 left-1/2 h-1.5 w-11 rounded-full bg-black" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-chalk-400">{label}</p>
    </div>
  );
}
