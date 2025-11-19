import { Coordinates, TravelTime } from './core.types'; 

/**
 * OSM tags for places
 */
export interface OsmTags {
  tourism?: string;
  historic?: string;
  amenity?: string;
  description?: string;
  wikipedia?: string;
}

/**
 * Opening hours information
 */
export interface OpeningHours {
  open_now: boolean;
  weekday_text?: string[];
}

/**
 * Place details from external services
 */
export interface PlaceDetails {
  name: string;
  formatted_address: string;
  rating?: number;
  opening_hours?: OpeningHours;
  website?: string;
  international_phone_number?: string;
  user_ratings_total?: number;
  osm_tags?: OsmTags;
}

/**
 * Place result from external services
 */
export interface PlaceResult {
  name: string;
  vicinity?: string;
  rating?: number;
  types?: string[];
  geometry?: {
    location: Coordinates;
  };
  place_id?: string;
  opening_hours?: OpeningHours;
  photos?: any[];
}

/**
 * Recommended place with full details
 */
export interface RecommendedPlace {
  place: PlaceResult;
  details: PlaceDetails;
  travelTime: TravelTime; // ← Aquí se usa TravelTime
}

/**
 * City detection result
 */
export interface CityDetectionResult {
  city: string;
  country: string;
  fullAddress: string;
  lat: number;
  lng: number;
  success: boolean;
}