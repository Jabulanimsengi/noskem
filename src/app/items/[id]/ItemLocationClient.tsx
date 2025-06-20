'use client';

import dynamic from 'next/dynamic';
import { FaMapMarkerAlt } from 'react-icons/fa';

// This dynamically imports the map, but inside a Client Component where it's allowed.
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center"><p>Loading map...</p></div>
});

interface ItemLocationClientProps {
  lat: number;
  lng: number;
}

export default function ItemLocationClient({ lat, lng }: ItemLocationClientProps) {
  return (
    <div className="bg-surface rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2">
        <FaMapMarkerAlt className="text-gray-400"/>
        <h2 className="text-xl font-bold text-text-primary">Item Location</h2>
      </div>
      <LocationMap lat={lat} lng={lng} />
    </div>
  );
}