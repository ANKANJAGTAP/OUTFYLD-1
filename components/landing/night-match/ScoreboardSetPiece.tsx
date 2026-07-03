'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlatformStats } from '@/lib/turfs';
import { SceneBoundary } from './SceneBoundary';

const Scoreboard3D = dynamic(() => import('./Scoreboard3D'), { ssr: false });

/**
 * Gate for the 3D stadium scoreboard set piece.
 * SSR + mobile (<768px) + reduced-motion + any WebGL failure → the flat
 * odometer band (children): same real numbers, real text, readable at 390px.
 * Desktop with motion → the flat band swaps for the 3D panel (crossfade),
 * with the stats kept in an sr-only line for assistive tech.
 */
export function ScoreboardSetPiece({
  stats,
  children,
}: {
  stats: PlatformStats;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<'flat' | '3d'>('flat');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 768px)').matches;
    if (!reduce && wide) setMode('3d');
  }, []);

  if (mode === 'flat') return <>{children}</>;

  return (
    <div className="relative h-[440px] lg:h-[540px]">
      <p className="sr-only">
        {stats.turfs} turfs floodlit and bookable. {stats.cities} cities in play.{' '}
        {stats.bookings.toLocaleString('en-IN')} games booked. Average player rating{' '}
        {stats.rating.toFixed(1)} out of 5.
      </p>
      {/* skeleton panel while the canvas boots */}
      <div
        className="absolute inset-x-0 top-6 mx-auto h-[70%] max-w-3xl rounded border border-pitchline bg-pitch-700/30 transition-opacity duration-500 ease-night"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-night"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <SceneBoundary onError={() => setMode('flat')}>
          <Scoreboard3D stats={stats} onReady={() => setReady(true)} />
        </SceneBoundary>
      </div>
    </div>
  );
}
