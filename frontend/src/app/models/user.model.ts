export class User {
  id: string = '';
  email: string = '';
  name: string = '';
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

export class AuthResponse {
  accessToken: string = '';
  refreshToken: string = '';
  message: string = '';
}

export class LoginCredentials {
  email: string = '';
  password: string = '';
}

export class RegisterCredentials extends LoginCredentials {
  name: string = '';
} 