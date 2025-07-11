// src/app/items/[id]/ItemDetails.tsx
import Image from 'next/image';
import Link from 'next/link';
import { type Item, type Profile, type Category } from '@/types'; // Import Category type
import Avatar from '@/app/components/Avatar';
import { FaMapMarkerAlt, FaTag } from 'react-icons/fa';
import ImageGallery from '@/app/components/ImageGallery';

// FIX: Update the props interface to include the nested 'categories' object
interface ItemDetailsProps {
  item: Item & {
    profiles: Profile | null;
    categories: Category | null; // This tells TypeScript to expect the categories object
  };
}

export default function ItemDetails({ item }: ItemDetailsProps) {
  let imageSources: string[] = [];

  if (Array.isArray(item.images)) {
    imageSources = item.images
      .flat()
      .filter((img): img is string => typeof img === 'string' && img.length > 0);
  }

  if (imageSources.length === 0) {
    imageSources.push('https://placehold.co/600x400/cccccc/ffffff?text=No+Image');
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
      <div className="w-full mb-6">
        <ImageGallery images={imageSources} itemTitle={item.title} />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>

      {/* FIX: Correctly display the category name from the nested object */}
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <FaTag className="mr-2 text-brand" />
        <span>{item.categories?.name || 'Uncategorized'}</span>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <Avatar src={item.profiles?.avatar_url} alt={item.profiles?.username || 'Seller Avatar'} />
        <Link href={`/sellers/${item.profiles?.username}`} className="font-semibold text-brand hover:underline">
          {item.profiles?.username || 'Unknown Seller'}
        </Link>
      </div>

      <p className="text-lg text-gray-800 mb-6">{item.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-700">Condition:</h3>
          <p className="text-gray-600">{item.condition.replace(/_/g, ' ')}</p>
        </div>
        {item.buy_now_price && (
          <div>
            <h3 className="font-semibold text-gray-700">Price:</h3>
            <p className="text-2xl font-bold text-brand">R{item.buy_now_price.toFixed(2)}</p>
          </div>
        )}
      </div>

      {(item.location_description || item.latitude || item.longitude) && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Location:</h3>
          <div className="flex items-center text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-brand" />
            <p>{item.location_description || 'Location data available'}</p>
          </div>
        </div>
      )}
    </div>
  );
}