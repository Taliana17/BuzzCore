import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaceResult } from '../types/notification.types';

@Injectable()
export class GooglePlacesService implements OnModuleInit {
  private readonly logger = new Logger(GooglePlacesService.name);
  private googleMaps: any;
  private isInitialized: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps() {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('GOOGLE_API_KEY not found, Google Places will use mock data');
      return;
    }

    try {
      const googleMapsModule = await import('@google/maps');
      
      // Diferentes formas en que puede exportarse
      if (googleMapsModule.default) {
        // Si tiene export default
        const GoogleMaps = googleMapsModule.default;
        this.googleMaps = GoogleMaps.createClient({
          key: apiKey,
          Promise: Promise
        });
      } else if (googleMapsModule.createClient) {
        // Si exporta createClient directamente
        this.googleMaps = googleMapsModule.createClient({
          key: apiKey,
          Promise: Promise
        });
      } else {
        throw new Error('Could not find Google Maps client constructor');
      }
      
      this.isInitialized = true;
      this.logger.log(' Google Maps Client initialized successfully');
    } catch (error) {
      this.logger.error(' Failed to initialize Google Maps Client:', error.message);
      this.logger.warn('Using mock data for development');
      this.isInitialized = false;
    }
  }

  async getNearbyPlaces(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
    if (!this.isInitialized || !this.googleMaps) {
      this.logger.log('Using mock places data');
      return this.getMockPlaces();
    }

    try {
      this.logger.debug(`Searching places near: ${location.lat}, ${location.lng}`);
      
      const response = await this.googleMaps.placesNearby({
        location: [location.lat, location.lng],
        radius: radius,
        type: 'restaurant',
      }).asPromise();

      this.logger.log(` Found ${response.json.results?.length || 0} places`);
      
      return response.json.results.map(place => ({
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        types: place.types,
        geometry: place.geometry
      }));
    } catch (error) {
      this.logger.error(` Error fetching nearby places: ${error.message}`);
      this.logger.log('Falling back to mock data');
      return this.getMockPlaces();
    }
  }

  async getPlaceDetails(placeName: string, location: { lat: number; lng: number }): Promise<any> {
    if (!this.isInitialized || !this.googleMaps) {
      this.logger.log('Using mock place details');
      return this.getMockPlaceDetails(placeName);
    }

    try {
      this.logger.debug(`Getting details for: ${placeName}`);
      
      const searchResponse = await this.googleMaps.places({
        query: placeName,
        location: [location.lat, location.lng],
        radius: 10000,
      }).asPromise();

      if (searchResponse.json.results.length > 0) {
        const placeId = searchResponse.json.results[0].place_id;
        this.logger.log(` Found place ID: ${placeId}`);
        
        const detailsResponse = await this.googleMaps.place({
          placeid: placeId,
        }).asPromise();

        return detailsResponse.json.result;
      }

      this.logger.warn(` No places found for: ${placeName}`);
      return this.getMockPlaceDetails(placeName);
    } catch (error) {
      this.logger.error(`Error getting place details: ${error.message}`);
      return this.getMockPlaceDetails(placeName);
    }
  }

  // Datos de prueba mejorados
  private getMockPlaces(): PlaceResult[] {
    this.logger.log('Returning mock places data');
    return [
      {
        name: 'Centro Comercial Santafé',
        vicinity: 'Autopista Norte #245-60, Bogotá',
        rating: 4.5,
        types: ['shopping_mall', 'point_of_interest'],
        geometry: {
          location: {
            lat: 4.710989,
            lng: -74.072092
          }
        }
      },
      {
        name: 'Restaurante Andrés Carne de Res',
        vicinity: 'Calle 183 #45-60, Bogotá',
        rating: 4.7,
        types: ['restaurant', 'food', 'point_of_interest'],
        geometry: {
          location: {
            lat: 4.711500,
            lng: -74.071800
          }
        }
      },
      {
        name: 'Parque de la 93',
        vicinity: 'Calle 93A #11A-51, Bogotá',
        rating: 4.3,
        types: ['park', 'point_of_interest'],
        geometry: {
          location: {
            lat: 4.675500,
            lng: -74.052300
          }
        }
      }
    ];
  }

  private getMockPlaceDetails(placeName: string): any {
    this.logger.log(` Returning mock details for: ${placeName}`);
    return {
      name: placeName,
      formatted_address: 'Dirección simulada para desarrollo',
      rating: 4.5,
      opening_hours: { 
        open_now: true,
        weekday_text: [
          'Lunes: 9:00 AM - 8:00 PM',
          'Martes: 9:00 AM - 8:00 PM',
          'Miércoles: 9:00 AM - 8:00 PM',
          'Jueves: 9:00 AM - 8:00 PM',
          'Viernes: 9:00 AM - 9:00 PM',
          'Sábado: 9:00 AM - 9:00 PM',
          'Domingo: 10:00 AM - 7:00 PM'
        ]
      },
      international_phone_number: '+57 1 1234567',
      website: 'https://example.com'
    };
  }

  getStatus(): { initialized: boolean; hasApiKey: boolean } {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    return {
      initialized: this.isInitialized,
      hasApiKey: !!apiKey,
    };
  }
}