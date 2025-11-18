import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  buildBasicEmailTemplate(message: string, placeName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BuzzCore Notification</h1>
  </div>
  
  <div class="content">
    <h2>¡Hola!</h2>
    <p>${message}</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">📍 ${placeName}</h3>
      <p><strong>Ubicación:</strong> Próxima a tu área actual</p>
    </div>
    
    <p>¡Esperamos que disfrutes esta recomendación!</p>
  </div>
</body>
</html>`;
  }
}