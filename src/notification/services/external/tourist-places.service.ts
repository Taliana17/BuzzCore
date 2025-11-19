import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlaceFinder, Coordinates, PlaceResult, PlaceDetails, TravelTime, RecommendedPlace } from '../../interfaces/location-detector.interface';

@Injectable()
export class TouristPlacesService implements PlaceFinder {
  private readonly logger = new Logger(TouristPlacesService.name);

  constructor(private configService: ConfigService) { }

  async findNearbyPlaces(location: Coordinates, radius: number = 2000): Promise<PlaceResult[]> {
    try {
      this.logger.log(`🔍 Searching tourist places near: ${location.lat}, ${location.lng}`);
      const osmPlaces = await this.getPlacesFromOpenStreetMap(location);

      if (osmPlaces.length === 0) {
        throw new Error('No tourist places found in the area');
      }

      this.logger.log(`OpenStreetMap: ${osmPlaces.length} places found`);
      return osmPlaces;

    } catch (error) {
      this.logger.error(`Error getting tourist places: ${error.message}`);
      throw new Error(`Tourist places service unavailable: ${error.message}`);
    }
  }

  async findRecommendedPlace(location: Coordinates): Promise<RecommendedPlace> {
    try {
      const places = await this.findNearbyPlaces(location);

      if (places.length === 0) {
        throw new Error('No places found in the area');
      }

      const placesWithGeometry = places.filter(place => place.geometry?.location);

      if (placesWithGeometry.length === 0) {
        throw new Error('Found places but no valid coordinates available');
      }

      const placesWithDistance = await Promise.all(
        placesWithGeometry.map(async (place) => {
          try {
            const travelTime = await this.calculateTravelTime(location, place.geometry!.location);
            return {
              place,
              travelTime,
              distanceInMeters: this.distanceToMeters(travelTime.distance)
            };
          } catch (error) {
            this.logger.warn(`Error calculando ruta para ${place.name}: ${error.message}`);
            return {
              place,
              travelTime: { duration: 'N/A', distance: 'N/A', success: false },
              distanceInMeters: Number.MAX_SAFE_INTEGER
            };
          }
        })
      );

      const closestPlace = placesWithDistance.reduce((closest, current) => 
        current.distanceInMeters < closest.distanceInMeters ? current : closest
      );

      const placeDetails = await this.getPlaceDetails(closestPlace.place.place_id!);

      this.logger.log(`📍 Closest place: ${closestPlace.place.name} (${closestPlace.travelTime.distance} - ${closestPlace.travelTime.duration})`);

      return {
        place: closestPlace.place,
        details: placeDetails,
        travelTime: closestPlace.travelTime
      };

    } catch (error) {
      this.logger.error(`Error getting recommended tourist place: ${error.message}`);
      throw error;
    }
  }

  async calculateTravelTime(
    origin: Coordinates,
    destination: Coordinates,
    mode: string = 'foot-walking'
  ): Promise<TravelTime> {
    try {
      this.logger.log(`🔄 Calculando ruta con OpenRouteService...`);
      
      const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZmOGQxZWFlOTdiMTRlN2FhODEyNjIyNGM2NDg3M2Q4IiwiaCI6Im11cm11cjY0In0=';
      
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${apiKey}&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`
      );

      this.logger.log(`📡 Status OpenRouteService: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`❌ OpenRouteService error: ${response.status} - ${errorData}`);
        throw new Error(`OpenRouteService API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const segment = route.properties.segments[0];
        
        const duration = this.formatDuration(segment.duration);
        const distance = this.formatDistance(segment.distance);
        
        this.logger.log(`✅ Ruta encontrada: ${duration}, ${distance}`);
        
        return {
          duration: duration,
          distance: distance,
          success: true
        };
      } else {
        this.logger.error('❌ OpenRouteService: No se encontraron rutas en la respuesta');
        throw new Error('No route found in OpenRouteService response');
      }

    } catch (error) {
      this.logger.error(`❌ OpenRouteService error: ${error.message}`);
      throw new Error(`Route calculation service unavailable: ${error.message}`);
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    try {
      if (!placeId.startsWith('osm_')) {
        throw new Error('Only OpenStreetMap places are supported');
      }

      const parts = placeId.split('_');
      if (parts.length < 3) {
        throw new Error('Invalid place ID');
      }

      const type = parts[1];
      const id = parts[2];

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];${type}(${id});out body;>;out skel qt;`
      );

      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        throw new Error('Place not found');
      }

      const element = data.elements[0];
      const tags = element.tags || {};

      const address = this.getRealAddress(tags);
      const openingHours = this.getRealOpeningHours(tags);
      
      return {
        name: tags.name || 'Tourist place',
        formatted_address: address,
        rating: this.getRealRatingFromTags(tags),
        opening_hours: openingHours,
        website: tags.website || tags.url || null,
        international_phone_number: tags.phone || tags['contact:phone'] || null,
        user_ratings_total: tags['review:count'] ? parseInt(tags['review:count']) : 0,
      };

    } catch (error) {
      this.logger.error(`❌ Error getting details: ${error.message}`);
      
      return {
        name: 'Tourist place',
        formatted_address: 'Location available on OpenStreetMap',
        rating: 4.0,
        opening_hours: {
          open_now: true,
          weekday_text: ['Hours not specified in OpenStreetMap']
        },
        user_ratings_total: 0
      };
    }
  }

  private async getPlacesFromOpenStreetMap(location: Coordinates): Promise<PlaceResult[]> {
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
        throw new Error('No elements found in OpenStreetMap response');
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

      if (touristPlaces.length === 0) {
        throw new Error('No tourist places found after filtering');
      }

      return touristPlaces;

    } catch (error) {
      this.logger.error(`OpenStreetMap API error: ${error.message}`);
      throw new Error(`OpenStreetMap service unavailable: ${error.message}`);
    }
  }

  private getElementCoordinates(element: any): Coordinates | null {
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

  private getRealAddress(tags: any): string {
    const addressParts: string[] = [];
    
    if (tags['addr:housenumber']) {
      addressParts.push(tags['addr:housenumber']);
    }
    
    if (tags['addr:street']) {
      addressParts.push(tags['addr:street']);
    }
    
    if (tags['addr:city']) {
      addressParts.push(tags['addr:city']);
    } else if (tags['addr:suburb']) {
      addressParts.push(tags['addr:suburb']);
    }
    
    if (tags['addr:postcode']) {
      addressParts.push(tags['addr:postcode']);
    }

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    if (tags['address']) {
      return tags['address'];
    }
    
    if (tags['contact:address']) {
      return tags['contact:address'];
    }

    if (tags['name']) {
      return `${tags['name']}, Bogotá`;
    }

    return 'Location available on OpenStreetMap';
  }

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

  private getRealOpeningHours(tags: any): { open_now: boolean; weekday_text?: string[] } {
    if (tags.opening_hours) {
      try {
        const openingHours = tags.opening_hours;
        const now = new Date();
        const currentHour = now.getHours();
        
        if (currentHour >= 9 && currentHour < 18) {
          return {
            open_now: true,
            weekday_text: this.formatOpeningHours(openingHours)
          };
        }
        
        return {
          open_now: false,
          weekday_text: this.formatOpeningHours(openingHours)
        };
      } catch (error) {
        this.logger.warn(`Error parsing opening hours: ${tags.opening_hours}`);
      }
    }

    return this.getDefaultOpeningHours(tags);
  }

  private formatOpeningHours(openingHours: string): string[] {
    try {
      if (openingHours.includes(';')) {
        return openingHours.split(';').map(period => period.trim());
      }
      return [openingHours];
    } catch (error) {
      return [openingHours];
    }
  }

  private getDefaultOpeningHours(tags: any): { open_now: boolean; weekday_text?: string[] } {
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    let defaultHours: string[];
    let openNow = true;
    
    if (tags.tourism === 'museum' || tags.amenity === 'museum') {
      defaultHours = ['Lunes a Viernes: 9:00 - 17:00', 'Sábados: 10:00 - 16:00', 'Domingos: Cerrado'];
      openNow = !isWeekend && currentHour >= 9 && currentHour < 17;
    } else if (tags.tourism === 'attraction' || tags.historic) {
      defaultHours = ['Todos los días: 8:00 - 18:00'];
      openNow = currentHour >= 8 && currentHour < 18;
    } else if (tags.amenity === 'theatre' || tags.amenity === 'cinema') {
      defaultHours = ['Lunes a Domingo: 10:00 - 22:00'];
      openNow = currentHour >= 10 && currentHour < 22;
    } else {
      defaultHours = ['Horario comercial: 9:00 - 18:00'];
      openNow = currentHour >= 9 && currentHour < 18;
    }
    
    return {
      open_now: openNow,
      weekday_text: defaultHours
    };
  }

  private distanceToMeters(distanceText: string): number {
    if (distanceText === 'N/A' || !distanceText) return Number.MAX_SAFE_INTEGER;
    
    try {
      if (distanceText.includes('km')) {
        const km = parseFloat(distanceText.replace('km', '').trim());
        return km * 1000;
      } else if (distanceText.includes('m')) {
        return parseFloat(distanceText.replace('m', '').trim());
      }
      return Number.MAX_SAFE_INTEGER;
    } catch (error) {
      return Number.MAX_SAFE_INTEGER;
    }
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  }

  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km} km`;
    }
  }

  getStatus(): { initialized: boolean; hasApiKey: boolean } {
    return {
      initialized: true,
      hasApiKey: false
    };
  }
}