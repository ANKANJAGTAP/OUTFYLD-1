'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowUpRight, MapPin } from 'lucide-react';
import { PitchDivider } from './PitchDivider';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';
import { deferIdle } from './deferIdle';

interface Turf {
  _id: string;
  name: string;
  bannerImage?: string;
  featuredImage?: string;
  images?: { url: string }[];
  location?: { city?: string };
  sportsOffered?: string[];
  rating?: number;
  pricing?: number;
}

function turfImage(t?: Turf): string | null {
  let url = t?.bannerImage || t?.featuredImage || t?.images?.[0]?.url;
  if (!url) return null;
  if (url.includes('cloudinary.com')) {
    url = url.replace(/\/upload\/(?:[a-zA-Z0-9_,]+\/)?/, '/upload/q_auto,w_1200,f_auto,c_fill/');
  }
  return url;
}

function TurfRow({ turf, index, flip }: { turf?: Turf; index: number; flip: boolean }) {
  const row = useRef<HTMLDivElement>(null);
  const img = turfImage(turf);
  const label = String(index + 1).padStart(2, '0');

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const wipe = el.querySelector('.nm-wipe');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      if (reduce) {
        gsap.set(wipe, { xPercent: 110 });
        return;
      }
      gsap.registerPlugin(ScrollTrigger);
      const rise = el.querySelectorAll('.nm-rise');
      const imgLayer = el.querySelector('.nm-img-parallax');
      ctx = gsap.context(() => {
        // Continuous choreography → scrub-bound: the 4° wipe draws open on
        // the way down and closes again on the way back up, meta rises/falls.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'top 32%', scrub: 0.8 },
        });
        tl.fromTo(
          wipe,
          { xPercent: 0, skewX: -4 },
          { xPercent: 110, duration: 0.9, ease: 'none' }
        ).fromTo(
          rise,
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: 'none' },
          '-=0.5'
        );

        // Scroll-LINKED horizontal parallax on the image itself: it enters
        // from the row's side (left-column rows from the left, right-column
        // rows from the right) and keeps drifting across the whole time the
        // row is on screen — position bound 1:1 to the scrollbar.
        gsap.fromTo(
          imgLayer,
          { xPercent: flip ? 11 : -11 },
          {
            xPercent: flip ? -7 : 7,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  const media = (
    <div className={`relative lg:col-span-7 ${flip ? 'lg:col-start-6' : 'lg:col-start-1'}`}>
      <div className="nm-turf-media relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
        {/* parallax image layer — scroll-linked horizontal slide (from the row's
            side). Scaled up so the travel never reveals a container edge. */}
        <div className="nm-img-parallax absolute inset-0 will-change-transform">
          {img ? (
            <Image
              src={img}
              alt={turf?.name || 'Featured turf'}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="scale-[1.28] object-cover object-center"
            />
          ) : (
            // Night Match placeholder — floodlit pitch texture
            <div className="absolute inset-0 scale-[1.28] bg-[radial-gradient(120%_90%_at_75%_-10%,#16241d_0%,#0b1310_45%,#080b0a_80%)]">
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(97deg, transparent 0 70px, rgba(243,247,241,0.9) 70px 72px)',
                }}
              />
            </div>
          )}
        </div>
        {/* bottom scrim for name legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-900/85 via-pitch-900/10 to-transparent" />
        {/* 4° wipe reveal overlay */}
        <div className="nm-wipe absolute inset-[-10%] z-10 origin-left bg-pitch-900">
          <div className="absolute right-0 top-0 h-full w-1 bg-flood-500/70" />
        </div>
        {/* oversized name breaking onto the image */}
        <h3 className="nm-rise absolute bottom-4 left-4 right-4 z-20 font-display text-4xl uppercase leading-[0.9] tracking-tight text-chalk-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:bottom-6 sm:left-6 sm:text-6xl">
          {turf?.name || 'More turfs going live'}
        </h3>
      </div>
    </div>
  );

  const meta = (
    <div
      className={`flex flex-col justify-center lg:col-span-4 ${
        flip ? 'lg:col-start-1 lg:row-start-1 lg:pr-4' : 'lg:col-start-9 lg:pl-4'
      }`}
    >
      <span className="nm-rise font-mono text-xl text-flood-500">{label}</span>

      {turf?.location?.city && (
        <p className="nm-rise mt-4 flex items-center gap-1.5 nm-caption uppercase tracking-[0.14em] text-chalk-400">
          <MapPin className="h-3.5 w-3.5" />
          {turf.location.city}
        </p>
      )}

      {turf?.sportsOffered && turf.sportsOffered.length > 0 && (
        <div className="nm-rise mt-5 flex flex-wrap gap-2">
          {turf.sportsOffered.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="border border-pitchline px-3 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-chalk-400"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="nm-rise mt-7 flex items-end gap-7">
        {typeof turf?.rating === 'number' && turf.rating > 0 && (
          <div>
            <div className="flex items-center gap-1.5 font-mono text-3xl text-chalk-100">
              <Star className="h-5 w-5 fill-flood-500 text-flood-500" />
              <CountUp value={turf.rating} decimals={1} />
            </div>
            <p className="nm-caption mt-1 uppercase tracking-[0.14em] text-chalk-400">Rating</p>
          </div>
        )}
        {typeof turf?.pricing === 'number' && turf.pricing > 0 && (
          <div>
            <div className="font-mono text-3xl text-chalk-100">
              <span className="text-chalk-400">₹</span>
              <CountUp value={turf.pricing} />
            </div>
            <p className="nm-caption mt-1 uppercase tracking-[0.14em] text-chalk-400">Per hour</p>
          </div>
        )}
      </div>

      {turf?._id ? (
        <Link
          href={`/book/${turf._id}`}
          className="nm-rise group/btn mt-9 inline-flex w-fit items-center gap-2 border-b border-flood-500/40 pb-1 nm-overline text-flood-500 transition-colors duration-300 ease-night hover:border-flood-500"
        >
          Book this pitch
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-night group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      ) : (
        <span className="nm-rise mt-9 nm-overline text-chalk-400">Coming soon</span>
      )}
    </div>
  );

  return (
    <div
      ref={row}
      className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10"
    >
      {media}
      {meta}
    </div>
  );
}

export function EditorialTurfs({ turfs }: { turfs: Turf[] }) {
  // Always render 4 slots; missing turfs become Night Match placeholders
  const slots: (Turf | undefined)[] = Array.from({ length: 4 }, (_, i) => turfs[i]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // A single lime connector that threads the 4 images side to side: it runs
  // down the inner edge of each turf, then jumps diagonally across the gap to
  // the next turf (which sits on the opposite side). The whole path DRAWS
  // itself as you scroll down and RETRACTS as you scroll up — scrubbed 1:1.
  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!wrap || !svg || !path) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Rebuild the path `d` from live image positions; returns its total length.
    const build = (): number => {
      // Only meaningful on lg+, where images actually alternate left/right.
      if (window.innerWidth < 1024) return 0;
      const cr = wrap.getBoundingClientRect();
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      const medias = Array.from(wrap.querySelectorAll<HTMLElement>('.nm-turf-media'));
      if (medias.length < 2 || W === 0) return 0;

      const pts = medias.map((m) => {
        const r = m.getBoundingClientRect();
        const x = r.left - cr.left;
        const y = r.top - cr.top;
        // inner edge = the side facing the page centre (right edge for a
        // left-column image, left edge for a right-column image)
        const innerX = x + r.width / 2 < W / 2 ? x + r.width : x;
        return { x: innerX, top: y, bottom: y + r.height };
      });

      let d = `M ${pts[0].x.toFixed(1)} 0`;
      for (const p of pts) {
        d += ` L ${p.x.toFixed(1)} ${p.top.toFixed(1)} L ${p.x.toFixed(1)} ${p.bottom.toFixed(1)}`;
      }
      d += ` L ${pts[pts.length - 1].x.toFixed(1)} ${H.toFixed(1)}`;

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      path.setAttribute('d', d);
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = reduce ? '0' : String(len);
      return len;
    };

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    let onResize: (() => void) | undefined;

    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      const len0 = build();
      if (reduce || !len0) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          path,
          { strokeDashoffset: () => path.getTotalLength() },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top 78%',
              end: 'bottom 88%',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          }
        );
      });
      onResize = () => {
        build();
        ScrollTrigger.refresh();
      };
      window.addEventListener('resize', onResize);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      if (onResize) window.removeEventListener('resize', onResize);
      ctx?.revert();
    };
  }, []);

  return (
    <section className="relative z-[2] bg-pitch-900/[0.92] text-chalk-100">
      <PitchDivider flag="right" />

      <div className="mx-auto max-w-[1400px] px-6 pb-28 pt-8 sm:px-10 lg:px-16">
        <Reveal className="mb-16 max-w-2xl">
          <p className="nm-overline mb-5 text-flood-500">Featured turfs</p>
          <h2 className="nm-display-l">Floodlit &amp; ready</h2>
        </Reveal>

        <div ref={wrapRef} className="relative flex flex-col gap-20 lg:gap-28">
          {/* scroll-drawn zig-zag connector threading the images side to side */}
          <svg
            ref={svgRef}
            aria-hidden
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-[5] hidden h-full w-full overflow-visible lg:block"
          >
            <path
              ref={pathRef}
              d=""
              fill="none"
              stroke="#C8F135"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 7px rgba(200,241,53,0.5))' }}
            />
          </svg>

          {slots.map((t, i) => (
            <TurfRow key={t?._id || `slot-${i}`} turf={t} index={i} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
