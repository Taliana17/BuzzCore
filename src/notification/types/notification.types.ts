/**
 * Represents a tourist place with comprehensive information
 */
export interface PlaceResult {
  /** Name of the tourist place */
  name: string;
  /** Address or vicinity description */
  vicinity?: string;
  /** Average rating from reviews (0-5 scale) */
  rating?: number;
  /** Categories describing the place type */
  types?: string[];
  /** Geographic coordinates and location data */
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  /** Opening hours and schedule information */
  opening_hours?: {
    /** Current open/closed status */
    open_now?: boolean;
    /** Weekly operating hours in readable format */
    weekday_text?: string[];
  };
  /** Array of photos associated with the place */
  photos?: any[];
  /** Unique identifier for the place */
  place_id?: string; 
}

/**
 * Represents travel time and distance between two points
 */
export interface TravelTime {
  /** Human-readable duration estimate */
  duration: string;
  /** Human-readable distance measurement */
  distance: string;
  /** Indicates if calculation was successful or estimated */
  success: boolean;
}

/**
 * Result of email sending operations
 */
export interface EmailResult {
  /** Email provider's transaction identifier */
  id?: string;
  /** Indicates successful email delivery */
  success: boolean;
  /** Error description if delivery failed */
  error?: string;
}

/**
 * Result of SMS sending operations  
 */
export interface SmsResult {
  /** SMS provider's transaction identifier */
  sid?: string;
  /** Indicates successful SMS delivery */
  success: boolean;
  /** Error description if delivery failed */
  error?: string;
}

/**
 * Response structure for tourist places search operations
 */
export interface TestPlacesResponse {
  /** Indicates successful API call */
  success: boolean;
  /** Descriptive message about the operation result */
  message: string;
  /** Coordinates used for the search query */
  location?: {
    lat: number;
    lng: number;
  };
  /** Array of found tourist places */
  places?: PlaceResult[];
  /** Error details if operation failed */
  error?: string;
}

/**
 * Response structure for detailed place information requests
 */
export interface TestPlaceDetailsResponse {
  /** Indicates successful details retrieval */
  success: boolean;
  /** Descriptive message about the operation */
  message: string;
  /** Name of the requested place */
  placeName?: string;
  /** Comprehensive place details */
  details?: any;
  /** Error information if request failed */
  error?: string;
}

/**
 * Response structure for travel time calculation requests
 */
export interface TravelTimeResponse {
  /** Indicates successful travel time calculation */
  success: boolean;
  /** Descriptive message about the calculation */
  message: string;
  /** Calculated travel time and distance */
  travelTime?: TravelTime;
  /** Error details if calculation failed */
  error?: string;
}

/**
 * Service status and configuration information
 */
export interface ServiceStatusResponse {
  touristPlaces: {
    /** Indicates if the service is properly initialized */
    initialized: boolean;
    /** Indicates if valid API keys are configured */
    hasApiKey: boolean; 
  };
}

/**
 * Statistical summary of notification operations
 */
export interface NotificationStats {
  /** Total number of notifications */
  total: number;
  /** Number of successfully sent notifications */
  sent: number;
  /** Number of failed notification deliveries */
  failed: number;
  /** Success rate percentage (0-100) */
  successRate: number;
}

/**
 * Metadata associated with notification operations
 */
export interface NotificationMetadata {
  /** Detailed information about the recommended place */
  placeDetails?: any;
  /** Travel time information from user to place */
  travelTime?: TravelTime;
  /** Location context where notification was triggered */
  location?: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  /** Indicates if notification contains enriched data */
  enriched?: boolean;
  /** Timestamp when notification was processed */
  timestamp?: string;
  /** General error information */
  error?: string;
  /** Indicates if this is a fallback notification */
  fallback?: boolean;
  /** Number of delivery retry attempts */
  retryCount?: number;
  /** Specific error message from delivery failure */
  errorMessage?: string;
}