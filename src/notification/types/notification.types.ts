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

export interface TravelTime {
  duration: string;
  distance: string;
  success: boolean;
}

export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

export interface SmsResult {
  sid?: string;
  success: boolean;
  error?: string;
}

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

export interface TestPlaceDetailsResponse {
  success: boolean;
  message: string;
  placeName?: string;
  details?: any;
  error?: string;
}

export interface TravelTimeResponse {
  success: boolean;
  message: string;
  travelTime?: TravelTime;
  error?: string;
}

export interface ServiceStatusResponse {
  touristPlaces: {
    initialized: boolean;
    hasApiKey: boolean; 
  };
}
export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  successRate: number;
}

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

