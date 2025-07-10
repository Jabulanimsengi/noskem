import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

// Define the type for a single service provider, including category name
export type ServiceProviderForCard = {
  id: number;
  business_name: string;
  service_areas: string;
  photos: any;
  contact_details: { phone?: string; email?: string };
  service_categories: { name: string } | null;
}

interface ServiceProviderCardProps {
  provider: ServiceProviderForCard;
}

export default function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const imageUrl = Array.isArray(provider.photos) && provider.photos.length > 0
    ? provider.photos[0]
    : provider.photos || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Link href={`/services/${provider.id}`} className="block group">
      <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={provider.business_name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          {provider.service_categories?.name && (
            <span className="text-xs font-semibold text-brand mb-1">
              {provider.service_categories.name}
            </span>
          )}
          {/* Corrected: Removed truncate class to allow wrapping if needed */}
          <h3 className="font-bold text-lg text-gray-900  group-hover:text-brand">
            {provider.business_name}
          </h3>
          <div className="flex items-start text-sm text-gray-500 mt-2">
            <MapPin size={14} className="mr-1.5 flex-shrink-0 mt-0.5" />
            {/* Corrected: Removed truncate class to allow wrapping */}
            <p>{provider.service_areas}</p>
          </div>
          <div className="flex-grow" />
        </div>
      </div>
    </Link>
  )
}