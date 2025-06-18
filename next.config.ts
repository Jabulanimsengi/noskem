/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Use the new URL() syntax for your Supabase hostname
      new URL('https://llebmpqpassdoczlkawm.supabase.co/storage/v1/object/public/item-images/**'),
      
      // Also add the placeholder hostname using the new syntax
      new URL('https://placehold.co/**'),
    ],
  },
};

export default nextConfig;