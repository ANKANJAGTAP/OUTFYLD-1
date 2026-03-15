interface GeocodingInput {
  address?: string;
  city: string;
  state?: string;
  pincode?: string;
}

interface GeocodingResult {
  coordinates: [number, number]; // [longitude, latitude]
  accuracy: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  accuracyRadius: number;
  formattedAddress: string;
  confidence: number;
}

export async function geocodeAddress(input: GeocodingInput): Promise<GeocodingResult> {
  const { address, city, state, pincode } = input;
  const searchQuery = [address, city, state, pincode].filter(Boolean).join(', ');

  if (!searchQuery.trim()) {
    throw new Error('At least city is required for geocoding');
  }

  const apiKey = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;
  if (!apiKey) throw new Error('Geocoding API key not configured');

  const url = new URL('https://api.opencagedata.com/geocode/v1/json');
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('countrycode', 'in');
  url.searchParams.set('limit', '1');
  url.searchParams.set('no_annotations', '1');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find location for "${searchQuery}". Please check the address.`);
  }

  const result = data.results[0];
  const lat = result.geometry.lat;
  const lng = result.geometry.lng;
  const confidence = result.confidence || 5;

  const accuracy = getAccuracy(confidence);

  return {
    coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
    accuracy,
    accuracyRadius: getAccuracyRadius(accuracy),
    formattedAddress: result.formatted,
    confidence: confidence / 10
  };
}

function getAccuracy(confidence: number): GeocodingResult['accuracy'] {
  if (confidence >= 9) return 'ROOFTOP';
  if (confidence >= 7) return 'RANGE_INTERPOLATED';
  if (confidence >= 4) return 'GEOMETRIC_CENTER';
  return 'APPROXIMATE';
}

function getAccuracyRadius(accuracy: GeocodingResult['accuracy']): number {
  const radiusMap = {
    ROOFTOP: 50,
    RANGE_INTERPOLATED: 150,
    GEOMETRIC_CENTER: 500,
    APPROXIMATE: 1500
  };
  return radiusMap[accuracy];
}