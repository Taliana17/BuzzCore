/**
 * Represents a tourist place with basic information
 */
export interface PlaceResult {
  name: string;
  vicinity?: string;
  rating?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
}

/**
 * Standardized response structure for Google Places API calls
 */
export interface GooglePlacesResponse {
  success: boolean;
  message: string;
  location?: {
    lat: number;
    lng: number;
  };
  places?: PlaceResult[];
  error?: string;
}

/**
 * Travel time information between two points
 */
export interface TravelTime {
  duration: string;
  distance: string;
  success: boolean;
}

/**
 * Notification metadata containing additional context
 */
export interface NotificationMetadata {
  placeDetails?: any;
  travelTime?: TravelTime;
  location?: {
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  errorMessage?: string;
  retryCount?: number;
  fallback?: boolean;
}

/**
 * Result of email sending operation
 */
export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Result of SMS sending operation
 */
export interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}