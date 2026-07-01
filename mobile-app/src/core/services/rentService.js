import { api } from './apiService';

export const RentService = {
  getMyInvoices(params = {}) {
    return api.get('/invoices', { params });
  },

  getPaymentHistory(params = {}) {
    return api.get('/payments', { params });
  },
};
