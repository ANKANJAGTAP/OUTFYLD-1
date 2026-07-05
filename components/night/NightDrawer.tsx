'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * NightDrawer — a bottom-sheet in the Night Match language, used on mobile
 * where a sidebar won't fit (e.g. the /browse filters). Slides up from the
 * bottom over a dark scrim, has a grab handle + Anton title, a scrollable
 * body and an optional sticky footer for the primary action. Locks body
 * scroll while open, closes on scrim tap or Escape. Portalled to <body> so it
 * always sits above sticky bars. Hidden on lg+ (desktop keeps the sidebar).
 */
export function NightDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] lg:hidden ${open ? '' : 'pointer-events-none'}`}
    >
      {/* scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-night ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[14px] border-t border-pitchline bg-pitch-900 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-night ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* grab handle */}
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-chalk-400/30" />
        </div>

        {/* header */}
        <div className="flex items-start justify-between border-b border-pitchline/60 px-5 pb-4 pt-3">
          <div>
            {subtitle && <p className="nm-overline mb-1 text-flood-500">{subtitle}</p>}
            <h2 className="font-display text-2xl uppercase leading-none tracking-tight text-chalk-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-[4px] p-1.5 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:hidden">
          {children}
        </div>

        {/* sticky footer */}
        {footer && (
          <div className="border-t border-pitchline bg-pitch-900 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
