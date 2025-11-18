import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Google Geocoding API Service
 * 
 * @description
 * Provides geocoding operations using Google Maps Geocoding API.
 * Converts coordinates to addresses (reverse geocoding) and extracts city names.
 * Requires GOOGLE_GEOCODING_KEY environment variable.
 * 
 * @export
 * @class GeocodingService
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private apiKey: string | null;

  /**
   * Creates an instance of GeocodingService
   * 
   * @param {ConfigService} configService - NestJS config service for environment variables
   */
  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_GEOCODING_KEY') || null;

    if (!this.apiKey) {
      this.logger.error('GOOGLE_GEOCODING_KEY no está configurada en .env');
    }
  }

  /**
   * Converts coordinates to address using reverse geocoding
   * 
   * @description
   * Calls Google Maps Geocoding API to get address components from coordinates.
   * Returns full API response with all address components.
   * 
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lng - Longitude (-180 to 180)
   * @returns {Promise<any>} Google Geocoding API response with address components
   * @throws {Error} If API key is not configured or API call fails
   * 
   * @example
   * ```typescript
   * const result = await geocodingService.reverseGeocode(4.7110, -74.0721);
   * console.log(result.results[0].formatted_address); // "Bogotá, Colombia"
   * ```
   */
  async reverseGeocode(lat: number, lng: number) {
    if (!this.apiKey) {
      throw new Error('No hay GOOGLE_GEOCODING_KEY configurada');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;

    try {
      const res = await axios.get(url);

      if (res.data.status !== 'OK') {
        throw new Error(res.data.error_message || 'Fallo Geocoding API');
      }

      return res.data;
    } catch (err: any) {
      this.logger.error('Error consultando Geocoding API: ' + err.message);
      throw err;
    }
  }

  /**
   * Extracts city name from coordinates
   * 
   * @description
   * Uses reverse geocoding to get address components and extracts the locality (city).
   * Returns 'Ciudad desconocida' if city cannot be determined.
   * 
   * @param {number} lat - Latitude (-90 to 90)
   * @param {number} lng - Longitude (-180 to 180)
   * @returns {Promise<string>} City name or 'Ciudad desconocida'
   * 
   * @example
   * ```typescript
   * const city = await geocodingService.getCity(4.7110, -74.0721);
   * console.log(city); // "Bogotá"
   * ```
   */
  async getCity(lat: number, lng: number): Promise<string> {
    const data = await this.reverseGeocode(lat, lng);

    const cityComp = data.results[0]?.address_components?.find((c: any) =>
      c.types.includes('locality')
    );

    return cityComp?.long_name || 'Ciudad desconocida';
  }
}