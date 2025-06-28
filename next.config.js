/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
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
  try {
    const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    if (!nextConfig.images.remotePatterns) {
      nextConfig.images.remotePatterns = [];
    }
    nextConfig.images.remotePatterns.push({
      protocol: 'https',
      hostname: supabaseHostname,
      port: '',
      pathname: '/storage/v1/object/public/**',
    });
  } catch (error) {
    console.error("Error parsing NEXT_PUBLIC_SUPABASE_URL:", error);
  }
}

module.exports = withBundleAnalyzer(nextConfig);