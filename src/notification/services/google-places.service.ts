import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaceResult, TravelTime } from '../types/notification.types';

@Injectable()
export class GooglePlacesService implements OnModuleInit {
  private readonly logger = new Logger(GooglePlacesService.name);
  private googleMaps: any;
  private isInitialized: boolean = false;
  private hasValidApiKey: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps() {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    
    if (!apiKey || apiKey.includes('mock') || apiKey.length < 10) {
      this.logger.error('GOOGLE_API_KEY NO VÁLIDA para producción');
      this.logger.error('Configura una API key real en .env');
      this.hasValidApiKey = false;
      return;
    }

    try {
      const { createClient } = await import('@google/maps');
      
      this.googleMaps = createClient({
        key: apiKey,
        Promise: Promise,
        language: 'es',
        region: 'co'
      });
      
      await this.testApiConnection();
      this.isInitialized = true;
      this.hasValidApiKey = true;
      this.logger.log('Google Maps Client INICIALIZADO CON DATOS REALES');
    } catch (error) {
      this.logger.error(`FALLÓ INICIALIZACIÓN DE GOOGLE MAPS: ${error.message}`);
      this.hasValidApiKey = false;
      throw error;
    }
  }

  private async testApiConnection(): Promise<void> {
    try {
      const testResponse = await this.googleMaps.placesNearby({
        location: [4.710989, -74.072092],
        radius: 1000,
        type: 'tourist_attraction'
      }).asPromise();
      
      this.logger.log(`Google Places API CONECTADA - Encontrados ${testResponse.json.results?.length || 0} lugares`);
    } catch (error: any) {
      const errorDetails = error.json?.error_message || error.message;
      this.logger.error(`TEST DE GOOGLE PLACES FALLÓ: ${errorDetails}`);
      
      if (errorDetails.includes('API key')) {
        throw new Error('API key de Google inválida o sin permisos');
      }
      throw error;
    }
  }

  async getNearbyTouristPlaces(location: { lat: number; lng: number }, radius: number = 2000): Promise<PlaceResult[]> {
    if (!this.isInitialized || !this.hasValidApiKey) {
      throw new Error('Google Places API no configurada para producción');
    }

    try {
      this.logger.log(`BUSCANDO LUGARES TURÍSTICOS REALES en: ${location.lat}, ${location.lng}`);
      
      const response = await this.googleMaps.placesNearby({
        location: [location.lat, location.lng],
        radius: radius,
        type: 'tourist_attraction',
        rankby: 'prominence',
        language: 'es'
      }).asPromise();

      if (response.json && response.json.results) {
        const places = response.json.results;
        this.logger.log(`ENCONTRADOS ${places.length} LUGARES TURÍSTICOS REALES`);
        
        return places.map(place => ({
          name: place.name,
          vicinity: place.vicinity,
          rating: place.rating,
          types: place.types,
          geometry: place.geometry,
          opening_hours: place.opening_hours,
          photos: place.photos,
          place_id: place.place_id 
        })).filter(place => 
          place.rating >= 3.5
        );
      } else {
        throw new Error('Respuesta inválida de Google Places API');
      }
    } catch (error: any) {
      this.logger.error(`ERROR BUSCANDO LUGARES REALES: ${error.message}`);
      throw new Error(`No se pudieron obtener lugares turísticos: ${error.message}`);
    }
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Google Places API no configurada');
    }

    try {
      this.logger.log(`OBTENIENDO DETALLES REALES para: ${placeId}`);
      
      const response = await this.googleMaps.place({
        placeid: placeId,
        fields: [
          'name', 
          'formatted_address', 
          'rating', 
          'opening_hours', 
          'website', 
          'international_phone_number',
          'photos',
          'user_ratings_total'
        ],
        language: 'es'
      }).asPromise();

      return response.json.result;
    } catch (error: any) {
      this.logger.error(`ERROR OBTENIENDO DETALLES: ${error.message}`);
      throw error;
    }
  }

  async getTravelTime(
    origin: { lat: number; lng: number }, 
    destination: { lat: number; lng: number },
    mode: string = 'walking'
  ): Promise<TravelTime> {
    if (!this.isInitialized) {
      throw new Error('Google Directions API no configurada');
    }

    try {
      this.logger.log(`CALCULANDO TIEMPO REAL DE VIAJE`);
      
      const response = await this.googleMaps.directions({
        origin: [origin.lat, origin.lng],
        destination: [destination.lat, destination.lng],
        mode: mode,
        language: 'es',
        units: 'metric'
      }).asPromise();

      if (response.json.routes && response.json.routes.length > 0) {
        const route = response.json.routes[0];
        const leg = route.legs[0];
        
        this.logger.log(`TIEMPO REAL: ${leg.duration.text}, Distancia: ${leg.distance.text}`);
        
        return {
          duration: leg.duration.text,
          distance: leg.distance.text,
          success: true
        };
      } else {
        throw new Error('No se encontraron rutas');
      }
    } catch (error: any) {
      this.logger.error(`ERROR CALCULANDO TIEMPO DE VIAJE: ${error.message}`);
      return { 
        duration: 'No disponible', 
        distance: 'No disponible', 
        success: false 
      };
    }
  }

  async getRecommendedTouristPlace(location: { lat: number; lng: number }) {
    try {
      const places = await this.getNearbyTouristPlaces(location, 3000);
      
      if (places.length === 0) {
        throw new Error('No se encontraron lugares turísticos cercanos');
      }

      const bestPlace = places.reduce((best, current) => 
        (current.rating || 0) > (best.rating || 0) ? current : best
      );

      const placeDetails = await this.getPlaceDetails(bestPlace.place_id!);

      let travelTime: TravelTime = { duration: 'No disponible', distance: 'No disponible', success: false };
      if (bestPlace.geometry?.location) {
        travelTime = await this.getTravelTime(location, bestPlace.geometry.location);
      }

      return {
        place: bestPlace,
        details: placeDetails,
        travelTime: travelTime
      };
    } catch (error) {
      this.logger.error(`ERROR OBTENIENDO LUGAR RECOMENDADO: ${error.message}`);
      throw error;
    }
  }

  getStatus(): { initialized: boolean; hasValidApiKey: boolean } {
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    return {
      initialized: this.isInitialized,
      hasValidApiKey: !!(apiKey && apiKey.length > 10 && !apiKey.includes('mock'))
    };
  }
}