'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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
  }) => void;
}

export default function LocationPickerMap({
  address, city, state, pincode,
  initialCoordinates, onLocationConfirmed
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [geocodeAccuracy, setGeocodeAccuracy] = useState('GEOMETRIC_CENTER');
  const [geocodeAccuracyRadius, setGeocodeAccuracyRadius] = useState(500);

  const placeMarker = useCallback(async (L: any, map: any, lat: number, lng: number) => {
    if (markerRef.current) map.removeLayer(markerRef.current);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setPinPosition([pos.lat, pos.lng]);
      setConfirmed(false);
    });
    marker.bindPopup('📍 Your turf location<br><small>Drag to adjust</small>').openPopup();

    markerRef.current = marker;
    setPinPosition([lat, lng]);
    setConfirmed(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = (await import('leaflet')).default;
      
      // Prevent double initialization due to React StrictMode and async import
      if (!isMounted || mapRef.current || (mapContainerRef.current as any)._leaflet_id) {
        return;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      map.on('click', (e: any) => placeMarker(L, map, e.latlng.lat, e.latlng.lng));
      mapRef.current = map;

      if (initialCoordinates?.latitude && initialCoordinates?.longitude) {
        placeMarker(L, map, initialCoordinates.latitude, initialCoordinates.longitude);
        map.setView([initialCoordinates.latitude, initialCoordinates.longitude], 15);
      }
    };

    initMap();
    return () => { 
      isMounted = false;
      if (mapRef.current) { 
        mapRef.current.remove(); 
        mapRef.current = null; 
      } 
    };
  }, []);

  const handleGeocode = async () => {
    if (!city) { setGeocodeError('Enter a city first'); return; }
    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, city, state, pincode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const [lng, lat] = data.coordinates;
      setGeocodeAccuracy(data.accuracy);
      setGeocodeAccuracyRadius(data.accuracyRadius);

      if (mapRef.current) {
        const L = (await import('leaflet')).default;
        placeMarker(L, mapRef.current, lat, lng);
        mapRef.current.setView([lat, lng], 15);
      }
    } catch (err: any) { setGeocodeError(err.message); }
    finally { setIsGeocoding(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGeocodeError(null);

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: `${searchQuery}, ${city || ''}`, city: city || searchQuery })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const [lng, lat] = data.coordinates;
      if (mapRef.current) {
        const L = (await import('leaflet')).default;
        placeMarker(L, mapRef.current, lat, lng);
        mapRef.current.setView([lat, lng], 16);
      }
    } catch (err: any) { setGeocodeError(err.message); }
    finally { setIsSearching(false); }
  };

  const handleConfirm = () => {
    if (!pinPosition) { setGeocodeError('Place a pin on the map first'); return; }
    const [lat, lng] = pinPosition;
    onLocationConfirmed({
      coordinates: [lng, lat], // ⭐ GeoJSON: longitude first
      accuracy: geocodeAccuracy,
      accuracyRadius: geocodeAccuracyRadius,
      isOwnerVerified: true
    });
    setConfirmed(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Mark Exact Location on Map
        </CardTitle>
        <CardDescription>
          This helps customers find your turf. Locate your area, then drag the pin to the exact spot.
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

        <div className="flex gap-2">
          <Input placeholder="Search landmark near your turf..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Button type="button" onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} variant="outline">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {geocodeError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{geocodeError}</AlertDescription>
          </Alert>
        )}

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <div ref={mapContainerRef} className="w-full h-[400px] rounded-lg border border-gray-200 z-0" />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-1">📍 How to mark location:</p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click <b>Find from Address</b> to auto-locate your area</li>
            <li>Or use the <b>search bar</b> to find a nearby landmark</li>
            <li><b>Click on the map</b> to place the pin, or <b>drag</b> to adjust</li>
            <li>Click <b>Confirm Location</b> when the pin is at your turf</li>
          </ol>
        </div>

        {pinPosition && (
          <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-3">
            <div>
              <p className="text-sm text-gray-600">📍 <span className="font-mono text-xs">{pinPosition[0].toFixed(6)}°N, {pinPosition[1].toFixed(6)}°E</span></p>
              {confirmed && <p className="text-sm text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" /> Location confirmed</p>}
            </div>
            <Button type="button" onClick={handleConfirm} className={confirmed ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}>
              {confirmed ? <><CheckCircle className="h-4 w-4 mr-2" />Confirmed ✓</> : <><MapPin className="h-4 w-4 mr-2" />Confirm Location</>}
            </Button>
          </div>
        )}

        {!pinPosition && <p className="text-sm text-amber-600 text-center">⚠️ No pin placed. Use the buttons above or click on the map.</p>}
      </CardContent>
    </Card>
  );
}