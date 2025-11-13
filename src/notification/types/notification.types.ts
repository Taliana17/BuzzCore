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

export interface ServiceStatusResponse {
  googlePlaces: {
    initialized: boolean;
    hasApiKey: boolean;
  };
}