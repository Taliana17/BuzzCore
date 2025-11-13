import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private apiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_GEOCODING_KEY') || null;

    if (!this.apiKey) {
      this.logger.error('GOOGLE_GEOCODING_KEY no está configurada en .env');
    }
  }

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

  async getCity(lat: number, lng: number): Promise<string> {
    const data = await this.reverseGeocode(lat, lng);

    const cityComp = data.results[0]?.address_components?.find((c: any) =>
      c.types.includes('locality')
    );

    return cityComp?.long_name || 'Ciudad desconocida';
  }
}
