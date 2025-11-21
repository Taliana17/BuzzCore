# 💛🐝 BuzzCore API  
### Aplicación Inteligente de Notificaciones y Recomendaciones Turísticas  
*Desarrollado con NestJS · PostgreSQL · Redis · BullMQ · Google Places · Twilio · Resend*

## 📝 Descripción

**BuzzCore API** es un sistema inteligente de notificaciones multicanal que envía recomendaciones turísticas personalizadas basadas en la ubicación del usuario.

Canales disponibles:

- 📧 Email – Resend  
- 📱 SMS – Twilio  
- 🔔 Push Notifications 

Fuentes utilizadas:

- 🌍 Google Places API  
- 🗺️ OpenStreetMap Nominatim  

BuzzCore usa **NestJS**, colas con **BullMQ + Redis**, **PostgreSQL**, procesamiento asíncrono y reintentos automáticos.

## 👩‍💻 Equipo del Proyecto – BuzzCore Team

| Integrante | Rol | Responsabilidades |
|------------|------|-----------------------|
| **Camila Guevara** | Líder Técnica · QA Manager | Gestión del proyecto, Scrum Board, calidad |
| **Diana Sierra** | QA / Tester | Pruebas funcionales, casos de prueba |
| **Stefany Abril** | Documentación | Manuales, guías, documentación técnica |
| **Taliana Moreno Guzmán** | Backend & Deploy | API, integración de Places, Twilio y Resend |
| **Carol Serrano** | Backend Developer | Módulos de notificaciones y Nominatim |
| **Ana Maria**| Diseñadora| Diagramas MER|

## 🚀 Enlace de Producción

📌 **Swagger Docs:**  
https://buzzcore-production.up.railway.app/api/docs

## ⭐ Características Principales

- 🔐 JWT con Refresh Tokens  
- 🌍 Google Places + OSM Nominatim  
- 📨 Email, SMS, WhatsApp, Push  
- 📊 BullMQ + Redis  
- 🗄️ PostgreSQL + TypeORM  
- 🔄 Reintentos automáticos  
- 📘 Swagger + Compodoc  
- 🧪 Tests con Jest  

## ⚙️ Instalación

```
npm install
```

## 🔐 Variables de Entorno – `.env`

```
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=buzzcore

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_api_key

# OpenStreetMap Nominatim
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Application
PORT=3000
NODE_ENV=development
```

## ▶️ Ejecutar Proyecto

```
npm run start        # development
npm run start:dev    # watch mode
npm run start:prod   # production
```

Swagger Local:  
http://localhost:3000/api/docs

## 🧪 Testing

```
npm run test
npm run test:e2e
npm run test:cov
```

## 🔄 Flujo de Notificaciones

1. El usuario solicita una recomendación turística.  
2. BuzzCore consulta lugares cercanos (Google Places / OSM).  
3. Se crea una notificación con estado `pending`.  
4. La notificación se encola en BullMQ.  
5. El worker procesa el envío.  
6. Se actualiza el estado a `sent` o `failed`.  
7. En caso de fallo → reintento automático (máx. 3).  

## 📡 Endpoints Principales

### 🔐 Autenticación

```
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/profile
```

### 📨 Notificaciones

```
POST /notifications/send
GET  /notifications/user/:userId
GET  /notifications/user/:userId/stats
```

### 📍 Lugares

```
GET /places/nearby?lat=4.7110&lng=-74.0721&type=restaurant
```

## 🧱 Stack Tecnológico

- NestJS  
- PostgreSQL  
- Redis  
- BullMQ  
- TypeORM  
- Twilio  
- Resend  
- Google Places API  
- OpenStreetMap Nominatim  


## 📚 Recursos

- NestJS Docs  
- NestJS Discord  
- Cursos oficiales  
- DevTools  
- Jobs Board  

## 🪪 Licencia

MIT License.
