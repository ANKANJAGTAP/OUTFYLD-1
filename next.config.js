const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  // After a deploy, a browser that still holds the previous build's service
  // worker was serving the OLD cached app shell on the first load (e.g. the
  // light-theme header) until the user navigated. skipWaiting + clientsClaim
  // make a freshly-installed worker activate and take control of open pages
  // immediately; reloadOnOnline refreshes once connectivity returns so stale
  // chunks never linger.
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // Ensure dynamic routes work properly
  trailingSlash: false,
  skipTrailingSlashRedirect: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
