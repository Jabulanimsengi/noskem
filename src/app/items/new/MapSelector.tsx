'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLngExpression, Map as LeafletMap, LatLng } from 'leaflet';

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

const DEFAULT_POSITION: LatLngExpression = [-29.0, 24.0];

function LocationFinder({ setPosition }: { setPosition: (pos: LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

export default function MapSelector({ onLocationSelect }: MapSelectorProps) {
  const [position, setPosition] = useState<LatLngExpression>(DEFAULT_POSITION);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const userPos: LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        setPosition(userPos);
        if (map) {
          map.flyTo(userPos, 13);
        }
      });
    }
  }, [map]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          // @ts-ignore
          setPosition(marker.getLatLng());
        }
      },
    }),
    [],
  );

  // --- FIX IS HERE ---
  // This useEffect now correctly handles both array and object formats for the position,
  // preventing 'undefined' values from being passed up to the parent form.
  useEffect(() => {
    let lat: number;
    let lng: number;

    if (Array.isArray(position)) {
      [lat, lng] = position;
    } else {
      lat = position.lat;
      lng = position.lng;
    }

    if (typeof lat === 'number' && typeof lng === 'number') {
      onLocationSelect(lat, lng);
    }
  }, [position, onLocationSelect]);

  return (
    <div className="rounded-lg overflow-hidden h-72">
      <MapContainer center={DEFAULT_POSITION} zoom={5} ref={setMap} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={position}
          ref={markerRef}
        />
        <LocationFinder setPosition={setPosition as (pos: LatLng) => void} />
      </MapContainer>
    </div>
  );
}