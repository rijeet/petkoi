'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface PetLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  isLost?: boolean;
}

interface PetMapProps {
  locations: PetLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Custom pet icon
const createPetIcon = (type: string, isLost: boolean = false) => {
  const iconColor = isLost ? '#ef4444' : '#ec4899'; // Red for lost, pink for normal
  const iconSize = 32;

  return L.divIcon({
    className: 'custom-pet-icon',
    html: `
      <div style="
        background-color: ${iconColor};
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 18px;
          font-weight: bold;
        ">${type === 'DOG' ? '🐕' : type === 'CAT' ? '🐱' : type === 'BIRD' ? '🐦' : '🐾'}</span>
      </div>
    `,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize],
    popupAnchor: [0, -iconSize],
  });
};

// Component to handle map updates
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

export default function PetMap({
  locations,
  center = [0, 0],
  zoom = 13,
  height = '400px',
}: PetMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center from locations if not provided
  const mapCenter: [number, number] =
    locations.length > 0
      ? [
          locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
          locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
        ]
      : center;

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} zoom={zoom} />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={createPetIcon(location.type, location.isLost)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg">{location.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{location.type}</p>
                {location.isLost && (
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    Lost
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

