/**
 * Coordinates for geographic locations
 */
export interface Coordinates {
  lat: number;
  lng: number;
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
 * Provider status information
 */
export interface ProviderStatus {
  initialized: boolean;
  service: string;
  [key: string]: any;
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
 * Queue job data structure
 */
export interface NotificationJobData {
  notificationId: string;
  channel: 'email' | 'sms';
  attempts?: number;
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