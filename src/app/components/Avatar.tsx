/**
 * CODE REVIEW UPDATE
 * ------------------
 * This file has been updated based on the AI code review.
 *
 * Change Made:
 * - Suggestion #24 (Performance): Removed the `unoptimized` prop. This allows
 * Next.js to automatically optimize avatar images (resizing, WebP format),
 * improving performance. Requires `next.config.js` to be configured for the
 * Supabase Storage domain.
 */
'use client';

import Image from 'next/image';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
}

export default function Avatar({ src, alt, size = 40 }: AvatarProps) {
  const placeholder = `https://ui-avatars.com/api/?name=${alt.charAt(0).toUpperCase()}&background=0891B2&color=fff&size=${size}`;
  const imageUrl = src || placeholder;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
      // The 'unoptimized' prop has been removed to enable optimization
    />
  );
}