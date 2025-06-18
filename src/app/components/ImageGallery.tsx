'use client';

import { useState } from 'react';
import Image from 'next/image';

// Define the props the component will accept
interface ImageGalleryProps {
  images: string[] | null;
  itemTitle: string;
}

export default function ImageGallery({ images, itemTitle }: ImageGalleryProps) {
  // Use a placeholder if the images array is null or empty
  const placeholderImage = 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';
  const imageList = (Array.isArray(images) && images.length > 0) ? images : [placeholderImage];

  // State to keep track of the currently selected main image
  const [mainImage, setMainImage] = useState(imageList[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-800">
        <Image
          src={mainImage}
          alt={`Main image for ${itemTitle}`}
          fill={true}
          style={{ objectFit: 'contain' }} // 'contain' works well for product shots
          className="transition-opacity duration-300 ease-in-out"
          onError={() => {
            // If the main image fails, fall back to the placeholder
            setMainImage(placeholderImage);
          }}
          unoptimized // Keeping this for now to avoid config issues
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {imageList.map((img, index) => (
          <div
            key={index}
            className={`relative flex-shrink-0 w-20 h-20 rounded-md cursor-pointer overflow-hidden border-2 transition-colors ${
              mainImage === img ? 'border-indigo-500' : 'border-transparent'
            }`}
            onClick={() => setMainImage(img)}
          >
            <Image
              src={img}
              alt={`Thumbnail ${index + 1} for ${itemTitle}`}
              fill={true}
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                // If a thumbnail fails, hide it or show a placeholder
                e.currentTarget.style.display = 'none';
              }}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}
