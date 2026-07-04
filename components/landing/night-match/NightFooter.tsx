import Link from 'next/link';
import { MapPin, Mail, Phone, Instagram, Facebook, Twitter } from 'lucide-react';
import { PitchDivider } from './PitchDivider';

/**
 * NightFooter — the single Night Match footer shared by every page.
 * Final 4° pitch-line, brand + socials, Explore / For owners / Get in touch
 * columns, legal bar, and the oversized OUTFYLD signature bleeding off the
 * bottom edge. Uses global tokens (not the `.night` scope) so it renders
 * correctly on any page. Solid pitch-900 so it sits cleanly on any surface.
 */
export function NightFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[2] overflow-hidden bg-pitch-900 text-chalk-100">
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

          {/* Explore */}
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

          {/* For owners */}
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

          {/* Get in touch */}
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
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="translate-y-[22%] text-center font-display text-[24vw] leading-none tracking-tight text-chalk-100/[0.04]">
          OUTFYLD
        </p>
      </div>
    </footer>
  );
}
