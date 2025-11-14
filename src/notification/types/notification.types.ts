/**
 * Represents a tourist place with comprehensive information
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
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: any[];
  place_id?: string; 
}

/**
 * Represents travel time and distance between two points
 */
export interface TravelTime {
  duration: string;
  distance: string;
  success: boolean;
}

/**
 * Result of email sending operations
 */
export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

/**
 * Result of SMS sending operations  
 */
export interface SmsResult {
  sid?: string;
  success: boolean;
  error?: string;
}

/**
 * Response structure for tourist places search operations
 */
export interface TestPlacesResponse {
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
 * Response structure for detailed place information requests
 */
export interface TestPlaceDetailsResponse {
  success: boolean;
  message: string;
  placeName?: string;
  details?: any;
  error?: string;
}

/**
 * Response structure for travel time calculation requests
 */
export interface TravelTimeResponse {
  success: boolean;
  message: string;
  travelTime?: TravelTime;
  error?: string;
}

/**
 * Service status and configuration information
 */
export interface ServiceStatusResponse {
  touristPlaces: {
    initialized: boolean;
    hasApiKey: boolean; 
  };
}

/**
 * Statistical summary of notification operations
 */
export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  successRate: number;
}

/**
 * Metadata associated with notification operations
 */
export interface NotificationMetadata {
  placeDetails?: any;
  travelTime?: TravelTime;
  location?: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  enriched?: boolean;
  timestamp?: string;
  error?: string;
  fallback?: boolean;
  retryCount?: number;
  errorMessage?: string;
}