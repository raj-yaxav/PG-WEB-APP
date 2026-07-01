/**
 * PG Manager — Auth Service
 * Handles login, register, token storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth.types';

const API_BASE_URL = 'http://localhost:5000/api'; // Update with your server URL
const TOKEN_KEY = 'pg_auth_token_v2';
const USER_KEY = 'pg_auth_user_v2';

class AuthServiceClass {
  private token: string | null = null;
  private user: User | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload =
      credentials.role === 'owner'
        ? {
            role: credentials.role,
            email: credentials.identifier,
            password: credentials.password,
          }
        : {
            role: credentials.role,
            loginId: credentials.identifier,
            password: credentials.password,
          };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    await this.setAuthData(data.data.token, data.data.user);
    return data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    await this.setAuthData(data.data.token, data.data.user);
    return data;
  }

  async setAuthData(token: string, user: User): Promise<void> {
    this.token = token;
    this.user = user;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
    return this.token;
  }

  async getUser(): Promise<User | null> {
    if (this.user) return this.user;
    const userJson = await AsyncStorage.getItem(USER_KEY);
    this.user = userJson ? JSON.parse(userJson) : null;
    return this.user;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const AuthService = new AuthServiceClass();
