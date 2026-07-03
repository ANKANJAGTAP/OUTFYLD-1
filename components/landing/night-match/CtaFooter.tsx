import Link from 'next/link';
import { MapPin, Mail, Phone, Instagram, Facebook, Twitter, ArrowUpRight } from 'lucide-react';
import { PitchDivider } from './PitchDivider';
import { Reveal } from './Reveal';

/**
 * Closing CTA + Night Match footer.
 * Full-bleed CTA on the elevated pitch, then the footer with a final bold
 * 4° pitch-line, real contact details, and an oversized OUTFYLD signature.
 */
export function CtaFooter() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* ── Closing CTA ── */}
      <section className="nm-grain relative z-[2] overflow-hidden bg-pitch-800/[0.93] text-chalk-100">
        <PitchDivider flag="right" />
        {/* faint floodlight bloom top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(40% 45% at 82% 4%, rgba(200,241,53,0.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 sm:px-10 lg:px-16 lg:py-36">
          <Reveal>
          <p className="nm-overline mb-6 text-flood-500">Kickoff</p>
          <h2 className="nm-display-xl max-w-4xl">Get on the pitch</h2>
          <p className="nm-body-l mt-7 max-w-xl text-chalk-400">
            Floodlit turfs, real-time slots, instant confirmation. Your next game is a
            couple of taps away.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/browse"
              className="nm-overline nm-flood-glow bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.03]"
            >
              Find a pitch
            </Link>
            <Link
              href="/auth/register"
              className="nm-overline inline-flex items-center gap-2 border border-chalk-400/30 px-8 py-4 text-chalk-100 transition-colors duration-300 ease-night hover:border-flood-500 hover:text-flood-500"
            >
              List your turf
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-[2] overflow-hidden bg-pitch-900/[0.94] text-chalk-100">
        <PitchDivider flag="left" />

        <div className="relative mx-auto max-w-[1400px] px-6 pt-16 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <p className="font-display text-3xl uppercase tracking-tight text-chalk-100">
                OutFyld
              </p>
              <p className="nm-caption mt-4 max-w-[28ch] text-chalk-400">
                India&apos;s floodlit turf-booking platform. Making sport more accessible,
                one pitch at a time.
              </p>
              <div className="mt-6 flex gap-4">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <Link
                    key={i}
                    href="#"
                    className="text-chalk-400 transition-colors duration-300 ease-night hover:text-flood-500"
                    aria-label="Social link"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <nav>
              <p className="nm-overline mb-5 text-chalk-400">Explore</p>
              <ul className="space-y-3">
                {[
                  ['Browse arenas', '/browse'],
                  ['About', '/about'],
                  ['Contact', '/contact'],
                  ['Careers', '/careers'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-chalk-100/80 transition-colors duration-300 ease-night hover:text-flood-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Business */}
            <nav>
              <p className="nm-overline mb-5 text-chalk-400">For owners</p>
              <ul className="space-y-3">
                {[
                  ['List your turf', '/auth/register'],
                  ['Owner dashboard', '/owner/dashboard'],
                  ['Become a partner', '/auth/register'],
                  ['Business support', '/contact'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-chalk-100/80 transition-colors duration-300 ease-night hover:text-flood-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div>
              <p className="nm-overline mb-5 text-chalk-400">Get in touch</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-chalk-100/80">
                  <MapPin className="h-4 w-4 shrink-0 text-flood-500" />
                  Sangli-Miraj, Maharashtra
                </li>
                <li>
                  <a
                    href="tel:+917058526196"
                    className="flex items-center gap-3 font-mono text-sm text-chalk-100/80 transition-colors duration-300 ease-night hover:text-flood-500"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-flood-500" />
                    +91 70585 26196
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:admin@outfyld.in"
                    className="flex items-center gap-3 text-sm text-chalk-100/80 transition-colors duration-300 ease-night hover:text-flood-500"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-flood-500" />
                    admin@outfyld.in
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-pitchline py-8 sm:flex-row sm:items-center">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-chalk-400">
              © {year} OutFyld · All rights reserved
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                ['Privacy', '/about'],
                ['Terms', '/careers/terms-and-conditions'],
                ['Refunds', '/contact'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-xs uppercase tracking-[0.16em] text-chalk-400 transition-colors duration-300 ease-night hover:text-flood-500"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* oversized signature wordmark — bleeds off the bottom edge */}
        <div
          aria-hidden
          className="pointer-events-none select-none overflow-hidden"
        >
          <p className="translate-y-[22%] text-center font-display text-[24vw] leading-none tracking-tight text-chalk-100/[0.04]">
            OUTFYLD
          </p>
        </div>
      </footer>
    </>
  );
}
