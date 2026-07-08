import { API_BASE_URL } from '../constants/api';
import { AuthService } from './authService';

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

async function readResponseBody(response: Response) {
  const rawText = await response.text();
  if (!rawText) return {};

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
}

function getNetworkError(error: unknown, url: string) {
  const message = error instanceof Error ? error.message : 'Unknown network error';
  return new Error(`Cannot reach API at ${url}. Check server port, phone Wi-Fi, and API host. ${message}`);
}

export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = await AuthService.getToken();
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    throw getNetworkError(error, url);
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(body.message || 'Upload failed');
  }

  return body.data ?? body;
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await AuthService.getToken();
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw getNetworkError(error, url.toString());
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    const detail = body.errors?.length ? `: ${body.errors.join('; ')}` : '';
    throw new Error(`${body.message || 'Request failed'}${detail}`);
  }

  return body.data ?? body;
}

export const workspaceApi = {
  properties: {
    list: () => apiRequest('/properties'),
    create: (data: any) => apiRequest('/properties', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  rooms: {
    list: (params?: Record<string, any>) => apiRequest('/rooms', { params }),
    create: (data: any) => apiRequest('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/rooms/${id}`, { method: 'DELETE' }),
  },
  beds: {
    list: (params?: Record<string, any>) => apiRequest('/beds', { params }),
    create: (data: any) => apiRequest('/beds', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/beds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/beds/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) =>
      apiRequest(`/beds/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  tenants: {
    list: () => apiRequest('/tenants'),
    create: (data: any) => apiRequest('/tenants', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiRequest(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    assignBed: (tenantId: string, bedId: string) =>
      apiRequest(`/tenants/${tenantId}/assign-bed`, { method: 'PATCH', body: JSON.stringify({ bedId }) }),
    markLeft: (tenantId: string) => apiRequest(`/tenants/${tenantId}/mark-left`, { method: 'PATCH' }),
    delete: (id: string) => apiRequest(`/tenants/${id}`, { method: 'DELETE' }),
    myRoom: () => apiRequest('/tenants/me/room'),
  },
  complaints: {
    list: (status?: string) => apiRequest('/complaints', { params: { status } }),
    create: (data: any) => apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, adminNote = '') =>
      apiRequest(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }),
  },
  reports: {
    list: () => apiRequest('/reports'),
    create: (data: any) => apiRequest('/reports', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, ownerNote = '') =>
      apiRequest(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ownerNote }) }),
  },
  invoices: {
    list: () => apiRequest('/invoices'),
    markPaid: (id: string) => apiRequest(`/invoices/${id}/mark-paid`, { method: 'PATCH' }),
  },
  payments: {
    list: () => apiRequest('/payments'),
    create: (data: any) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  },
  managers: {
    list: () => apiRequest('/auth/managers'),
    create: (data: any) => apiRequest('/auth/managers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiRequest(`/auth/managers/${id}`, { method: 'DELETE' }),
  },
  me: () => apiRequest('/auth/me'),
  updateMe: (data: any) => apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', { method: 'PATCH', body: JSON.stringify({ oldPassword, newPassword }) }),
  verifyPassword: (password: string) =>
    apiRequest('/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),
};
