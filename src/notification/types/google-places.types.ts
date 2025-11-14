/**
 * Represents a tourist place with basic information
 */
export interface PlaceResult {
  /** Name of the tourist place */
  name: string;
  /** Address or vicinity of the place */
  vicinity?: string;
  /** Average rating from reviews (0-5 scale) */
  rating?: number;
  /** Types/categories of the place */
  types?: string[];
  /** Geographic coordinates of the place */
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  /** Unique identifier for the place */
  place_id?: string;
  /** Opening hours information */
  opening_hours?: {
    /** Indicates if the place is currently open */
    open_now: boolean;
    /** Weekly schedule in human-readable format */
    weekday_text?: string[];
  };
}

/**
 * Standardized response structure for Google Places API calls
 */
export interface GooglePlacesResponse {
  /** Indicates if the API call was successful */
  success: boolean;
  /** Human-readable message describing the result */
  message: string;
  /** Location coordinates used for the search */
  location?: {
    lat: number;
    lng: number;
  };
  /** Array of found tourist places */
  places?: PlaceResult[];
  /** Error details if the request failed */
  error?: string;
}

/**
 * Travel time information between two points
 */
export interface TravelTime {
  /** Human-readable duration (e.g., "15 minutes") */
  duration: string;
  /** Human-readable distance (e.g., "1.2 km") */
  distance: string;
  /** Indicates if the travel time was successfully calculated */
  success: boolean;
}

/**
 * Notification metadata containing additional context
 */
export interface NotificationMetadata {
  /** Detailed information about the recommended place */
  placeDetails?: any;
  /** Travel time information from user to place */
  travelTime?: TravelTime;
  /** Location information where the notification was triggered */
  location?: {
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  /** Error message if notification delivery failed */
  errorMessage?: string;
  /** Number of retry attempts made */
  retryCount?: number;
  /** Indicates if this is a fallback notification */
  fallback?: boolean;
}

/**
 * Result of email sending operation
 */
export interface EmailResult {
  /** Indicates if the email was sent successfully */
  success: boolean;
  /** Email provider's transaction ID */
  id?: string;
  /** Error message if sending failed */
  error?: string;
}

/**
 * Result of SMS sending operation
 */
export interface SmsResult {
  /** Indicates if the SMS was sent successfully */
  success: boolean;
  /** SMS provider's transaction ID */
  sid?: string;
  /** Error message if sending failed */
  error?: string;
}