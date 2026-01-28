import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import PublishPanel from '@/components/site/PublishPanel';
import {
  clearStoredToken,
  getStoredLineUserId,
  getStoredShopId,
  getStoredToken,
  setStoredShopId,
  setStoredToken,
} from '@/lib/lineAuthStorage';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  reply?: string;
  intent?: string;
  requiresConfirm?: boolean;
  draftId?: string;
};

type ShopOption = {
  shopId: string;
  shopName: string;
  role?: string;
};

const REFRESH_GRACE_SECONDS = 300;

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [token, setToken] = useState(() => getStoredToken());
  const [shopId, setShopId] = useState(() => getStoredShopId());
  const [userId] = useState(() => getStoredLineUserId());
  const tokenRef = useRef<string | null>(token);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const serverABase = useMemo(() => {
    const base =
      import.meta.env.VITE_SERVERA_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';
    return base.replace(/\/$/, '');
  }, []);
  const serverBBase = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!token || !shopId || !userId) {
      toast.error('ไม่พบสิทธิ์การใช้งาน กรุณาเปิดผ่าน LIFF อีกครั้ง');
      return;
    }
    setActiveShopId(shopId);
  }, [token, shopId, userId]);

  useEffect(() => {
    const loadShops = async () => {
      if (!token) return;
      try {
        const validToken = await ensureValidToken();
        const res = await fetch(`${serverABase}/ai/shops`, {
          headers: {
            Authorization: `Bearer ${validToken}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || 'โหลดรายชื่อร้านไม่สำเร็จ');
        const list: ShopOption[] = data?.shops || [];
        setShops(list);
        if (!activeShopId && data?.selectedShopId) {
          setActiveShopId(data.selectedShopId);
        }
      } catch (error: any) {
        toast.error(error?.message || 'โหลดรายชื่อร้านไม่สำเร็จ');
      }
    };
    loadShops();
  }, [token, serverABase, activeShopId]);

  const parseJwtPayload = (rawToken: string) => {
    try {
      const payload = rawToken.split('.')[1];
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const refreshAccessToken = async () => {
    const response = await fetch(`${serverBBase}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      clearStoredToken();
      setToken(null);
      throw new Error(data?.detail || 'หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
    }
    const nextToken = data?.token;
    if (!nextToken) {
      throw new Error('ไม่พบ token ใหม่จากระบบ');
    }
    setStoredToken(nextToken);
    setToken(nextToken);
    return nextToken as string;
  };

  const ensureValidToken = async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) {
      throw new Error('ไม่พบสิทธิ์การใช้งาน กรุณาเปิดผ่าน LIFF อีกครั้ง');
    }
    const payload = parseJwtPayload(currentToken);
    if (!payload?.exp) {
      return currentToken;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - nowSec;
    if (remaining > REFRESH_GRACE_SECONDS) {
      return currentToken;
    }
    if (!refreshInFlight.current) {
      refreshInFlight.current = refreshAccessToken();
    }
    try {
      const nextToken = await refreshInFlight.current;
      return nextToken || currentToken;
    } finally {
      refreshInFlight.current = null;
    }
  };

  const appendMessage = (role: ChatMessage['role'], content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const lineRequest = async (path: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('ไม่พบสิทธิ์การใช้งาน กรุณาเปิดผ่าน LIFF อีกครั้ง');
    }
    const validToken = await ensureValidToken();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = path.startsWith('http')
      ? path
      : `${serverBBase}${normalizedPath}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
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
      throw new Error(data?.detail || data?.message || 'Request failed');
    }

    return data;
  };

  const sendMessageContent = async (content: string) => {
    if (!content.trim() || !token || !shopId || !userId) return;
    const trimmed = content.trim();
    appendMessage('user', content);
    setSending(true);
    try {
      const validToken = await ensureValidToken();
      const res = await fetch(`${serverABase}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ shopId, userId, message: trimmed }),
      });
      const data: ChatResponse = await res.json();
      if (!res.ok) throw new Error((data as any)?.detail || 'ส่งข้อความไม่สำเร็จ');
      if (data.reply) appendMessage('assistant', data.reply);
      if (data.requiresConfirm && data.draftId) {
        setDraftId(data.draftId);
      } else {
        setDraftId(null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    await sendMessageContent(content);
  };

  const handleUpload = async (file: File) => {
    if (!token || !shopId) {
      toast.error('ไม่พบสิทธิ์การใช้งาน กรุณาเปิดผ่าน LIFF อีกครั้ง');
      return;
    }
    setUploading(true);
    try {
      const validToken = await ensureValidToken();
      const formData = new FormData();
      formData.append('shopId', shopId);
      formData.append('file', file);

      const res = await fetch(`${serverABase}/ai/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
        body: formData,
      });
      const data: { url?: string; detail?: string } = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'อัปโหลดไม่สำเร็จ');
      if (!data.url) throw new Error('ไม่พบ URL หลังอัปโหลด');
      toast.success('อัปโหลดรูปแล้วค่ะ');
      await sendMessageContent(`แนบรูปสินค้า: ${data.url}`);
    } catch (error: any) {
      toast.error(error?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const confirmDraft = async (confirm: boolean) => {
    if (!draftId || !token) return;
    setSending(true);
    try {
      const validToken = await ensureValidToken();
      const res = await fetch(`${serverABase}/ai/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ draftId, confirm }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'ยืนยันไม่สำเร็จ');
      appendMessage(
        'assistant',
        confirm ? 'ยืนยันเรียบร้อยค่ะ' : 'ยกเลิกรายการเรียบร้อยค่ะ'
      );
      setDraftId(null);
    } catch (error: any) {
      toast.error(error?.message || 'ยืนยันไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-lg font-semibold">AI Assistant</h1>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">ผู้ช่วยอัจฉริยะสำหรับร้านของคุณ</p>
          {shops.length > 1 && (
            <select
              className="text-xs border rounded-md px-2 py-1"
              value={activeShopId || ''}
              onChange={async (e) => {
                const nextShopId = e.target.value;
                if (!nextShopId || !userId) return;
                try {
                  const res = await fetch(`${serverBBase}/auth/line/select`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lineUserId: userId, shopId: nextShopId }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.detail || 'สลับร้านไม่สำเร็จ');
                  if (data?.token) {
                    setStoredToken(data.token);
                    setStoredShopId(data.shopId || nextShopId);
                    setToken(data.token);
                    setShopId(data.shopId || nextShopId);
                    setActiveShopId(data.shopId || nextShopId);
                    toast.success('สลับร้านเรียบร้อยค่ะ');
                  }
                } catch (error: any) {
                  toast.error(error?.message || 'สลับร้านไม่สำเร็จ');
                }
              }}
            >
              {shops.map((shop) => (
                <option key={shop.shopId} value={shop.shopId}>
                  {shop.shopName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="px-6 pt-4">
        <PublishPanel
          storeId={activeShopId || shopId}
          request={lineRequest}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}`}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white ml-auto'
                : 'bg-white text-gray-800 border'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {draftId && (
        <div className="px-6 py-3 bg-amber-50 border-t flex items-center justify-between">
          <span className="text-sm text-amber-700">ยืนยันการดำเนินการนี้ไหมคะ?</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-md text-sm bg-gray-200"
              onClick={() => confirmDraft(false)}
              disabled={sending}
            >
              ยกเลิก
            </button>
            <button
              className="px-3 py-1 rounded-md text-sm bg-emerald-500 text-white"
              onClick={() => confirmDraft(true)}
              disabled={sending}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-t flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
            e.currentTarget.value = '';
          }}
        />
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความเพื่อถามหรือสั่งงาน..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          className="px-3 py-2 rounded-lg bg-amber-100 text-amber-700 text-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
        >
          {uploading ? 'กำลังอัปโหลด...' : 'แนบรูป'}
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm"
          onClick={sendMessage}
          disabled={sending || uploading}
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}
