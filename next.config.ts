import type { NextConfig } from 'next';

// Define the base configuration object first.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Rule for ui-avatars.com (for placeholder images)
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      // Rule for placehold.co (for placeholder images)
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // The serverActions configuration to allow larger image uploads.
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

// Now, conditionally add the Supabase pattern if the environment variable exists.
// This is a more direct way to modify the configuration that avoids type errors.
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
    .replace('https://', '')
    .split('/')[0];

  // The '!' tells TypeScript that we are certain 'images' and 'remotePatterns' exist here.
  nextConfig.images!.remotePatterns!.push({
    protocol: 'https',
    hostname: supabaseHostname,
    port: '',
    pathname: '/storage/v1/object/public/**',
  });
}

export default nextConfig;