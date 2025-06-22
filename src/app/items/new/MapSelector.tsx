'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { type LatLngExpression, type Map as LeafletMap } from 'leaflet';

// Manually import and set the default Leaflet icons
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: LatLngExpression;
}

const DEFAULT_POSITION: LatLngExpression = [-29.0, 24.0];

export default function MapSelector({ onLocationSelect, initialPosition }: MapSelectorProps) {
  const [position, setPosition] = useState<LatLngExpression>(initialPosition || DEFAULT_POSITION);
  const mapRef = useRef<LeafletMap>(null);

  // FIX: The useEffect for icon configuration has been moved inside the component.
  useEffect(() => {
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src,
      iconUrl: iconUrl.src,
      shadowUrl: shadowUrl.src,
    });
  }, []);

  useEffect(() => {
    if (initialPosition && mapRef.current) {
      mapRef.current.flyTo(initialPosition, 13);
    }
  }, [initialPosition]);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
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