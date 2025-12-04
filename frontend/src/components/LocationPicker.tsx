'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { reverseGeocode, forwardGeocode, autocompleteGeocode, type GeocodeResult } from '@/lib/geocoding';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});
// Component to handle map click events and store map reference
// Must be a child of MapContainer to use react-leaflet hooks
function MapEventHandler({ 
  onMapReady, 
  onMapClick 
}: { 
  onMapReady: (map: any) => void;
  onMapClick: (e: any) => void;
}) {
  // Dynamically import hooks only when component is rendered (inside MapContainer)
  const ReactLeaflet = require('react-leaflet');
  const map = ReactLeaflet.useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  ReactLeaflet.useMapEvents({
    click: onMapClick,
  });
  
  return null;
}

// Leaflet CSS is imported in globals.css

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationChange: (location: LocationData) => void;
  autoDetect?: boolean;
  showSearch?: boolean;
  className?: string;
}

export default function LocationPicker({
  initialLocation,
  onLocationChange,
  autoDetect = true,
  showSearch = true,
  className = '',
}: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null,
  );
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [autocompleteResults, setAutocompleteResults] = useState<GeocodeResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(autoDetect);
  const [error, setError] = useState<string | null>(null);
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Leaflet icon fix on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      // Dynamically import and configure Leaflet
      import('leaflet').then((L) => {
        // Fix for default marker icon paths in Next.js
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Auto-detect location on mount (only after component is mounted on client)
  useEffect(() => {
    if (!isMounted) return; // Wait for client-side mount
    
    // If we have an initial location, use it
    if (initialLocation && !location) {
      console.log('LocationPicker - Using initial location:', initialLocation);
      setLocation(initialLocation);
      reverseGeocodeLocation(initialLocation.lat, initialLocation.lng);
      return;
    }
    
    // Otherwise, auto-detect if enabled and no location set
    if (autoDetect && !location) {
      console.log('LocationPicker - Auto-detecting location...');
      detectLocation();
    }
  }, [isMounted, autoDetect, initialLocation, location]);

  // Update parent when location changes
  useEffect(() => {
    if (location && address) {
      console.log('LocationPicker - Location changed:', { lat: location.lat, lng: location.lng, address });
      onLocationChange({
        lat: location.lat,
        lng: location.lng,
        address,
      });
    }
  }, [location, address, onLocationChange]);

  const detectLocation = () => {
    setIsDetecting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setLocation(newLocation);
        setIsAutoDetected(true);
        setIsDetecting(false);
        await reverseGeocodeLocation(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Location access denied. Please use the search or map to set your location.');
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const reverseGeocodeLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result.address);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = async (e: any) => {
    const { lat, lng } = e.latlng;
    const newLocation = { lat, lng };
    setLocation(newLocation);
    setIsAutoDetected(false);
    await reverseGeocodeLocation(lat, lng);
  };

  const handleMarkerDragEnd = async (e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newLocation = { lat: position.lat, lng: position.lng };
    setLocation(newLocation);
    setIsAutoDetected(false);
    await reverseGeocodeLocation(position.lat, position.lng);
  };

  // Autocomplete as user types (debounced)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce autocomplete requests
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await autocompleteGeocode(searchQuery);
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
      } catch (err) {
        console.error('Autocomplete error:', err);
        setAutocompleteResults([]);
      }
    }, 300); // 300ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setShowAutocomplete(false);

    try {
      // Get more results for full search (15 results)
      const results = await forwardGeocode(searchQuery, 15);
      if (results.length === 0) {
        setError('No locations found. Please try a different search.');
        setIsLoading(false);
        return;
      }

      setSearchResults(results);
      // Don't auto-select - let user choose from results
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSearchResult = async (result: GeocodeResult) => {
    setLocation({ lat: result.lat, lng: result.lng });
    setAddress(result.address);
    setIsAutoDetected(false);
    setSearchQuery('');
    setSearchResults([]);
    setAutocompleteResults([]);
    setShowAutocomplete(false);

    // Center map on selected location
    if (mapRef.current) {
      mapRef.current.setView([result.lat, result.lng], 15);
    }
  };

  const handleSelectAutocomplete = async (result: GeocodeResult) => {
    setSearchQuery(result.displayName);
    await handleSelectSearchResult(result);
  };

  // Don't render map until mounted (client-side only)
  if (!isMounted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className={`w-full ${className}`}>
        {isDetecting ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
            <p className="text-gray-600">Detecting your location...</p>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-lg shadow">
            {error ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">{error}</p>
                <p className="text-xs text-yellow-700">You can still set your location using the search or map below.</p>
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                Please allow location access or search for your location
              </p>
            )}
            {showSearch && (
              <div className="mb-4 relative">
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      onFocus={() => {
                        if (autocompleteResults.length > 0) {
                          setShowAutocomplete(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAutocomplete(false), 200);
                      }}
                      placeholder="Search for your area location (e.g., Tolarbag / Niketan)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showAutocomplete && autocompleteResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                          Probable location ({autocompleteResults.length})
                        </div>
                        {autocompleteResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectAutocomplete(result)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          >
                            <p className="text-sm text-gray-800 font-medium">{result.displayName}</p>
                            {result.type && (
                              <p className="text-xs text-gray-500 mt-0.5 capitalize">{result.type}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* Full Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                      Search Results ({searchResults.length})
                    </div>
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm text-gray-800 font-medium">{result.displayName}</p>
                        {(result as any).type && (
                          <p className="text-xs text-gray-500 mt-1 capitalize">{(result as any).type}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={detectLocation}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span>📍</span>
              <span>Detect My Location</span>
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Click the button above to request location permission from your browser
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => {
                  if (autocompleteResults.length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding autocomplete to allow click events
                  setTimeout(() => setShowAutocomplete(false), 200);
                }}
                placeholder="Search for your area location (e.g., Tolarbag / Niketan)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              
              {/* Autocomplete Dropdown (shows while typing) */}
              {showAutocomplete && autocompleteResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                    Probable location ({autocompleteResults.length})
                  </div>
                  {autocompleteResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAutocomplete(result)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm text-gray-800 font-medium">{result.displayName}</p>
                      {result.type && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{result.type}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Full Search Results Dropdown (shows after clicking Search button) */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b sticky top-0">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <p className="text-sm text-gray-800 font-medium">{result.displayName}</p>
                  {(result as any).type && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{(result as any).type}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-detected Message */}
      {isAutoDetected && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Your browser detected a location.</strong> If this looks incorrect, please drag
            the pin to fix it.
          </p>
        </div>
      )}

      {/* Map */}
      <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler 
            onMapReady={(map) => {
              mapRef.current = map;
            }}
            onMapClick={handleMapClick}
          />
          <Marker
            position={[location.lat, location.lng]}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={(marker: any) => {
              if (marker) {
                markerRef.current = marker;
              }
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
                <p className="text-xs text-gray-600">{address}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Address Field */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address will be auto-filled"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {isLoading && (
          <p className="mt-1 text-xs text-gray-500">Updating address...</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Coordinates Display */}
      <div className="mt-2 text-xs text-gray-500">
        Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
      </div>
    </div>
  );
}

