'use client';

import Link from 'next/link';
import Image from 'next/image';

export type Item = {
  id: number;
  title: string;
  buy_now_price: number | null;
  // This could be string[], string, or null, we'll handle all cases
  images: string[] | string | null;
};

export default function ItemCard({ item }: { item: Item }) {
  let finalImageUrl = 'https://placehold.co/600x400/27272a/9ca3af?text=No+Image';
  
  let imagesArray = item.images;

  // This block robustly handles the images property.
  // If it's a string from the database, it tries to parse it.
  if (typeof imagesArray === 'string') {
    try {
      imagesArray = JSON.parse(imagesArray);
    } catch (e) {
      console.error("Failed to parse images JSON string:", e);
      imagesArray = []; // On error, reset to an empty array
    }
  }

  // Now, we check if we have a valid array with at least one URL.
  if (Array.isArray(imagesArray) && imagesArray.length > 0) {
    if (typeof imagesArray[0] === 'string') {
      finalImageUrl = imagesArray[0];
    }
  }

  return (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-lg shadow-lg group-hover:border-indigo-500 transition-colors duration-200">
        <div className="relative w-full h-48">
          <Image
            src={finalImageUrl}
            alt={item.title}
            fill={true}
            style={{ objectFit: "cover" }}
            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/600x400/27272a/9ca3af?text=Image+Error';
            }}
            unoptimized
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white truncate">{item.title}</h3>
          <p className="mt-2 text-xl font-bold text-indigo-400">
            {item.buy_now_price ? `R${item.buy_now_price.toFixed(2)}` : 'Bidding available'}
          </p>
        </div>
      </div>
    </Link>
  );
}