# LocationPicker Component

A reusable React component for location selection with auto GPS detection, map picker, and reverse geocoding.

## Features

- ✅ Auto-detect user location using `navigator.geolocation`
- ✅ Interactive Leaflet map with draggable marker
- ✅ Reverse geocoding to get human-readable addresses
- ✅ Forward geocoding (search) for location lookup
- ✅ Editable address field
- ✅ Clean UX with helpful messages

## Usage

```tsx
import LocationPicker, { type LocationData } from '@/components/LocationPicker';

function MyComponent() {
  const handleLocationChange = (location: LocationData) => {
    console.log('Location:', location);
    // location = { lat: number, lng: number, address: string }
  };

  return (
    <LocationPicker
      onLocationChange={handleLocationChange}
      autoDetect={true}
      showSearch={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialLocation` | `{ lat: number; lng: number }` | `undefined` | Initial map center location |
| `onLocationChange` | `(location: LocationData) => void` | **Required** | Callback when location changes |
| `autoDetect` | `boolean` | `true` | Automatically detect location on mount |
| `showSearch` | `boolean` | `true` | Show search bar for location lookup |
| `className` | `string` | `''` | Additional CSS classes |

## LocationData Interface

```typescript
interface LocationData {
  lat: number;
  lng: number;
  address: string;
}
```

## Geocoding

The component uses Nominatim (OpenStreetMap) for reverse and forward geocoding. This is free and doesn't require an API key.

### Reverse Geocoding
Converts coordinates (lat, lng) to a human-readable address.

### Forward Geocoding
Converts an address or place name to coordinates.

## Integration with User Signup

The component is integrated into the user signup flow:

1. User signs in with Google
2. Browser requests location permission
3. Location is stored in localStorage
4. After OAuth callback, user is redirected to `/dashboard/confirm-location`
5. LocationPicker component allows user to confirm/adjust location
6. Location is saved to user profile

## Files

- `LocationPicker.tsx` - Main component
- `geocoding.ts` - Geocoding utility functions
- `api/geocode/route.ts` - Optional API route for server-side geocoding

