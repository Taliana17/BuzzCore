import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Language,
  TravelMode
} from '@googlemaps/google-maps-services-js';

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private client: Client;
  private apiKey!: string; // aseguramos que será string

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});

    const key = this.configService.get<string>('GOOGLE_API_KEY');

    if (!key) {
      this.logger.error('GOOGLE_API_KEY faltante en el .env');
      throw new Error('GOOGLE_API_KEY es obligatoria');
    }

    this.apiKey = key;
  }

  /** Buscar lugares turísticos cercanos */
  async getNearbyTouristPlaces(coords: { lat: number; lng: number }) {
    try {
      const response = await this.client.placesNearby({
        params: {
          key: this.apiKey,
          location: coords,
          radius: 3000,
          type: 'tourist_attraction',
          language: Language.es // ✔ enum correcto
        }
      });

      return response.data.results;
    } catch (err: any) {
      this.logger.error(`Error en Places API: ${err.message}`);
      throw new Error('Error consultando lugares turísticos');
    }
  }

  /** Detalles del lugar */
  async getPlaceDetails(placeId: string) {
    try {
      const res = await this.client.placeDetails({
        params: {
          key: this.apiKey,
          place_id: placeId,
          language: Language.es // ✔ enum correcto
        }
      });

      return res.data.result;
    } catch (err: any) {
      this.logger.error(`Error al obtener detalles del lugar: ${err.message}`);
      throw new Error('Error obteniendo detalles del lugar');
    }
  }

  /** Tiempo de viaje */
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
          mode: TravelMode.walking, // ✔ enum correcto
          language: Language.es // ✔ enum correcto
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

  /** Mejor lugar turístico */
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
