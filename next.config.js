/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['res.cloudinary.com'], // Add domains for external images if needed
  },
  // Ensure dynamic routes work properly
  trailingSlash: false,
  skipTrailingSlashRedirect: false,
};

module.exports = nextConfig;
