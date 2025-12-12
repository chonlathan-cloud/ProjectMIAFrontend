// src/lib/api.ts
// SaaS-ready API utilities for ConnectBridge / LineBoost

import { auth } from "./firebase";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000/api";

const TOKEN_STORAGE_KEY = "firebase_token";

// --------------------------------------------------
// INTERNAL: Get fresh Firebase ID Token
// --------------------------------------------------
async function getIdToken(): Promise<string> {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken(true);

    if (token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    return token;
  }

  // fallback: token จาก localStorage (กรณี reload หน้า)
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (cached) return cached;
  }

  throw new Error("No authenticated user");
}

// --------------------------------------------------
// INTERNAL: Fetch with Auth Header
// --------------------------------------------------
async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const fullUrl = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Invalid JSON from server: ${text}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || text || "Request failed");
  }

  return data;
}

// public API wrapper
export async function authedJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return authedFetch(path, options) as Promise<T>;
}

// --------------------------------------------------
// AUTH DEBUG
// --------------------------------------------------
export async function getMe() {
  return authedJson("/auth/me");
}

// --------------------------------------------------
// LINE OA Connect & Callback
// --------------------------------------------------
export async function createLineConnect(params?: {
  state?: Record<string, unknown>;
}): Promise<{ loginUrl: string; state: string }> {
  const res = await authedFetch("/line/connect", {
    method: "POST",
    body: params?.state ? JSON.stringify({ state: params.state }) : undefined,
  });

  return res?.data;
}

export async function completeLineCallback(code: string, state: string) {
  return authedFetch(`/line/callback?code=${code}&state=${state}`);
}

// --------------------------------------------------
// LINE OA Status
// --------------------------------------------------
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
  return authedJson("/line/status");
}

// --------------------------------------------------
// Recent Messages / Inbox
// --------------------------------------------------
export type RecentMessage = {
  id: string;
  type: string;
  text: string | null;
  isFromUser: boolean;
  timestamp: string;
};

export async function getRecentMessages() {
  return authedJson("/dashboard/recent-messages");
}

export async function getInboxCustomers(storeId: string) {
  return authedJson(`/inbox/customers?storeId=${storeId}`);
}

// --------------------------------------------------
// STORES (Multi-Tenant)
// --------------------------------------------------
export async function listStores() {
  return authedJson("/stores");
}

export async function createStore(name: string) {
  return authedJson("/stores", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function saveLineCredentials(
  storeId: string,
  payload: {
    channelAccessToken: string;
    channelSecret?: string;
    lineUserId?: string;
    displayName?: string;
  }
) {
  return authedJson(`/stores/${storeId}/line-credentials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------
// BROADCAST
// --------------------------------------------------
export async function sendBroadcast(payload: {
  content: string;
  sendNow?: boolean;
  storeId?: string;
}) {
  return authedJson("/broadcast", {
    method: "POST",
    body: JSON.stringify({ ...payload, sendNow: payload.sendNow ?? true }),
  });
}
