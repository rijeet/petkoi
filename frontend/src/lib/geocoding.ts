/**
 * Reverse geocoding utility
 * Uses Nominatim (OpenStreetMap) for free reverse geocoding
 * Can be extended to use Google Maps Geocoding API if needed
 */

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  displayName: string;
  type?: string;
  importance?: number;
}

export interface ReverseGeocodeResult {
  address: string;
  displayName: string;
  components?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Reverse geocode coordinates to address using Nominatim
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted address string
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  try {
    // Use Nominatim (OpenStreetMap) - free, no API key required
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PetIdentityPlatform/1.0', // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();

    if (!data || !data.address) {
      throw new Error('No address found');
    }

    // Format address from components
    const addr = data.address;
    const parts: string[] = [];

    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }

    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }

    if (addr.state) {
      parts.push(addr.state);
    }

    if (addr.postcode) {
      parts.push(addr.postcode);
    }

    if (addr.country) {
      parts.push(addr.country);
    }

    const formattedAddress = parts.length > 0 ? parts.join(', ') : data.display_name;

    return {
      address: formattedAddress,
      displayName: data.display_name || formattedAddress,
      components: addr,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Fallback to coordinates if geocoding fails
    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      displayName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
}

/**
 * Forward geocode (search) address to coordinates
 * @param query Search query (address, place name, etc.)
 * @param limit Maximum number of results to return (default: 15)
 * @returns Array of geocode results
 */
export async function forwardGeocode(query: string, limit: number = 15): Promise<GeocodeResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&extratags=1&namedetails=1`,
      {
        headers: {
          'User-Agent': 'PetIdentityPlatform/1.0',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    interface NominatimResult {
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      class?: string;
      importance?: number;
    }

    return data.map((item: NominatimResult) => ({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      // Additional info for better display
      type: item.type || item.class || 'location',
      importance: item.importance || 0,
    }));
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return [];
  }
}

/**
 * Autocomplete/search suggestions as user types
 * Uses a shorter delay and returns fewer results for faster response
 * @param query Partial search query
 * @returns Array of geocode results (limited to 8 for autocomplete)
 */
export async function autocompleteGeocode(query: string): Promise<GeocodeResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&dedupe=1`,
      {
        headers: {
          'User-Agent': 'PetIdentityPlatform/1.0',
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    interface NominatimResult {
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      class?: string;
    }

    return data.map((item: NominatimResult) => ({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type || item.class || 'location',
    }));
  } catch (error) {
    console.error('Autocomplete geocoding error:', error);
    return [];
  }
}

