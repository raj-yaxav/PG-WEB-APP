import { AuthService } from './authService';
import { API_BASE_URL } from '../constants/api';
import type { MobileDashboardSummary } from '../constants/mockData';

export async function getDashboardSummary(): Promise<MobileDashboardSummary> {
  const token = await AuthService.getToken();
  const url = `${API_BASE_URL}/dashboard/summary`;

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error: any) {
    throw new Error(`Cannot reach API at ${url}. Check server port, phone Wi-Fi, and API host. ${error?.message || ''}`);
  }

  const rawText = await response.text();
  const data = parseBody(rawText);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load dashboard summary');
  }

  return data.data;
}

function parseBody(rawText: string) {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
}
