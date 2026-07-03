'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

/**
 * Night Match base primitives — the floodlight language, restyled once.
 * Inputs: dark field, hairline border, lime focus ring w/ flood glow.
 * Buttons: lime primary (ONE per view) / ghost chalk secondary, with
 * press-down physicality. Cards: pitch-700, hairline border, rim-light
 * elevation — no drop-shadow soup. Badges are overline text, never pills.
 * All motion 150–400ms on cubic-bezier(0.16,1,0.3,1) (ease-night).
 */

export const nightField =
  'w-full rounded-[4px] border border-pitchline bg-pitch-800/80 px-4 py-3 text-sm text-chalk-100 ' +
  'placeholder:text-chalk-400/60 outline-none transition-[border-color,box-shadow] duration-200 ease-night ' +
  'focus:border-flood-500/60 disabled:opacity-40';

export const nightPrimaryBtn =
  'nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] bg-flood-500 px-6 py-3.5 ' +
  'text-pitch-900 transition-[transform,box-shadow,background-color,opacity] duration-200 ease-night ' +
  'hover:bg-flood-600 hover:shadow-flood active:translate-y-[2px] active:shadow-none ' +
  'disabled:pointer-events-none disabled:opacity-35';

export const nightGhostBtn =
  'nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-chalk-400/30 ' +
  'px-6 py-3.5 text-chalk-100 transition-[border-color,color,transform] duration-200 ease-night ' +
  'hover:border-flood-500 hover:text-flood-500 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-35';

export const nightCard =
  'relative rounded-[4px] border border-pitchline bg-pitch-700/90 ' +
  'transition-[border-color,box-shadow] duration-300 ease-night';

export const nightCardHover = 'hover:border-flood-500/40 hover:shadow-flood';

export const NightInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function NightInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${nightField} ${className}`} {...props} />;
  }
);

export const NightTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function NightTextarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`${nightField} min-h-28 ${className}`} {...props} />;
});

/** Overline badge — status/label text, never a pill. */
export function Overline({
  children,
  tone = 'chalk',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'chalk' | 'lime';
  className?: string;
}) {
  return (
    <span
      className={`nm-overline inline-flex items-center gap-2 ${
        tone === 'lime' ? 'text-flood-500' : 'text-chalk-400'
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Lime/chalk live dot for statuses (● COMPLETED). */
export function StatusDot({ tone = 'lime' }: { tone?: 'lime' | 'chalk' | 'red' }) {
  const color =
    tone === 'lime' ? 'bg-flood-500 shadow-flood' : tone === 'red' ? 'bg-red-700' : 'bg-chalk-400';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

/** Scoreboard number — Geist Mono, tabular. Every digit on the product. */
export function Mono({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono tabular-nums tracking-tight ${className}`}>{children}</span>
  );
}

export function NightSkeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`nm-skeleton ${className}`} />;
}

/** Ghost button with a lime hover fill sweep (Book Again, etc.). */
export function SweepButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`nm-overline group relative overflow-hidden rounded-[4px] border border-chalk-400/30 px-5 py-2.5 text-chalk-100 transition-colors duration-300 ease-night hover:border-flood-500 hover:text-pitch-900 ${className}`}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full bg-flood-500 transition-transform duration-300 ease-night group-hover:translate-x-0" />
      <span className="relative">{children}</span>
    </button>
  );
}

/** Primary CTA as a link. */
export function NightCta({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${nightPrimaryBtn} ${className}`}>
      {children}
    </Link>
  );
}
