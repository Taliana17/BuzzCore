import { TravelTime } from '../types/notification.types';

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<EmailResult>;
  sendTouristNotification(
    to: string, 
    userName: string,
    city: string,
    placeName: string,
    placeDetails: any,
    travelTime: TravelTime 
  ): Promise<EmailResult>;
  getStatus(): ProviderStatus;
}

export interface SmsProvider {
  send(to: string, message: string): Promise<SmsResult>;
  sendTouristNotification(
    to: string, 
    userName: string,
    city: string,
    placeName: string,
    travelTime: TravelTime 
  ): Promise<SmsResult>;
  validatePhoneNumber(phone: string): boolean;
  getStatus(): ProviderStatus;
}

export interface EmailResult {
  id?: string;
  success: boolean;
  error?: string;
}

export interface SmsResult {
  sid?: string;
  success: boolean;
  error?: string;
}

export interface ProviderStatus {
  initialized: boolean;
  service: string;
  [key: string]: any;
}