/**
 * PG Manager — Auth Type Definitions
 */

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loginId?: string;
  role: 'owner' | 'manager' | 'tenant';
  status: 'active' | 'inactive';
  profilePhotoUrl?: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
  role: 'owner' | 'manager' | 'tenant';
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export type AuthScreen = 'login';
