import { api } from './apiService';

export const TenantService = {
  getProfile() {
    return api.get('/auth/me');
  },

  getMyRoom() {
    return api.get('/tenants/me/room');
  },
};
