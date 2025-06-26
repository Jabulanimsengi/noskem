/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // FIX: Add this line to enable production source maps
  productionBrowserSourceMaps: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  nextConfig.images.remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
    port: '',
    pathname: '/storage/v1/object/public/**',
  });
}

module.exports = withBundleAnalyzer(nextConfig);