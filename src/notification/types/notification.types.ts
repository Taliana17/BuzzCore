import { Notification } from '../entities/notification.entity';
import { User } from '../../user/entities/user.entity';
import { Coordinates, TravelTime } from './core.types';
import { PlaceDetails } from './places.types';

/**
 * Location information for notifications
 */
export interface NotificationLocation {
  city: string;
  coordinates?: Coordinates;
  cityDetected?: boolean;
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

// =============================================================================
// TYPE GUARDS & HELPERS
// =============================================================================

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