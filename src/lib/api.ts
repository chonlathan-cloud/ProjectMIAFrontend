// src/lib/api.ts
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

export async function getAuthToken(): Promise<string> {
  return getIdToken();
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
  return authedJson(`/callback?code=${code}&state=${state}`);
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

export async function getLineStatus(storeId?: string): Promise<LineStatusResponse> {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  return authedJson(`/line/status${query}`);
}

/**
 * ✅ NEW: status แบบผูก storeId จริง (ใช้กับหน้า Broadcast/อื่นๆ ที่ต้องเช็คต่อร้าน)
 * ใช้ endpoint ที่มีอยู่แล้ว: GET /api/stores/:storeId/line-credentials
 * เรา map ออกมาให้เหมือน LineStatusResponse เพื่อให้ UI ใช้งานง่าย
 */
export async function getLineStatusByStore(storeId: string): Promise<LineStatusResponse> {
  const res: any = await authedJson(`/stores/${storeId}/line-credentials`);
  const d = res?.data ?? res;

  return {
    success: true,
    message: "ok",
    data: {
      connected: !!d?.channelAccessToken,
      displayName: d?.displayName,
      lineUserId: d?.lineUserId,
    },
  };
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

export async function getInboxHistory(customerId: string, storeId: string) {
  const query = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  return authedJson(`/inbox/history/${customerId}${query}`);
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

export async function resetStore(storeId: string) {
  return authedJson(`/stores/${storeId}/reset`, {
    method: "POST",
    body: JSON.stringify({ confirm: "RESET" }),
  });
}

export async function getLineCredentials(storeId: string) {
  return authedJson(`/stores/${storeId}/line-credentials`);
}

export async function getLineOaLink(storeId: string) {
  const res: any = await authedJson(`/stores/${storeId}/line-credentials`);
  const data = res?.data ?? res;
  const rawBasicId = data?.basicId || data?.lineId;
  const basicId =
    typeof rawBasicId === "string" && rawBasicId.length > 0
      ? rawBasicId.startsWith("@")
        ? rawBasicId
        : `@${rawBasicId}`
      : "";
  const lineOaUrl = data?.lineOaUrl || (basicId ? `https://line.me/R/ti/p/${basicId}` : "");

  return { ...data, lineOaUrl };
}

export async function saveLineCredentials(
  storeId: string,
  payload: {
    channelAccessToken: string;
    channelSecret?: string;
    lineUserId?: string;
    displayName?: string;
    basicId?: string;
  }
) {
  return authedJson(`/stores/${storeId}/line-credentials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------
// AI SETTINGS
// --------------------------------------------------
export async function getAiSettings(storeId: string) {
  return authedJson(`/stores/${storeId}/ai-settings`);
}

export async function updateAiSettings(storeId: string, aiEnable: boolean) {
  return authedJson(`/stores/${storeId}/ai-settings`, {
    method: "POST",
    body: JSON.stringify({ aiEnable }),
  });
}

// --------------------------------------------------
// ANALYTICS
// --------------------------------------------------
export type AnalyticsSummary = {
  totalMessages: number;
  totalBroadcasts: number;
  avgClickRate: string;
};

export type AnalyticsData = {
  period: number;
  dailyMessages: Record<string, { received: number; sent: number }>;
  eventTypeStats: { eventType: string; count: number }[];
  broadcastStats: {
    id: string;
    sentAt: string | null;
    sentCount: number;
    clickCount: number;
    clickRate: string;
  }[];
  followerTrend: Record<string, number>;
  summary: AnalyticsSummary;
};

export type AnalyticsResponse = {
  success: boolean;
  message: string;
  data: AnalyticsData;
};

export async function getAnalytics(storeId: string, period = 30): Promise<AnalyticsResponse> {
  const query = `?storeId=${encodeURIComponent(storeId)}&period=${encodeURIComponent(String(period))}`;
  return authedJson(`/analytics${query}`);
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

export type BroadcastCardPayload = {
  title: string;
  body: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type BroadcastFlexPayload = {
  contents: Record<string, unknown>;
};

export type BroadcastAiLayout =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "card";
      altText: string;
      card: BroadcastCardPayload;
    }
  | {
      type: "flex";
      altText: string;
      flex: BroadcastFlexPayload;
    };

export async function generateBroadcastAi(payload: {
  storeId: string;
  content: string;
}) {
  return authedJson("/mcp/line/broadcast/ai", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendBroadcastMcp(payload: {
  storeId: string;
  type: "text" | "card" | "flex";
  text?: string;
  card?: BroadcastCardPayload & { altText?: string };
  flex?: BroadcastFlexPayload & { altText?: string };
}) {
  return authedJson("/mcp/line/broadcast/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadLineImage(payload: {
  storeId: string;
  fileName: string;
  contentType: string;
  dataBase64: string;
}) {
  return authedJson("/mcp/line/upload-image", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --------------------------------------------------
// ORDERS
// --------------------------------------------------
export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
};

export type OrderRecord = {
  id: string;
  storeId: string;
  status: string;
  total: number;
  items: OrderItem[];
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    note?: string;
    lineUserId?: string | null;
  };
  payment?: {
    method?: string;
    promptpayId?: string;
    qrUrl?: string;
    slipUrl?: string;
    amount?: number;
  };
  createdAt?: any;
  updatedAt?: any;
};

export async function getOrders(storeId: string, status?: string) {
  const query = new URLSearchParams();
  query.set("storeId", storeId);
  if (status) query.set("status", status);
  return authedJson(`/orders?${query.toString()}`);
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: string
) {
  return authedJson(`/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ storeId, status }),
  });
}
