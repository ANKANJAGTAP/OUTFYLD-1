import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import RoleRedirect from '@/components/RoleRedirect';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OutFyld - Sports Arena Booking Platform',
  description: 'Book sports arenas instantly. Find cricket, football, and other sports facilities with real-time availability and secure payments.',
  themeColor: '#ffffff',
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
      <body className={inter.className}>
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