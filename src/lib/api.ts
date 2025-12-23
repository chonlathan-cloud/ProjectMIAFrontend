// src/lib/api.ts
// SaaS-ready API utilities for ConnectBridge / LineBoost

import { auth } from "./firebase";

/**
 * IMPORTANT:
 * - Production: ใช้ relative path (/api/...) ผ่าน default base "/api"
 * - Dev / Preview: สามารถ override ด้วย VITE_API_BASE_URL (ควรชี้ถึง /api)
 * - ❌ ห้าม fallback ไป localhost เด็ดขาด
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_STORAGE_KEY = "firebase_token";

// --------------------------------------------------
// INTERNAL: Get fresh Firebase ID Token
// --------------------------------------------------
async function getIdToken(): Promise<string> {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    return token;
  }

  // fallback กรณี refresh หน้า
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (cached) return cached;
  }

  throw new Error("No authenticated user");
}

// --------------------------------------------------
// INTERNAL: Authenticated fetch
// --------------------------------------------------
async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getIdToken();

  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = path.startsWith("http") ? path : `${base}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from server: ${text}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

// --------------------------------------------------
// PUBLIC WRAPPER
// --------------------------------------------------
export async function authedJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return authedFetch(path, options) as Promise<T>;
}

// --------------------------------------------------
// AUTH
// --------------------------------------------------
export async function getMe() {
  return authedJson("/auth/me");
}

// --------------------------------------------------
// LINE OA
// --------------------------------------------------
export async function createLineConnect(params?: {
  state?: Record<string, unknown>;
}) {
  return authedJson("/line/connect", {
    method: "POST",
    body: params?.state ? JSON.stringify({ state: params.state }) : undefined,
  });
}

export async function completeLineCallback(code: string, state: string) {
  return authedJson(`/line/callback?code=${code}&state=${state}`);
}

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
// INBOX / MESSAGES
// --------------------------------------------------
export async function getRecentMessages() {
  return authedJson("/dashboard/recent-messages");
}

export async function getInboxCustomers(storeId: string) {
  return authedJson(`/inbox/customers?storeId=${storeId}`);
}

export async function getInboxHistory(customerId: string) {
  return authedJson(`/inbox/history/${customerId}`);
}

export async function sendInboxMessage(customerId: string, message: string) {
  return authedJson(`/inbox/send/${customerId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// --------------------------------------------------
// STORES
// --------------------------------------------------
export async function listStores() {
  return authedJson("/stores");
}

export async function getStoreStats(storeId: string) {
  return authedJson(`/stores/${storeId}/stats`);
}

export async function createStore(name: string) {
  return authedJson("/stores", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getLineCredentials(storeId: string) {
  return authedJson(`/stores/${storeId}/line-credentials`);
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
    body: JSON.stringify({
      ...payload,
      sendNow: payload.sendNow ?? true,
    }),
  });
}
