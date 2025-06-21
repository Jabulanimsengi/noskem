'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLngExpression, Map as LeafletMap, LatLng } from 'leaflet';

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: LatLngExpression;
}

const DEFAULT_POSITION: LatLngExpression = [-29.0, 24.0]; // Centered on South Africa

export default function MapSelector({ onLocationSelect, initialPosition }: MapSelectorProps) {
  const [position, setPosition] = useState<LatLngExpression>(initialPosition || DEFAULT_POSITION);
  const mapRef = useRef<LeafletMap>(null);

  useEffect(() => {
    // When an initial position is provided, fly to it
    if (initialPosition && mapRef.current) {
      mapRef.current.flyTo(initialPosition, 13);
    }
  }, [initialPosition]);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        // FIX: Removed unnecessary and confusing type assertion.
        setPosition(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div className="rounded-lg overflow-hidden h-72 border">
      <MapContainer
        center={position}
        zoom={initialPosition ? 13 : 5}
        ref={mapRef}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
        <MapEvents />
      </MapContainer>
    </div>
  );
}