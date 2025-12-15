// src/lib/api.ts
// SaaS-ready API utilities for ConnectBridge / LineBoost

import { auth } from "./firebase";

// ✅ ปรับ Base URL ให้มี /api ตามที่คุณทำมา (ถูกต้องแล้ว)
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

  // ป้องกันเคสซ้ำ /api เช่น Base URL ลงท้ายด้วย /api แล้ว path ก็ขึ้นต้นด้วย /api
  const base = API_BASE_URL.replace(/\/$/, "");
  let normalizedPath = path;

  if (!path.startsWith("http")) {
    const needsLeadingSlash = normalizedPath.startsWith("/") ? "" : "/";

    if (base.endsWith("/api") && normalizedPath.startsWith("/api")) {
      normalizedPath = normalizedPath.replace(/^\/api/, "");
    }

    normalizedPath = `${needsLeadingSlash}${normalizedPath}`;
  }

  const fullUrl = path.startsWith("http") ? path : `${base}${normalizedPath}`;

  const response = await fetch(fullUrl, {
    ...options,
    // 🔥 เพิ่มบรรทัดนี้: ห้าม Cache เด็ดขาด
    cache: "no-store", 
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // 🔥 เพิ่ม Header กันเหนียว
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
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

  return res?.data || res;
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
  fromUserId?: string;
  toUserId?: string;
};

export async function getRecentMessages() {
  return authedJson("/dashboard/recent-messages");
}

export async function getInboxCustomers(storeId: string) {
  return authedJson(`/inbox/customers?storeId=${storeId}`);
}

// 🔥 เพิ่ม: ดึงประวัติแชท (Inbox)
export async function getInboxHistory(customerId: string) {
  return authedJson(`/inbox/history/${customerId}`);
}

// 🔥 เพิ่ม: ส่งข้อความตอบกลับ (Inbox)
export async function sendInboxMessage(customerId: string, message: string) {
  return authedJson(`/inbox/send/${customerId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// --------------------------------------------------
// STORES (Multi-Tenant)
// --------------------------------------------------
export async function listStores() {
  return authedJson("/stores");
}

// 🔥 เพิ่ม: ดึงสถิติ Dashboard (สำคัญมาก!)
export async function getStoreStats(storeId: string) {
  return authedJson(`/stores/${storeId}/stats`);
}

export async function createStore(name: string) {
  return authedJson("/stores", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// 🔥 เพิ่ม: ดึงการตั้งค่า LINE (GET)
export async function getLineCredentials(storeId: string) {
  return authedJson(`/stores/${storeId}/line-credentials`);
}

// บันทึกการตั้งค่า LINE (POST)
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
