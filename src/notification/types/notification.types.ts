import { Notification } from '../entities/notification.entity';
import { User } from '../../user/entities/user.entity';

/**
 * Travel time information between two points
 */
export interface TravelTime {
  duration: string;
  distance: string;
  success: boolean;
}

/**
 * Coordinates for geographic locations
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Location information for notifications
 */
export interface NotificationLocation {
  city: string;
  coordinates?: Coordinates;
  cityDetected?: boolean;
}

/**
 * Place details from external services
 */
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
  osm_tags?: {
    tourism?: string;
    historic?: string;
    amenity?: string;
    description?: string;
    wikipedia?: string;
  };
}

/**
 * Base notification metadata
 */
export interface NotificationMetadata {
  placeDetails?: PlaceDetails;
  travelTime?: TravelTime;
  location?: NotificationLocation;
  enriched?: boolean;
  timestamp?: string;
  error?: string;
  fallback?: boolean;
  retryCount?: number;
  errorMessage?: string;
}

/**
 * Enhanced tourist notification metadata (with all required fields)
 */
export interface EnhancedTouristNotificationMetadata extends NotificationMetadata {
  placeDetails: PlaceDetails;
  travelTime: TravelTime;
  location: NotificationLocation;
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

/**
 * Notification statistics
 */
export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  by_channel: {
    email: number;
    sms: number;
  };
  success_rate: string;
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
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: any[];
}

/**
 * Recommended place with full details
 */
export interface RecommendedPlace {
  place: PlaceResult;
  details: PlaceDetails;
  travelTime: TravelTime;
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

/**
 * Provider status information
 */
export interface ProviderStatus {
  initialized: boolean;
  service: string;
  [key: string]: any;
}

/**
 * Response for testing places API
 */
export interface TestPlacesResponse {
  success: boolean;
  message: string;
  location?: Coordinates;
  places?: PlaceResult[];
  error?: string;
}

/**
 * Response for testing place details
 */
export interface TestPlaceDetailsResponse {
  success: boolean;
  message: string;
  placeName?: string;
  details?: PlaceDetails;
  error?: string;
}

/**
 * Response for travel time calculation
 */
export interface TravelTimeResponse {
  success: boolean;
  message: string;
  travelTime?: TravelTime;
  error?: string;
}

/**
 * Service status response
 */
export interface ServiceStatusResponse {
  touristPlaces: {
    initialized: boolean;
    hasApiKey: boolean;
  };
}

/**
 * Providers status response
 */
export interface ProvidersStatusResponse {
  sms: ProviderStatus;
  email: ProviderStatus;
  touristPlaces: {
    initialized: boolean;
    hasApiKey: boolean;
    service: string;
  };
  cityDetection: {
    available: boolean;
    service: string;
  };
}

/**
 * Location processing response
 */
export interface LocationProcessingResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      channel: 'email' | 'sms';
    };
    location: {
      city: string;
      coordinates: Coordinates;
      detected: boolean;
    };
    recommended_place: {
      name: string;
      rating?: number;
      travel_time: TravelTime;
    };
    notification: {
      id: string;
      status: 'sent' | 'failed' | 'pending';
      channel: 'email' | 'sms';
    };
    location_history?: {
      id: string;
      arrival_date: string;
    };
  };
  error?: string;
}

/**
 * City detection response
 */
export interface CityDetectionResponse {
  success: boolean;
  message: string;
  location?: Coordinates;
  detected_city?: CityDetectionResult;
  providers_status?: {
    city_detection: {
      available: boolean;
      service: string;
    };
    tourist_places: {
      initialized: boolean;
      hasApiKey: boolean;
    };
  };
  error?: string;
}

/**
 * Extended service status response
 */
export interface ExtendedServiceStatusResponse {
  touristPlaces: {
    initialized: boolean;
    hasApiKey: boolean;
  };
  cityDetection?: {
    available: boolean;
    service: string;
  };
}

/**
 * Response for testing providers
 */
export interface ProvidersTestResponse {
  success: boolean;
  message: string;
  test_data?: {
    phone: string;
    email: string;
  };
  sms?: SmsResult;
  email?: EmailResult;
  providersStatus?: ProvidersStatusResponse;
  error?: string;
}

/**
 * SMS debug response
 */
export interface SmsDebugResponse {
  timestamp: string;
  providerStatus: ProviderStatus;
  credentialTest: {
    success: boolean;
    message?: string;
    error?: string;
  };
  commonIssues: string[];
}

/**
 * Queue job data structure
 */
export interface NotificationJobData {
  notificationId: string;
  channel: 'email' | 'sms';
  attempts?: number;
}

/**
 * Notification creation data
 */
export interface NotificationCreateData {
  user: User;
  message: string;
  recommended_place: string;
  channel: 'email' | 'sms';
  status: 'sent' | 'failed' | 'pending';
  metadata?: NotificationMetadata;
}

/**
 * Type Guards for better TypeScript safety
 */

/**
 * Type guard for enhanced tourist notifications (email)
 */
export function isEnhancedTouristNotification(notification: Notification): notification is Notification & {
  metadata: EnhancedTouristNotificationMetadata;
} {
  return !!(notification.metadata?.travelTime && 
            notification.metadata?.location && 
            notification.metadata?.placeDetails);
}

/**
 * Type guard for enhanced SMS notifications
 */
export function isEnhancedSmsNotification(notification: Notification): notification is Notification & {
  metadata: {
    travelTime: TravelTime;
    location: NotificationLocation;
  };
} {
  return !!(notification.metadata?.travelTime && notification.metadata?.location);
}

/**
 * Type guard for basic notifications
 */
export function isBasicNotification(notification: Notification): boolean {
  return !notification.metadata?.travelTime || !notification.metadata?.location;
}

/**
 * Type guard for notification with valid metadata
 */
export function hasValidMetadata(notification: Notification): notification is Notification & {
  metadata: NotificationMetadata;
} {
  return !!notification.metadata;
}

/**
 * Type guard for notification with travel time
 */
export function hasTravelTime(notification: Notification): notification is Notification & {
  metadata: NotificationMetadata & { travelTime: TravelTime };
} {
  return !!notification.metadata?.travelTime;
}

/**
 * Type guard for notification with location
 */
export function hasLocation(notification: Notification): notification is Notification & {
  metadata: NotificationMetadata & { location: NotificationLocation };
} {
  return !!notification.metadata?.location;
}

/**
 * Type guard for notification with place details
 */
export function hasPlaceDetails(notification: Notification): notification is Notification & {
  metadata: NotificationMetadata & { placeDetails: PlaceDetails };
} {
  return !!notification.metadata?.placeDetails;
}

/**
 * Helper function to safely access notification metadata
 */
export function getNotificationMetadata(notification: Notification): NotificationMetadata {
  return notification.metadata || {};
}

/**
 * Helper function to get safe location data
 */
export function getSafeLocation(notification: Notification): NotificationLocation {
  return notification.metadata?.location || { city: 'Ubicación desconocida' };
}

/**
 * Helper function to get safe travel time
 */
export function getSafeTravelTime(notification: Notification): TravelTime {
  return notification.metadata?.travelTime || { 
    duration: 'N/A', 
    distance: 'N/A', 
    success: false 
  };
}

/**
 * Helper function to get safe place details
 */
export function getSafePlaceDetails(notification: Notification): PlaceDetails {
  return notification.metadata?.placeDetails || {
    name: notification.recommended_place,
    formatted_address: 'Ubicación no disponible',
    rating: 0,
    opening_hours: { open_now: false }
  };
}