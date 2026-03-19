'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleMap, useLoadScript, MarkerF, Autocomplete } from '@react-google-maps/api';

interface LocationPickerMapProps {
  address: string;
  city: string;
  state: string;
  pincode: string;
  initialCoordinates?: { latitude?: number; longitude?: number };
  onLocationConfirmed: (data: {
    coordinates: [number, number];
    accuracy: string;
    accuracyRadius: number;
    isOwnerVerified: boolean;
    // New fields for reverse geocoding
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
}

const libraries: any[] = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // Center of India

const extractAddressFromGeocodeResult = (result: google.maps.GeocoderResult | google.maps.places.PlaceResult) => {
  let city = '';
  let state = '';
  let pincode = '';
  let addressStr = '';

  if (result.address_components) {
    for (const component of result.address_components) {
      const types = component.types;
      if (types.includes('locality')) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_2') && !city) {
      city = component.long_name; // district as fallback
    } else if (types.includes('administrative_area_level_3') && !city) {
      city = component.long_name;
    }
    
    if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    if (types.includes('postal_code')) {
      pincode = component.long_name;
    }
  }
}

  // Find a good short precise address name
  const sublocalityTypes = ['sublocality', 'neighborhood', 'route', 'premise', 'subpremise'];
  const sublocality = result.address_components?.find(c => 
    sublocalityTypes.some(t => c.types.includes(t))
  );
  
  addressStr = sublocality ? sublocality.long_name : (result.formatted_address ? result.formatted_address.split(',')[0] : (result as google.maps.places.PlaceResult).name || '');

  return { address: addressStr, city, state, pincode };
};

export default function LocationPickerMap({
  address, city, state, pincode,
  initialCoordinates, onLocationConfirmed
}: LocationPickerMapProps) {

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  
  const [pinPosition, setPinPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(5);

  const [geocodeAccuracy, setGeocodeAccuracy] = useState('GEOMETRIC_CENTER');
  const [geocodeAccuracyRadius, setGeocodeAccuracyRadius] = useState(500);
  
  // Store reverse geocoded address
  const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState<{
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null>(null);

  // Set initial coordinates if available
  useEffect(() => {
    // Only set it initially if we don't already have a pin positioned manually
    // This prevents the parent form updates from constantly overriding our active drag/click
    if (initialCoordinates?.latitude && initialCoordinates?.longitude && !pinPosition) {
      const pos = { lat: initialCoordinates.latitude, lng: initialCoordinates.longitude };
      setPinPosition(pos);
      setMapCenter(pos);
      setZoom(15);
    }
  }, [initialCoordinates, pinPosition]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const reverseGeocode = useCallback((latLng: google.maps.LatLng | {lat: number, lng: number}) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addressData = extractAddressFromGeocodeResult(results[0]);
        setReverseGeocodedAddress(addressData);
        setGeocodeAccuracy(results[0].geometry.location_type);
        
        // Auto-confirm the location
        const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
        const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
        
        onLocationConfirmed({
          coordinates: [lng, lat],
          accuracy: results[0].geometry.location_type,
          accuracyRadius: 500, // Default radius
          isOwnerVerified: true,
          ...addressData
        });
      }
    });
  }, [onLocationConfirmed]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPinPosition(pos);
      reverseGeocode(pos);
    }
  }, [reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPinPosition(pos);
      reverseGeocode(pos);
    }
  }, [reverseGeocode]);

  const handleGeocode = async () => {
    if (!city) { setGeocodeError('Enter a city first'); return; }
    if (!window.google) return;
    
    setIsGeocoding(true);
    setGeocodeError(null);

    const geocoder = new window.google.maps.Geocoder();
    const fullAddress = [address, city, state, pincode].filter(Boolean).join(', ');

    try {
      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const pos = { lat: loc.lat(), lng: loc.lng() };
          
          setPinPosition(pos);
          setMapCenter(pos);
          setZoom(15);
          setGeocodeAccuracy(results[0].geometry.location_type);
          setGeocodeAccuracyRadius(500); // Google doesn't easily provide radius, setting default
          
          // Extact address directly from search results to avoid a second API call
          const addressData = extractAddressFromGeocodeResult(results[0]);
          setReverseGeocodedAddress(addressData);
          
          // Auto-confirm
          onLocationConfirmed({
            coordinates: [pos.lng, pos.lat],
            accuracy: results[0].geometry.location_type,
            accuracyRadius: 500,
            isOwnerVerified: true,
            ...addressData
          });
        } else {
          setGeocodeError('Could not find location from address: ' + status);
        }
      });
    } catch (err: any) {
       setGeocodeError(err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        setGeocodeError('Location search failed: No geometry found for this place.');
        return;
      }

      const loc = place.geometry.location;
      const pos = { lat: loc.lat(), lng: loc.lng() };
      
      setPinPosition(pos);
      setMapCenter(pos);
      setZoom(16);
      setGeocodeAccuracy('ROOFTOP');
      setGeocodeError(null);
      
      const addressData = extractAddressFromGeocodeResult(place);
      setReverseGeocodedAddress(addressData);
      
      // Auto-confirm
      onLocationConfirmed({
        coordinates: [pos.lng, pos.lat],
        accuracy: 'ROOFTOP',
        accuracyRadius: 500,
        isOwnerVerified: true,
        ...addressData
      });
    }
  };

  if (loadError) return <div className="p-4 bg-red-50 text-red-600 rounded">Error loading maps</div>;
  if (!isLoaded) return <div className="p-4 flex gap-2"><Loader2 className="animate-spin h-5 w-5" /> Loading maps...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Mark Exact Location on Map
        </CardTitle>
        <CardDescription>
          This helps customers find your arena. Locate your area, then drag the pin to the exact spot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button type="button" onClick={handleGeocode} disabled={isGeocoding || !city} variant="outline">
            {isGeocoding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finding...</> : <><MapPin className="h-4 w-4 mr-2" />Find from Address</>}
          </Button>
          <span className="text-sm text-gray-500 flex items-center">
            {city ? `Searching: ${[address, city, state, pincode].filter(Boolean).join(', ')}` : 'Enter city first'}
          </span>
        </div>

        <div className="flex gap-2 w-full">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            className="flex-grow w-full border-gray-300 focus:border-green-500 focus:ring-green-500"
          >
            <Input 
              type="text"
              placeholder="Search milestone, landmark, or college directly..." 
              className="w-full"
            />
          </Autocomplete>
        </div>

        {geocodeError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{geocodeError}</AlertDescription>
          </Alert>
        )}

        {/* Google Map Implementation */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100 relative z-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
            onClick={handleMapClick}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {pinPosition && (
              <MarkerF
                position={pinPosition}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                animation={window.google.maps.Animation.DROP}
              />
            )}
          </GoogleMap>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800 font-medium mb-1">📍 How to mark location:</p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click <b>Find from Address</b> to auto-locate your area</li>
            <li>Or use the <b>search bar</b> to find a nearby landmark</li>
            <li><b>Click on the map</b> to place the pin, or <b>drag</b> to adjust</li>
            <li>The location is <b>automatically saved</b> when you drop the pin</li>
          </ol>
        </div>

        {pinPosition && (
          <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-3">
            <div>
              <p className="text-sm text-gray-600">📍 <span className="font-mono text-xs">{pinPosition.lat.toFixed(6)}°N, {pinPosition.lng.toFixed(6)}°E</span></p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" /> Location selected</p>
            </div>
          </div>
        )}

        {!pinPosition && <p className="text-sm text-amber-600 text-center">⚠️ No pin placed. Use the buttons above or click on the map.</p>}
      </CardContent>
    </Card>
  );
}