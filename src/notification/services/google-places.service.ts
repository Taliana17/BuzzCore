import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Language,
  TravelMode
} from '@googlemaps/google-maps-services-js';

/**
 * Google Places API Service
 * 
 * @description
 * Provides tourist place search, place details, and travel time calculations
 * using Google Maps Places API and Directions API.
 * Requires GOOGLE_API_KEY environment variable.
 * 
 * @export
 * @class GooglePlacesService
 */
@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private client: Client;
  private apiKey!: string;

  /**
   * Creates an instance of GooglePlacesService
   * 
   * @param {ConfigService} configService - NestJS config service
   * @throws {Error} If GOOGLE_API_KEY is not configured
   */
  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});

    const key = this.configService.get<string>('GOOGLE_API_KEY');

    if (!key) {
      this.logger.error('GOOGLE_API_KEY faltante en el .env');
      throw new Error('GOOGLE_API_KEY es obligatoria');
    }

    this.apiKey = key;
  }

  /**
   * Searches for nearby tourist attractions
   * 
   * @description
   * Finds tourist places within 3km radius using Google Places Nearby Search.
   * Results are returned in Spanish language.
   * 
   * @param {Object} coords - Location coordinates
   * @param {number} coords.lat - Latitude
   * @param {number} coords.lng - Longitude
   * @returns {Promise<any[]>} Array of tourist place objects
   * @throws {Error} If API call fails
   * 
   * @example
   * ```typescript
   * const places = await googlePlacesService.getNearbyTouristPlaces({
   *   lat: 4.7110,
   *   lng: -74.0721
   * });
   * ```
   */
  async getNearbyTouristPlaces(coords: { lat: number; lng: number }) {
    try {
      const response = await this.client.placesNearby({
        params: {
          key: this.apiKey,
          location: coords,
          radius: 3000,
          type: 'tourist_attraction',
          language: Language.es
        }
      });

      return response.data.results;
    } catch (err: any) {
      this.logger.error(`Error en Places API: ${err.message}`);
      throw new Error('Error consultando lugares turísticos');
    }
  }

  /**
   * Gets detailed information about a place
   * 
   * @description
   * Retrieves full place details including address, hours, rating, photos, etc.
   * using Google Place Details API.
   * 
   * @param {string} placeId - Google Place ID
   * @returns {Promise<any>} Place details object
   * @throws {Error} If API call fails
   * 
   * @example
   * ```typescript
   * const details = await googlePlacesService.getPlaceDetails('ChIJ...');
   * console.log(details.formatted_address);
   * console.log(details.opening_hours);
   * ```
   */
  async getPlaceDetails(placeId: string) {
    try {
      const res = await this.client.placeDetails({
        params: {
          key: this.apiKey,
          place_id: placeId,
          language: Language.es
        }
      });

      return res.data.result;
    } catch (err: any) {
      this.logger.error(`Error al obtener detalles del lugar: ${err.message}`);
      throw new Error('Error obteniendo detalles del lugar');
    }
  }

  /**
   * Calculates walking travel time and distance
   * 
   * @description
   * Uses Google Directions API to calculate walking route between two points.
   * Returns localized duration and distance strings in Spanish.
   * Falls back to 'No disponible' if calculation fails.
   * 
   * @param {Object} origin - Starting location
   * @param {number} origin.lat - Origin latitude
   * @param {number} origin.lng - Origin longitude
   * @param {Object} destination - Destination location
   * @param {number} destination.lat - Destination latitude
   * @param {number} destination.lng - Destination longitude
   * @returns {Promise<{duration: string, distance: string}>} Travel time and distance
   * 
   * @example
   * ```typescript
   * const travel = await googlePlacesService.getTravelTime(
   *   { lat: 4.7110, lng: -74.0721 },
   *   { lat: 4.6097, lng: -74.0817 }
   * );
   * console.log(travel.duration); // "15 minutos"
   * console.log(travel.distance); // "1.2 km"
   * ```
   */
  async getTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) {
    try {
      const res = await this.client.directions({
        params: {
          key: this.apiKey,
          origin,
          destination,
          mode: TravelMode.walking,
          language: Language.es
        }
      });

      const leg = res.data.routes[0].legs[0];

      return {
        duration: leg.duration.text,
        distance: leg.distance.text
      };
    } catch (err: any) {
      this.logger.error(`Error en Directions API: ${err.message}`);
      return {
        duration: 'No disponible',
        distance: 'No disponible'
      };
    }
  }

  /**
   * Gets best recommended tourist place with full details
   * 
   * @description
   * Combines multiple API calls to provide comprehensive place recommendation:
   * 1. Searches nearby tourist attractions
   * 2. Selects place with highest rating
   * 3. Fetches detailed place information
   * 4. Calculates walking travel time from user location
   * 
   * @param {Object} coords - User location coordinates
   * @param {number} coords.lat - Latitude
   * @param {number} coords.lng - Longitude
   * @returns {Promise<{place: any, details: any, travelTime: {duration: string, distance: string}}>} Complete recommendation
   * @throws {Error} If no places found or place_id invalid
   * 
   * @example
   * ```typescript
   * const recommendation = await googlePlacesService.getRecommendedTouristPlace({
   *   lat: 4.7110,
   *   lng: -74.0721
   * });
   * console.log(recommendation.place.name);
   * console.log(recommendation.details.rating);
   * console.log(recommendation.travelTime.duration);
   * ```
   */
  async getRecommendedTouristPlace(coords: { lat: number; lng: number }) {
    const places = await this.getNearbyTouristPlaces(coords);

    if (!places || places.length === 0) {
      throw new Error('No se encontraron lugares cercanos.');
    }

    const best = places.reduce((a, b) =>
      (b.rating || 0) > (a.rating || 0) ? b : a
    );

    if (!best.place_id) {
      throw new Error('El lugar no tiene place_id válido');
    }

    const details = await this.getPlaceDetails(best.place_id);

    let travelTime = {
      duration: 'No disponible',
      distance: 'No disponible'
    };

    if (best.geometry?.location) {
      travelTime = await this.getTravelTime(coords, best.geometry.location);
    }

    return {
      place: best,
      details,
      travelTime
    };
  }
}