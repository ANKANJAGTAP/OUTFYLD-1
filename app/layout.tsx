import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Anton, Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import RoleRedirect from '@/components/RoleRedirect';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

// Night Match type system — condensed sports display (Anton) + engineered grotesk UI (Geist) + tabular numerics (Geist Mono).
// Only the primary UI font (Geist) is preloaded; the display/mono faces render via `swap`
// (fallback first) so they don't compete for critical-path bandwidth and delay FCP/LCP.
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false });
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap', preload: false });

// themeColor belongs in the viewport export (Next 15) — keeping it in metadata
// emits an "Unsupported metadata themeColor" warning for every route.
export const viewport: Viewport = {
  themeColor: '#080B0A',
};

export const metadata: Metadata = {
  title: 'OutFyld - Sports Arena Booking Platform',
  description: 'Book sports arenas instantly. Find cricket, football, and other sports facilities with real-time availability and secure payments.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OutFyld',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="23a9e6cb-5216-4b0c-8d63-a8afb68f1127"></script>
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${anton.variable} font-sans`}>
        <AuthProvider>
          <LocationProvider>
            <RoleRedirect>
              {children}
            </RoleRedirect>
            <Toaster position="top-right" richColors closeButton />
          </LocationProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}