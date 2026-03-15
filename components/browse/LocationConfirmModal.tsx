'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  CircleF,
  Autocomplete
} from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, CheckCircle, X, AlertTriangle, Loader2, Search } from 'lucide-react';

const LIBRARIES: ('places')[] = ['places'];

const MAP_STYLE = { width: '100%', height: '350px' };

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

interface LocationConfirmModalProps {
  isOpen: boolean;
  detectedLat: number | null;
  detectedLng: number | null;
  accuracy: number | null;
  hasError: boolean;
  errorMessage?: string | null;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function LocationConfirmModal({
  isOpen,
  detectedLat,
  detectedLng,
  accuracy,
  hasError,
  errorMessage,
  onConfirm,
  onClose
}: LocationConfirmModalProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Reset pin when modal opens with new detected coordinates
  useEffect(() => {
    if (isOpen) {
      if (detectedLat && detectedLng) {
        setPinPosition({ lat: detectedLat, lng: detectedLng });
      } else {
        setPinPosition(null);
      }
    }
  }, [isOpen, detectedLat, detectedLng]);

  // Pan map to detected location when it loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    if (detectedLat && detectedLng) {
      map.panTo({ lat: detectedLat, lng: detectedLng });
      map.setZoom(13);
    }
  }, [detectedLat, detectedLng]);

  // Click on map to place/move pin
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPinPosition(newPos);
      mapRef.current?.panTo(newPos);
    }
  }, []);

  // Drag marker to adjust
  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setPinPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  // Google Places Autocomplete
  const onAutocompleteLoad = useCallback((auto: google.maps.places.Autocomplete) => {
    autocompleteRef.current = auto;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const newPos = { lat, lng };

      setPinPosition(newPos);
      mapRef.current?.panTo(newPos);
      mapRef.current?.setZoom(15);
    }
  }, []);

  // Confirm location
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (pinPosition) {
      onConfirm(pinPosition.lat, pinPosition.lng);
    }
  };

  // Close modal
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (!isOpen) return null;

  const accuracyKm = accuracy ? (accuracy / 1000).toFixed(1) : null;

  const center = pinPosition
    || (detectedLat && detectedLng ? { lat: detectedLat, lng: detectedLng } : INDIA_CENTER);

  const zoom = pinPosition ? 14 : (detectedLat ? 10 : 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Confirm Your Location</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Status message */}
          {hasError ? (
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium">Could not detect your location</p>
                <p className="text-amber-700 mt-1">
                  {errorMessage || 'Search for your location or click on the map to mark it.'}
                </p>
              </div>
            </div>
          ) : accuracy && accuracy > 1000 ? (
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium">Location accuracy is low (~{accuracyKm}km)</p>
                <p className="text-amber-700 mt-1">
                  The pin shows your detected location. Drag it or search below to fix it.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-800">
                We detected your location. Drag the pin if you need to adjust it.
              </p>
            </div>
          )}

          {/* Google Places Search */}
          {isLoaded && (
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'in' },
                fields: ['geometry', 'name', 'formatted_address']
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your area, landmark, or address..."
                  className="pl-9"
                />
              </div>
            </Autocomplete>
          )}

          {/* Map */}
          {loadError ? (
            <div className="w-full h-[350px] rounded-lg border flex items-center justify-center bg-red-50">
              <p className="text-red-600 text-sm">Failed to load Google Maps. Check API key.</p>
            </div>
          ) : !isLoaded ? (
            <div className="w-full h-[350px] rounded-lg border flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <GoogleMap
                mapContainerStyle={MAP_STYLE}
                center={center}
                zoom={zoom}
                onClick={onMapClick}
                onLoad={onMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  zoomControl: true,
                  gestureHandling: 'greedy'
                }}
              >
                {/* User pin — draggable */}
                {pinPosition && (
                  <MarkerF
                    position={pinPosition}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                    title="Your location — drag to adjust"
                  />
                )}

                {/* Accuracy circle — shows uncertainty radius */}
                {detectedLat && detectedLng && accuracy && accuracy > 200 && (
                  <CircleF
                    center={{ lat: detectedLat, lng: detectedLng }}
                    radius={accuracy}
                    options={{
                      strokeColor: '#f59e0b',
                      strokeWeight: 2,
                      strokeOpacity: 0.6,
                      fillColor: '#fbbf24',
                      fillOpacity: 0.08
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-xs text-blue-700">
              💡 <b>Tip:</b> Search for your area in the search bar above, or click directly on the map to place the pin. Drag the pin to fine-tune your location.
            </p>
          </div>

          {/* Pin coordinates */}
          {pinPosition && (
            <p className="text-xs text-gray-500 text-center">
              📍 <span className="font-mono">
                {pinPosition.lat.toFixed(4)}°N, {pinPosition.lng.toFixed(4)}°E
              </span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!pinPosition}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Use This Location
          </Button>
        </div>
      </div>
    </div>
  );
}