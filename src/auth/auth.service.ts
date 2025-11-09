import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // Aquí luego irá la lógica de autenticación JWT
  login() {
    return { message: 'Login aún no implementado' };
  }
}
