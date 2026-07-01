import { api } from './apiService';

export const ComplaintService = {
  createComplaint(payload) {
    return api.post('/complaints', payload);
  },

  getMyComplaints(params = {}) {
    return api.get('/complaints', { params });
  },
};
