import { Coordinates, TravelTime, ProviderStatus, EmailResult, SmsResult } from './core.types';
import { PlaceResult, PlaceDetails, CityDetectionResult } from './places.types';

/**
 * Base response interface
 */
interface BaseResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Response for testing places API
 */
export interface TestPlacesResponse extends BaseResponse {
  location?: Coordinates;
  places?: PlaceResult[];
}

/**
 * Response for testing place details
 */
export interface TestPlaceDetailsResponse extends BaseResponse {
  placeName?: string;
  details?: PlaceDetails;
}

/**
 * Response for travel time calculation
 */
export interface TravelTimeResponse extends BaseResponse {
  travelTime?: TravelTime;
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
export interface LocationProcessingResponse extends BaseResponse {
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
}

/**
 * City detection response
 */
export interface CityDetectionResponse extends BaseResponse {
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
}

/**
 * Response for testing providers
 */
export interface ProvidersTestResponse extends BaseResponse {
  test_data?: {
    phone: string;
    email: string;
  };
  sms?: SmsResult;
  email?: EmailResult;
  providersStatus?: ProvidersStatusResponse;
}