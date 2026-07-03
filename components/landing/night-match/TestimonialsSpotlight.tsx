'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { PitchDivider } from './PitchDivider';

// Reused copy from the previous TestimonialsSection (real community quotes)
const QUOTES = [
  {
    content:
      'OutFyld has completely changed how we book cricket grounds. No more calling multiple places — everything is available at one click.',
    name: 'Rahul Patil',
    role: 'Cricket enthusiast',
    location: 'Sangli',
  },
  {
    content:
      'As a working professional, I love booking arenas online. The payment is secure and the notifications keep me updated the whole way.',
    name: 'Priya Deshmukh',
    role: 'Football player',
    location: 'Miraj',
  },
  {
    content:
      'Managing bookings was a nightmare before OutFyld. Now everything is automated and I can focus on the quality of the pitch.',
    name: 'Sunil Kadam',
    role: 'Arena owner',
    location: 'Sangli',
  },
];

export function TestimonialsSpotlight() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const quotes = Array.from(el.querySelectorAll<HTMLElement>('.nm-quote'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      quotes.forEach((q) => q.setAttribute('data-active', 'true'));
      return;
    }

    // Spotlight follows whichever quote is nearest the viewport centre
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          e.target.setAttribute('data-active', e.isIntersecting ? 'true' : 'false')
        );
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    quotes.forEach((q) => io.observe(q));
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative z-[2] overflow-hidden bg-pitch-900/[0.92] text-chalk-100">
      <PitchDivider flag="left" />

      <div ref={root} className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-16">
        <p className="nm-overline mb-4 pt-8 text-flood-500">From the sideline</p>

        {QUOTES.map((q, i) => (
          <blockquote
            key={i}
            data-active="false"
            className="nm-quote group relative flex min-h-[62vh] flex-col justify-center py-10 transition-opacity duration-500 ease-night data-[active=false]:opacity-25 data-[active=true]:opacity-100"
          >
            {/* moving floodlight — fades in when this quote is active */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-700 ease-night group-data-[active=true]:opacity-100"
              style={{
                background:
                  'radial-gradient(45% 55% at 34% 46%, rgba(226,240,214,0.14) 0%, rgba(200,241,53,0.10) 32%, transparent 68%)',
              }}
            />

            <span className="relative font-display text-7xl leading-none text-flood-500/30 sm:text-8xl">
              &ldquo;
            </span>

            <p className="relative -mt-6 max-w-4xl font-sans text-[clamp(1.6rem,3.4vw,3rem)] font-medium leading-[1.15] tracking-tight text-chalk-100">
              {q.content}
            </p>

            <footer className="relative mt-10 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                {q.name}
              </span>
              <span className="nm-overline text-chalk-400">{q.role}</span>
              <span className="flex items-center gap-1 nm-caption uppercase tracking-[0.14em] text-flood-500">
                <MapPin className="h-3.5 w-3.5" />
                {q.location}
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
