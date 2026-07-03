'use client';

import { useEffect } from 'react';
import { AmbientLayer } from '@/components/landing/night-match/AmbientLayer';

/**
 * NightShell — wraps every Night Match product page.
 *  - Ref-counts an `html.night` class so ALL shadcn semantic vars (and
 *    every portal: dialogs, dropdowns, toasts, calendars) go dark while a
 *    night page is mounted. Removal is deferred a beat so navigating
 *    between two night pages never flashes the light theme.
 *  - Renders the global ambient layer (cursor floodlight + haze), dialed
 *    down via `ambient` on work surfaces (dashboards / booking).
 *  - Plays the 150ms fade-through-dark route entrance (.nm-route-in).
 */

let nightRefs = 0;
let removalTimer: ReturnType<typeof setTimeout> | undefined;

function acquireNight() {
  nightRefs += 1;
  if (removalTimer) clearTimeout(removalTimer);
  document.documentElement.classList.add('night');
}

function releaseNight() {
  nightRefs -= 1;
  removalTimer = setTimeout(() => {
    if (nightRefs <= 0) document.documentElement.classList.remove('night');
  }, 120);
}

export function NightShell({
  children,
  ambient = 1,
  className = '',
}: {
  children: React.ReactNode;
  ambient?: number;
  className?: string;
}) {
  useEffect(() => {
    acquireNight();
    return releaseNight;
  }, []);

  return (
    <div className={`nm-route-in relative min-h-screen bg-pitch-900 text-chalk-100 ${className}`}>
      <AmbientLayer intensity={ambient} />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
