import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { api } from './apiService';

export const AuthService = {
  async login(phone, password) {
    const response = await api.post('/auth/login', { phone, password });
    const token = response?.data?.token;
    const user = response?.data?.user;

    if (!token) {
      throw new Error('Login succeeded but token was missing.');
    }

    await AsyncStorage.setItem(STORAGE_KEYS.token, token);
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    }

    return { token, user };
  },

  async getToken() {
    return AsyncStorage.getItem(STORAGE_KEYS.token);
  },

  async getStoredUser() {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.user);
    return user ? JSON.parse(user) : null;
  },

  async getProfile() {
    return api.get('/auth/me');
  },

  async logout() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
  },
};
