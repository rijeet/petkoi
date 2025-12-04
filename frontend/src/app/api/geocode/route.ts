/**
 * API Route for Geocoding (Optional - can use client-side directly)
 * This provides a server-side proxy for geocoding if needed
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('q');

  try {
    if (lat && lng) {
      // Reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PetIdentityPlatform/1.0',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (query) {
      // Forward geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Geocoding API error:', error);
    return NextResponse.json({ error: error.message || 'Geocoding failed' }, { status: 500 });
  }
}

