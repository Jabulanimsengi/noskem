/** @type {import('next').NextConfig} */

// This block safely extracts the hostname from the Supabase URL using string manipulation.
// This avoids issues with code editor linters that may not recognize Node.js globals.
let supabaseHostname = '';
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
    .replace('https://', '')
    .split('/')[0];
} else {
  // A fallback to prevent build errors if the env var is not set during build time.
  console.warn("WARNING: NEXT_PUBLIC_SUPABASE_URL is not set. Image optimization for Supabase storage will not be configured.");
}

const nextConfig = {
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
      // Conditionally add the Supabase rule only if the hostname was found.
      ...(supabaseHostname ? [{
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      }] : []),
    ],
  },
};

module.exports = nextConfig;