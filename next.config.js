/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    // This allows SVGs from the approved domains, which placehold.co uses.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      // FIX: Added the missing hostname for placeholder images
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Your existing entry for Supabase storage
      {
        protocol: 'https',
        hostname: 'ilebmpqpassdoczlkawm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Your existing entry for the ui-avatars service
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

// This block can remain as it is.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
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