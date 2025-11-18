export interface LocationDetector {
  detectCity(coordinates: Coordinates): Promise<CityDetectionResult>;
  validateCoordinates(coordinates: Coordinates): boolean;
}

export interface PlaceFinder {
  findNearbyPlaces(location: Coordinates, radius?: number): Promise<PlaceResult[]>;
  getPlaceDetails(placeId: string): Promise<PlaceDetails>;
  calculateTravelTime(origin: Coordinates, destination: Coordinates): Promise<TravelTime>;
  findRecommendedPlace(location: Coordinates): Promise<RecommendedPlace>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CityDetectionResult {
  city: string;
  country: string;
  fullAddress: string;
  lat: number;
  lng: number;
  success: boolean;
}

export interface PlaceResult {
  name: string;
  vicinity?: string;
  rating?: number;
  types?: string[];
  geometry?: {
    location: Coordinates;
  };
  place_id?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
}

export interface PlaceDetails {
  name: string;
  formatted_address: string;
  rating?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  website?: string;
  international_phone_number?: string;
  user_ratings_total?: number;
}

export interface TravelTime {
  duration: string;
  distance: string;
  success: boolean;
}

export interface RecommendedPlace {
  place: PlaceResult;
  details: PlaceDetails;
  travelTime: TravelTime;
}