import { Notification } from '../entities/notification.entity';

export interface NotificationProcessor {
  process(notification: Notification): Promise<void>;
  canProcess(notification: Notification): boolean;
}

export interface NotificationProvider {
  send(notification: Notification): Promise<NotificationResult>;
  getType(): string;
}

export interface TemplateBuilder {
  buildTemplate(notification: Notification): string;
  supports(notification: Notification): boolean;
}

export interface NotificationResult {
  success: boolean;
  id?: string;
  error?: string;
}