import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  const token = await user.getIdToken();
  if (!token) {
    throw new Error('Failed to get ID token');
  }
  return token;
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.json();
}

export async function authedJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  return authedFetch(path, options) as Promise<T>;
}

export async function createLineConnect(): Promise<{ loginUrl: string; state: string }> {
  const data = await authedFetch('/api/line/connect', {
    method: 'POST',
  });
  return data.data;
}

export async function completeLineCallback(code: string, state: string) {
  const params = new URLSearchParams({ code, state });
  return authedFetch(`/api/line/callback?${params.toString()}`, {
    method: 'GET',
  });
}

// src/lib/api.ts (ต่อจากโค้ดที่คุณส่งมา)

export async function getMe(): Promise<{ success: boolean; message: string; user: any }> {
  return authedJson('/api/auth/me');
}
