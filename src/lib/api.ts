// src/lib/api.ts
import { auth } from './firebase';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';

// -------------------- core helpers --------------------

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

export async function authedJson<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return authedFetch(path, options) as Promise<T>;
}

// -------------------- LINE connect / callback --------------------

export async function createLineConnect(): Promise<{
  loginUrl: string;
  state: string;
}> {
  const data = await authedFetch('/api/line/connect', {
    method: 'POST',
  });
  // backend ของเราห่อเป็น { success, message, data: { loginUrl, state } }
  return data.data;
}

export async function completeLineCallback(code: string, state: string) {
  const params = new URLSearchParams({ code, state });
  return authedFetch(`/api/line/callback?${params.toString()}`, {
    method: 'GET',
  });
}

// -------------------- backend auth debug --------------------

export async function getMe(): Promise<{
  success: boolean;
  message: string;
  user: any;
}> {
  return authedJson('/api/auth/me');
}

// -------------------- LINE status --------------------

export type LineStatusResponse = {
  success: boolean;
  message: string;
  data: {
    connected: boolean;
    lineAccountId?: string;
    lineUserId?: string;
    displayName?: string;
    pictureUrl?: string;
  };
};

export async function getLineStatus(): Promise<LineStatusResponse> {
  return authedJson('/api/line/status');
}

// -------------------- recent messages --------------------

export type RecentMessage = {
  id: string;
  type: string; // 'message' | 'reply' | 'follow' | ... (ยืดหยุ่นเป็น string ไปก่อน)
  text: string | null;
  isFromUser: boolean;
  timestamp: string;
  fromUserId?: string | null;
  toUserId?: string | null;
};

export type RecentMessagesResponse = {
  success: boolean;
  message: string;
  data: {
    items: RecentMessage[];
  };
};

export async function getRecentMessages(): Promise<RecentMessagesResponse> {
  return authedJson('/api/dashboard/recent-messages');
}

export async function getInboxCustomers(storeId: string) {
  return authedJson(`/api/inbox/customers?storeId=${storeId}`);
}
