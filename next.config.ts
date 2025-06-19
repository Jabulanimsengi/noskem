import type { NextConfig } from 'next'

// Get the hostname of your Supabase instance from environment variables
// This makes the configuration dynamic and secure.
const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const config: NextConfig = {
  images: {
    remotePatterns: [
      // Allow images from the placeholder service
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Allow images from your Supabase storage bucket
      {
        protocol: 'https',
        hostname: supabaseHostname,
      },
    ],
  },
}

export default config