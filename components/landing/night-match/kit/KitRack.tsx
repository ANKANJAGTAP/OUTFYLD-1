'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { SportRackItem } from '@/lib/turfs';
import { PitchDivider } from '../PitchDivider';
import { Reveal } from '../Reveal';
import { SceneBoundary } from '../SceneBoundary';
import { deferIdle } from '../deferIdle';

// Canvas chunk loads only when the section approaches the viewport — zero LCP cost.
const KitRackScene = dynamic(() => import('./KitRackScene'), { ssr: false });

/**
 * Kit rack section — between ticket-stubs and the editorial turfs.
 * SSR/no-WebGL/no-JS fallback: a plain DOM row with the same real data and
 * working links. Once near the viewport, the 3D rack mounts over it.
 */
export function KitRack({ items }: { items: SportRackItem[] }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false); // mount canvas when approaching
  const [visible, setVisible] = useState(true); // pause frameloop off-screen
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduce, setReduce] = useState(false);
  const scrub = useRef(0.5);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = root.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(
      ([e]) => e.isIntersecting && setNear(true),
      { rootMargin: '600px 0px' }
    );
    const visIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0,
    });
    nearIO.observe(el);
    visIO.observe(el);
    return () => {
      nearIO.disconnect();
      visIO.disconnect();
    };
  }, []);

  // parade-rotation scrub (bidirectional), consumed by the scene via ref
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            scrub.current = self.progress;
          },
        });
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  const show3D = near && !failed;

  return (
    <section ref={root} className="relative z-[2] bg-pitch-900/[0.92] text-chalk-100">
      <PitchDivider flag="right" />

      <div className="mx-auto max-w-[1400px] px-6 pb-28 pt-8 sm:px-10 lg:px-16">
        <Reveal className="mb-12 max-w-2xl">
          <p className="nm-overline mb-5 text-flood-500">Pick your game</p>
          <h2 className="nm-display-l">The kit rack</h2>
          <p className="nm-caption mt-4 max-w-md text-chalk-400">
            {`Hover a piece of kit — it carries the live numbers. Click through to book.`}
          </p>
        </Reveal>

        <div data-testid="kit-rack" className="relative">
          {/* DOM fallback — same real data, always SSR'd, works without JS/WebGL */}
          <div
            className={`grid gap-4 sm:grid-cols-3 ${
              show3D && ready ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0' : ''
            } transition-opacity duration-500 ease-night`}
          >
            {items.map((it) => (
              <Link
                key={it.sport}
                href={`/browse?sport=${encodeURIComponent(it.sport)}`}
                className="group border border-pitchline bg-pitch-700/90 px-6 py-6 transition-colors duration-300 ease-night hover:border-flood-500/50"
              >
                <span className="block font-display text-3xl uppercase tracking-tight text-chalk-100">
                  {it.sport}
                </span>
                <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-[0.18em] text-chalk-400">
                  {it.count > 0
                    ? `${it.count} ${it.count === 1 ? 'turf' : 'turfs'}${
                        it.fromPrice ? ` — from ₹${it.fromPrice}/hr` : ''
                      }`
                    : 'Coming soon'}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-flood-500">
                  View turfs
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-night group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* 3D rack */}
          {show3D && (
            <div
              ref={stage}
              className="h-[420px] transition-opacity duration-700 ease-night sm:h-[470px] lg:h-[540px]"
              style={{ opacity: ready ? 1 : 0 }}
            >
              <SceneBoundary onError={() => setFailed(true)}>
                <KitRackScene
                  items={items}
                  scrub={scrub}
                  frameloop={visible ? 'always' : 'never'}
                  reduce={reduce}
                  onReady={() => setReady(true)}
                />
              </SceneBoundary>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
