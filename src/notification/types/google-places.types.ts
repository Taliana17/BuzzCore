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