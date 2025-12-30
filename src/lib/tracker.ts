// Utility สำหรับยิง Event ไปหลังบ้าน

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const resolveTrackEndpoint = () => {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) return '/api/sites/event';
  if (base.endsWith('/api')) return `${base}/sites/event`;
  return `${base}/api/sites/event`;
};

export const getSessionId = () => {
  let sessionId = localStorage.getItem("cb_session_id");
  if (!sessionId) {
    sessionId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem("cb_session_id", sessionId);
  }
  return sessionId;
};

type TrackOptions = {
  eventName?: string;
  productId?: string;
};

export const trackEvent = async (
  storeId: string,
  eventType: string,
  meta: Record<string, any> = {},
  options: TrackOptions = {}
) => {
  const sessionId = getSessionId();
  const lineUserId = localStorage.getItem("cb_line_user_id"); // จะมีค่าเมื่อ Login แล้ว

  const payload = {
    storeId,
    sessionId,
    lineUserId,
    eventType,
    eventName: options.eventName || eventType,
    url: window.location.href,
    page: window.location.pathname,
    productId: options.productId || null,
    meta,
    ts: new Date().toISOString(),
  };

  try {
    const endpoint = resolveTrackEndpoint();
    // ใช้ navigator.sendBeacon ถ้าทำได้ (ส่งข้อมูลแม้ปิดหน้าเว็บ)
    // แต่เพื่อความชัวร์ใน MVP ใช้ fetch ธรรมดาก่อน
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log(`[Tracker] Sent: ${eventType}`);
  } catch (error) {
    console.warn("[Tracker] Failed to send event", error);
  }
};
