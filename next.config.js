/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      // Entry for your Supabase storage
      {
        protocol: 'https',
        hostname: 'ilebmpqpassdoczlkawm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // NEW: Entry for the placeholder avatar service
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

// This block dynamically adds the Supabase URL from your environment variables.
// It's good practice and can remain.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    // Check if the hostname is already in the list to avoid duplicates
    if (!nextConfig.images.remotePatterns.some(p => p.hostname === supabaseHostname)) {
        nextConfig.images.remotePatterns.push({
          protocol: 'https',
          hostname: supabaseHostname,
          port: '',
          pathname: '/storage/v1/object/public/**',
        });
    }
  } catch (error) {
    console.error("Error parsing NEXT_PUBLIC_SUPABASE_URL:", error);
  }
}

module.exports = withBundleAnalyzer(nextConfig);