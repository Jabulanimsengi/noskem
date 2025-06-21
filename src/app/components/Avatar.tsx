'use client';

import Image from 'next/image';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
}

export default function Avatar({ src, alt, size = 40 }: AvatarProps) {
  const placeholder = `https://placehold.co/${size}x${size}/0891B2/ffffff.png?text=${alt.charAt(0).toUpperCase()}`;
  const imageUrl = src || placeholder;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
      // The 'unoptimized' prop is now removed
    />
  );
}