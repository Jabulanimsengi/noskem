// src/app/components/Avatar.tsx
import Image from 'next/image';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
}

export default function Avatar({ src, alt, size = 48 }: AvatarProps) {
  const placeholderText = alt?.charAt(0).toUpperCase() || 'U';
  const placeholderUrl = `https://placehold.co/${size}x${size}/0891B2/ffffff.png?text=${placeholderText}`;
  
  const finalSrc = src || placeholderUrl;

  return (
    <div className="relative rounded-full overflow-hidden" style={{ width: size, height: size }}>
      <Image
        src={finalSrc}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}