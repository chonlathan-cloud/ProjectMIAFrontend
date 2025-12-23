// Utility สำหรับยิง Event ไปหลังบ้าน

const API_BASE_URL = 'http://localhost:3000/api'; // แก้เป็น URL ของ Backend จริง

export const getSessionId = () => {
  let sessionId = localStorage.getItem("cb_session_id");
  if (!sessionId) {
    sessionId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem("cb_session_id", sessionId);
  }
  return sessionId;
};

export const trackEvent = async (storeId: string, eventType: string, metadata: any = {}) => {
  const sessionId = getSessionId();
  const lineUserId = localStorage.getItem("cb_line_user_id"); // จะมีค่าเมื่อ Login แล้ว

  const payload = {
    storeId,
    sessionId,
    lineUserId,
    eventType,
    path: window.location.pathname,
    metadata
  };

  try {
    // ใช้ navigator.sendBeacon ถ้าทำได้ (ส่งข้อมูลแม้ปิดหน้าเว็บ) 
    // แต่เพื่อความชัวร์ใน MVP ใช้ fetch ธรรมดาก่อน
    await fetch(`${API_BASE_URL}/track`, {
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