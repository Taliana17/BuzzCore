import { Injectable, Logger } from '@nestjs/common';
import { LocationDetector, CityDetectionResult, Coordinates } from '../../interfaces/location-detector.interface';

@Injectable()
export class CityDetectionService implements LocationDetector {
  private readonly logger = new Logger(CityDetectionService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';

  async detectCity(coordinates: Coordinates): Promise<CityDetectionResult> {
    try {
      this.logger.log(`🔍 Detectando ciudad para coordenadas: ${coordinates.lat}, ${coordinates.lng}`);

      const params = new URLSearchParams({
        format: 'json',
        lat: coordinates.lat.toString(),
        lon: coordinates.lng.toString(),
        addressdetails: '1',
        zoom: '10',
        'accept-language': 'es'
      });

      const url = `${this.nominatimUrl}?${params}`;
      
      this.logger.log(`🌐 Consultando: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'BuzzCore-Tourist-App/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.address) {
        throw new Error('No se pudo obtener la dirección desde las coordenadas');
      }

      const address = data.address;
      const city = address.city || address.town || address.village || address.municipality || address.county;
      const country = address.country;

      if (!city) {
        this.logger.warn(`No se pudo detectar ciudad específica. Datos: ${JSON.stringify(address)}`);
        return {
          city: 'Ubicación actual',
          country: country || 'Desconocido',
          fullAddress: data.display_name,
          lat: coordinates.lat,
          lng: coordinates.lng,
          success: false
        };
      }

      this.logger.log(`✅ Ciudad detectada: ${city}, ${country}`);

      return {
        city,
        country,
        fullAddress: data.display_name,
        lat: coordinates.lat,
        lng: coordinates.lng,
        success: true
      };

    } catch (error) {
      this.logger.error(`❌ Error detectando ciudad: ${error.message}`);
      
      return {
        city: 'Ubicación actual',
        country: 'Desconocido',
        fullAddress: `Coordenadas: ${coordinates.lat}, ${coordinates.lng}`,
        lat: coordinates.lat,
        lng: coordinates.lng,
        success: false
      };
    }
  }

  validateCoordinates(coordinates: Coordinates): boolean {
    return coordinates.lat >= -90 && coordinates.lat <= 90 && 
           coordinates.lng >= -180 && coordinates.lng <= 180;
  }

  getStatus(): { available: boolean; service: string } {
    return {
      available: true,
      service: 'OpenStreetMap Nominatim'
    };
  }
}