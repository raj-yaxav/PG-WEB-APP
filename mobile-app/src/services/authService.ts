/**
 * PG Manager — Auth Service
 * Handles login, register, token storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth.types';

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

    const loginUrl = `${API_BASE_URL}/auth/login`;
    const startedAt = Date.now();

    console.log('[AuthService.login] request', {
      url: loginUrl,
      role: credentials.role,
      identifierType: credentials.role === 'owner' ? 'email' : 'loginId',
      identifier: credentials.identifier,
    });

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const rawText = await response.text();
      const data = parseBody(rawText);

      console.log('[AuthService.login] response', {
        status: response.status,
        ok: response.ok,
        durationMs: Date.now() - startedAt,
        message: data.message,
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await this.setAuthData(data.data.token, data.data.user);
      console.log('[AuthService.login] success', {
        role: data.data.user.role,
        userId: data.data.user._id || data.data.user.id,
      });
      return data;
    } catch (error: any) {
      console.log('[AuthService.login] failed', {
        durationMs: Date.now() - startedAt,
        message: error?.message || 'Unknown login error',
      });
      throw error instanceof TypeError
        ? new Error(`Cannot reach API at ${loginUrl}. Check server port, phone Wi-Fi, and API host. ${error.message}`)
        : error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const registerUrl = `${API_BASE_URL}/auth/register`;
    let response: Response;

    try {
      response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch (error: any) {
      throw new Error(`Cannot reach API at ${registerUrl}. Check server port, phone Wi-Fi, and API host. ${error?.message || ''}`);
    }

    const rawText = await response.text();
    const data = parseBody(rawText);

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    await this.setAuthData(data.data.token, data.data.user);
    return data;
  }

  async refreshUserFromServer(): Promise<User | null> {
    const token = await this.getToken();
    if (!token) return null;

    const meUrl = `${API_BASE_URL}/auth/me`;
    let response: Response;

    try {
      response = await fetch(meUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      throw new Error(`Cannot reach API at ${meUrl}. Check server port, phone Wi-Fi, and API host. ${error?.message || ''}`);
    }

    const rawText = await response.text();
    const data = parseBody(rawText);

    if (!response.ok) {
      await this.logout();
      throw new Error(data.message || 'Saved login is no longer valid');
    }

    const user = normalizeUser(data.data);
    await this.updateUser(user);
    return user;
  }

  async setAuthData(token: string, user: User): Promise<void> {
    this.token = token;
    this.user = user;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async updateUser(user: User): Promise<void> {
    this.user = user;
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

function parseBody(rawText: string) {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
}

function normalizeUser(data: any): User {
  return {
    id: data.id || data._id || '',
    name: data.name || '',
    phone: data.phone,
    email: data.email,
    loginId: data.loginId,
    role: data.role,
    status: data.status,
    profilePhotoUrl: data.profilePhotoUrl || '',
  };
}
