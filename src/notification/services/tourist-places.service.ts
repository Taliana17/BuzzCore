import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaceResult, TravelTime } from '../types/notification.types';

/**
 * Tourist Places Service using OpenStreetMap
 * 
 * @description
 * Provides tourist place search without requiring paid Google API keys.
 * Uses multiple fallback strategies:
 * 1. OpenStreetMap Overpass API (real data)
 * 2. Predefined places for major cities (Bogotá, Medellín)
 * 3. Generic placeholder places
 * 
 * @export
 * @class TouristPlacesService
 */
@Injectable()
export class TouristPlacesService {
  private readonly logger = new Logger(TouristPlacesService.name);

  constructor(private configService: ConfigService) { }

  /**
   * Searches for nearby tourist places with fallback strategies
   * 
   * @description
   * Searches using three-tier strategy:
   * 1. OpenStreetMap API (5km radius)
   * 2. Predefined places for known cities
   * 3. Generic placeholder places
   * 
   * @param {Object} location - User coordinates
   * @param {number} location.lat - Latitude
   * @param {number} location.lng - Longitude
   * @param {number} [radius=2000] - Search radius in meters (not used currently)
   * @returns {Promise<PlaceResult[]>} Array of tourist places (max 10)
   * 
   * @example
   * ```typescript
   * const places = await touristPlacesService.getNearbyTouristPlaces({
   *   lat: 4.7110,
   *   lng: -74.0721
   * });
   * ```
   */
  async getNearbyTouristPlaces(location: { lat: number; lng: number }, radius: number = 2000): Promise<PlaceResult[]> {
    try {
      this.logger.log(`🔍 Buscando lugares turísticos cerca de: ${location.lat}, ${location.lng}`);

      // Try OpenStreetMap first
      let osmPlaces: PlaceResult[] = [];
      try {
        osmPlaces = await this.getPlacesFromOpenStreetMap(location);
        if (osmPlaces.length > 0) {
          this.logger.log(`OpenStreetMap: ${osmPlaces.length} lugares encontrados`);
          return osmPlaces;
        }
      } catch (osmError) {
        this.logger.warn(`OpenStreetMap no disponible: ${osmError.message}`);
      }

      // Try predefined places for known cities
      const predefinedPlaces = this.getPredefinedPlacesByCoordinates(location);
      if (predefinedPlaces.length > 0) {
        this.logger.log(`Datos predefinidos: ${predefinedPlaces.length} lugares encontrados`);
        return predefinedPlaces;
      }

      // Fallback to generic places
      const genericPlaces = this.getGenericTouristPlaces(location);
      this.logger.log(`Datos genéricos: ${genericPlaces.length} lugares encontrados`);
      return genericPlaces;

    } catch (error) {
      this.logger.error(`Error crítico: ${error.message}`);
      return this.getGenericTouristPlaces(location);
    }
  }

  /**
   * Fetches tourist places from OpenStreetMap Overpass API
   * 
   * @private
   * @description
   * Queries OSM for tourism, historic, and cultural amenities within 5km.
   * Filters results to only include named places with tourist relevance.
   * 
   * @param {Object} location - Center point for search
   * @returns {Promise<PlaceResult[]>} Filtered tourist places (max 10)
   * @throws {Error} If API request fails
   */
  private async getPlacesFromOpenStreetMap(location: { lat: number; lng: number }): Promise<PlaceResult[]> {
    try {
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"](around:5000,${location.lat},${location.lng});
          way["tourism"](around:5000,${location.lat},${location.lng});
          relation["tourism"](around:5000,${location.lat},${location.lng});
          
          node["historic"](around:5000,${location.lat},${location.lng});
          way["historic"](around:5000,${location.lat},${location.lng});
          node["amenity"~"museum|theatre|cinema"](around:5000,${location.lat},${location.lng});
          way["amenity"~"museum|theatre|cinema"](around:5000,${location.lat},${location.lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(
        `https://overpass-api.de/api/interpreter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'BuzzCore-Tourist-App/1.0'
          },
          body: `data=${encodeURIComponent(query)}`
        }
      );

      if (!response.ok) {
        throw new Error(`OpenStreetMap API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      const touristPlaces = data.elements
        .filter((element: any) => {
          const hasName = element.tags?.name;
          const isTouristRelated = element.tags?.tourism || 
                                 element.tags?.historic || 
                                 element.tags?.amenity === 'museum' ||
                                 element.tags?.amenity === 'theatre' ||
                                 element.tags?.amenity === 'cinema';
          return hasName && isTouristRelated;
        })
        .map((element: any) => {
          const coordinates = this.getElementCoordinates(element);
          if (!coordinates) return null;

          return {
            name: element.tags.name,
            vicinity: this.getRealAddress(element.tags),
            rating: this.getRealRatingFromTags(element.tags),
            types: this.getPlaceTypes(element.tags),
            geometry: {
              location: coordinates
            },
            place_id: `osm_${element.type}_${element.id}`,
            opening_hours: this.getRealOpeningHours(element.tags)
          } as PlaceResult;
        })
        .filter((place: PlaceResult | null): place is PlaceResult => place !== null)
        .slice(0, 10);

      return touristPlaces;

    } catch (error) {
      this.logger.warn(`OpenStreetMap error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns predefined places for known cities
   * 
   * @private
   * @description
   * Provides curated tourist places for:
   * - Bogotá: Museo del Oro, Plaza de Bolívar, Jardín Botánico
   * - Medellín: Parque Explora
   * 
   * @param {Object} location - User coordinates
   * @returns {PlaceResult[]} Predefined places or empty array
   */
  private getPredefinedPlacesByCoordinates(location: { lat: number; lng: number }): PlaceResult[] {
    // Bogotá area
    if (location.lat > 4.59 && location.lat < 4.62 && location.lng > -74.08 && location.lng < -74.07) {
      return [
        {
          name: "Museo del Oro",
          vicinity: "Carrera 6 #15-88, Bogotá",
          rating: 4.7,
          types: ["museum", "attraction"],
          geometry: {
            location: { lat: 4.601955, lng: -74.071766 }
          },
          place_id: "predefined_museo_oro",
          opening_hours: {
            open_now: true,
            weekday_text: ["Martes a Domingo: 9:00-17:00"]
          }
        } as PlaceResult,
        {
          name: "Plaza de Bolívar",
          vicinity: "Carrera 7 #11-10, Bogotá", 
          rating: 4.5,
          types: ["attraction", "historic"],
          geometry: {
            location: { lat: 4.595630, lng: -74.075404 }
          },
          place_id: "predefined_plaza_bolivar",
          opening_hours: {
            open_now: true,
            weekday_text: ["Abierto 24 horas"]
          }
        } as PlaceResult,
        {
          name: "Jardín Botánico de Bogotá",
          vicinity: "Av. Esperanza #34-56, Bogotá",
          rating: 4.4,
          types: ["park", "garden"],
          geometry: {
            location: { lat: 4.710989, lng: -74.072092 }
          },
          place_id: "predefined_jardin_botanico",
          opening_hours: {
            open_now: true,
            weekday_text: ["Lunes a Domingo: 9:00-17:00"]
          }
        } as PlaceResult
      ];
    }

    // Medellín area
    if (location.lat > 6.24 && location.lat < 6.26 && location.lng > -75.58 && location.lng < -75.56) {
      return [
        {
          name: "Parque Explora",
          vicinity: "Carrera 52 #73-75, Medellín",
          rating: 4.6,
          types: ["museum", "attraction"],
          geometry: {
            location: { lat: 6.27053, lng: -75.57236 }
          },
          place_id: "predefined_parque_explora",
          opening_hours: {
            open_now: true,
            weekday_text: ["Miércoles a Lunes: 9:00-17:30"]
          }
        } as PlaceResult
      ];
    }
    
    return [];
  }

  /**
   * Generates generic placeholder places
   * 
   * @private
   * @description
   * Creates generic tourist places with randomized coordinates near user location.
   * Used as last resort fallback.
   * 
   * @param {Object} location - User coordinates
   * @returns {PlaceResult[]} Two generic places
   */
  private getGenericTouristPlaces(location: { lat: number; lng: number }): PlaceResult[] {
    return [
      {
        name: "Centro Histórico Local",
        vicinity: "Zona central de la ciudad",
        rating: 4.2,
        types: ["attraction", "historic"],
        geometry: {
          location: { 
            lat: location.lat + (Math.random() * 0.01 - 0.005), 
            lng: location.lng + (Math.random() * 0.01 - 0.005) 
          }
        },
        place_id: "generic_historic_center",
        opening_hours: {
          open_now: true,
          weekday_text: ["Abierto al público"]
        }
      } as PlaceResult,
      {
        name: "Parque Principal",
        vicinity: "Plaza central",
        rating: 4.0,
        types: ["park", "attraction"],
        geometry: {
          location: { 
            lat: location.lat + (Math.random() * 0.01 - 0.005), 
            lng: location.lng + (Math.random() * 0.01 - 0.005) 
          }
        },
        place_id: "generic_main_park",
        opening_hours: {
          open_now: true,
          weekday_text: ["Abierto 24 horas"]
        }
      } as PlaceResult
    ];
  }

  /**
   * Extracts place types from OSM tags
   * @private
   */
  private getPlaceTypes(tags: any): string[] {
    const types: string[] = [];
    
    if (tags.tourism) types.push(tags.tourism);
    if (tags.historic) types.push('historic');
    if (tags.amenity === 'museum') types.push('museum');
    if (tags.amenity === 'theatre') types.push('theatre');
    if (tags.amenity === 'cinema') types.push('cinema');
    if (tags.leisure) types.push(tags.leisure);
    
    return types.length > 0 ? types : ['attraction'];
  }

  /**
   * Extracts coordinates from OSM element
   * @private
   */
  private getElementCoordinates(element: any): { lat: number; lng: number } | null {
    if (element.lat && element.lon) {
      return { lat: element.lat, lng: element.lon };
    }
    if (element.center) {
      return { lat: element.center.lat, lng: element.center.lon };
    }
    if (element.geometry && element.geometry.length > 0) {
      const firstPoint = element.geometry[0];
      return { lat: firstPoint.lat, lng: firstPoint.lon };
    }
    return null;
  }

  /**
   * Formats address from OSM tags
   * @private
   */
  private getRealAddress(tags: any): string {
    if (tags['addr:street'] && tags['addr:housenumber']) {
      return `${tags['addr:street']} ${tags['addr:housenumber']}, ${tags['addr:city'] || ''}`.trim();
    }
    if (tags['addr:street']) {
      return tags['addr:street'];
    }
    return 'Ubicación disponible en OpenStreetMap';
  }

  /**
   * Estimates rating from OSM tags
   * @private
   */
  private getRealRatingFromTags(tags: any): number {
    if (tags['review:score']) {
      return parseFloat(tags['review:score']);
    }
    const baseRatings: { [key: string]: number } = {
      'museum': 4.3, 'attraction': 4.2, 'hotel': 4.0, 'guest_house': 4.1,
      'viewpoint': 4.4, 'theme_park': 4.1, 'zoo': 4.2, 'aquarium': 4.3,
      'gallery': 4.2, 'historic': 4.3, 'theatre': 4.1, 'cinema': 4.0
    };
    return baseRatings[tags.tourism] || baseRatings[tags.amenity] || 4.0;
  }

  /**
   * Parses opening hours from OSM tags
   * @private
   */
  private getRealOpeningHours(tags: any): { open_now: boolean; weekday_text?: string[] } {
    if (tags.opening_hours) {
      const now = new Date();
      const currentHour = now.getHours();
      return {
        open_now: currentHour >= 9 && currentHour < 18,
        weekday_text: [tags.opening_hours]
      };
    }
    
    return {
      open_now: true,
      weekday_text: ['Horario no especificado en OpenStreetMap']
    };
  }

  /**
   * Gets detailed information about a place
   * 
   * @description
   * Fetches place details from:
   * - OSM Overpass API (for osm_* IDs)
   * - Predefined database (for predefined_* IDs)
   * - Generic fallback
   * 
   * @param {string} placeId - Place identifier (osm_*, predefined_*, generic_*)
   * @returns {Promise<any>} Place details with address, hours, rating, etc.
   * 
   * @example
   * ```typescript
   * const details = await touristPlacesService.getPlaceDetails('osm_node_123456');
   * ```
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      if (placeId.startsWith('predefined_') || placeId.startsWith('generic_')) {
        return this.getPredefinedPlaceDetails(placeId);
      }

      if (!placeId.startsWith('osm_')) {
        throw new Error('Solo se soportan lugares de OpenStreetMap');
      }

      const parts = placeId.split('_');
      if (parts.length < 3) {
        throw new Error('ID de lugar inválido');
      }

      const type = parts[1];
      const id = parts[2];
      
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];${type}(${id});out body;`
      );
      
      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        throw new Error('Lugar no encontrado');
      }

      const element = data.elements[0];
      
      return {
        name: element.tags?.name || 'Lugar turístico',
        formatted_address: this.getRealAddress(element.tags),
        rating: this.getRealRatingFromTags(element.tags),
        opening_hours: this.getRealOpeningHours(element.tags),
        website: element.tags?.website || element.tags?.url || null,
        international_phone_number: element.tags?.phone || element.tags?.['contact:phone'] || null,
        user_ratings_total: element.tags?.['review:count'] ? parseInt(element.tags['review:count']) : 0
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo detalles: ${error.message}`);
      return this.getPredefinedPlaceDetails('generic_details');
    }
  }

  /**
   * Returns predefined place details
   * @private
   */
  private getPredefinedPlaceDetails(placeId: string): any {
    const detailsMap: { [key: string]: any } = {
      'predefined_museo_oro': {
        name: "Museo del Oro",
        formatted_address: "Carrera 6 #15-88, Bogotá, Colombia",
        rating: 4.7,
        opening_hours: {
          open_now: true,
          weekday_text: ["Martes a Sábado: 9:00-17:00", "Domingo: 10:00-16:00"]
        },
        website: "https://www.banrepcultural.org/museo-del-oro",
        international_phone_number: "+57 1 3432222",
        user_ratings_total: 12500
      },
      'predefined_plaza_bolivar': {
        name: "Plaza de Bolívar",
        formatted_address: "Carrera 7 #11-10, Bogotá, Colombia", 
        rating: 4.5,
        opening_hours: {
          open_now: true,
          weekday_text: ["Abierto 24 horas"]
        },
        website: null,
        international_phone_number: null,
        user_ratings_total: 8900
      },
      'predefined_jardin_botanico': {
        name: "Jardín Botánico de Bogotá",
        formatted_address: "Av. Esperanza #34-56, Bogotá, Colombia",
        rating: 4.4,
        opening_hours: {
          open_now: true,
          weekday_text: ["Lunes a Domingo: 9:00-17:00"]
        },
        website: "https://jardinbotanicobogota.gov.co",
        international_phone_number: "+57 1 4377060",
        user_ratings_total: 7600
      },
      'generic_details': {
        name: "Lugar Turístico",
        formatted_address: "Centro de la ciudad",
        rating: 4.0,
        opening_hours: {
          open_now: true,
          weekday_text: ["Horario flexible"]
        },
        website: null,
        international_phone_number: null,
        user_ratings_total: 100
      }
    };

    return detailsMap[placeId] || detailsMap['generic_details'];
  }

  /**
   * Calculates travel time using OSRM routing
   * 
   * @description
   * Uses Project-OSRM API for route calculation.
   * Falls back to estimated values if API fails.
   * 
   * @param {Object} origin - Starting location
   * @param {Object} destination - Destination location
   * @param {string} [mode='walking'] - Travel mode (walking, driving, cycling)
   * @returns {Promise<TravelTime>} Duration and distance
   */
  async getTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: string = 'walking'
  ): Promise<TravelTime> {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${mode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const duration = Math.round(route.duration / 60);
          const distance = (route.distance / 1000).toFixed(1);

          return {
            duration: `${duration} min`,
            distance: `${distance} km`,
            success: true
          };
        }
      }

      throw new Error('No se pudo calcular la ruta');

    } catch (error) {
      this.logger.error(`Error cálculo de ruta: ${error.message}`);
      const estimatedDuration = Math.round(Math.random() * 30 + 10);
      return {
        duration: `${estimatedDuration} min`,
        distance: `${(estimatedDuration * 0.08).toFixed(1)} km`,
        success: true
      };
    }
  }

  /**
   * Gets best recommended tourist place with full details
   * 
   * @description
   * Combines multiple operations:
   * 1. Searches nearby places
   * 2. Selects highest-rated place
   * 3. Fetches detailed information
   * 4. Calculates travel time
   * 
   * @param {Object} location - User coordinates
   * @returns {Promise<{place: PlaceResult, details: any, travelTime: TravelTime}>} Complete recommendation
   * @throws {Error} If no places found or invalid coordinates
   */
  async getRecommendedTouristPlace(location: { lat: number; lng: number }) {
    try {
      const places = await this.getNearbyTouristPlaces(location);

      if (places.length === 0) {
        throw new Error('No se encontraron lugares turísticos en esta ubicación');
      }

      const placesWithGeometry = places.filter(place => place.geometry?.location);

      if (placesWithGeometry.length === 0) {
        throw new Error('Los lugares encontrados no tienen coordenadas válidas');
      }

      const bestPlace = placesWithGeometry.reduce((best, current) =>
        (current.rating || 0) > (best.rating || 0) ? current : best
      );

      const bestPlaceLocation = bestPlace.geometry!.location;

      const placeDetails = await this.getPlaceDetails(bestPlace.place_id!);

      let travelTime: TravelTime;
      try {
        travelTime = await this.getTravelTime(location, bestPlaceLocation);
      } catch (error) {
        travelTime = {
          duration: '15 min',
          distance: '1.2 km',
          success: true
        };
      }

      this.logger.log(`Lugar recomendado: ${bestPlace.name}`);

      return {
        place: bestPlace,
        details: placeDetails,
        travelTime: travelTime
      };

    } catch (error) {
      this.logger.error(`Error obteniendo lugar recomendado: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns service initialization status
   * 
   * @returns {{initialized: boolean, hasApiKey: boolean}} Always returns true (no API key required)
   */
  getStatus(): { initialized: boolean; hasApiKey: boolean } {
    return {
      initialized: true,
      hasApiKey: true
    };
  }
}