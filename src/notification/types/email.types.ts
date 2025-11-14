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