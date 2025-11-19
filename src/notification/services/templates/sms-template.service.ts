import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsTemplateService {
  buildBasicSmsMessage(message: string, placeName: string): string {
    return `BuzzCore Notification\n\n${message}\n\n📍 ${placeName}\n\n¡Disfruta tu experiencia!`;
  }
}