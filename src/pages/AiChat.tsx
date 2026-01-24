import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

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

const TOKEN_KEY = 'cb_line_token';
const SHOP_KEY = 'cb_line_shop_id';
const LINE_USER_KEY = 'cb_line_user_id';

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = useMemo(() => localStorage.getItem(TOKEN_KEY), []);
  const shopId = useMemo(() => localStorage.getItem(SHOP_KEY), []);
  const userId = useMemo(() => localStorage.getItem(LINE_USER_KEY), []);
  const apiBase = useMemo(() => {
    const base = import.meta.env.VITE_SERVERA_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    if (!token || !shopId || !userId) {
      toast.error('ไม่พบสิทธิ์การใช้งาน กรุณาเปิดผ่าน LIFF อีกครั้ง');
    }
  }, [token, shopId, userId]);

  const appendMessage = (role: ChatMessage['role'], content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const sendMessageContent = async (content: string) => {
    if (!content.trim() || !token || !shopId || !userId) return;
    const trimmed = content.trim();
    appendMessage('user', content);
    setSending(true);
    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const formData = new FormData();
      formData.append('shopId', shopId);
      formData.append('file', file);

      const res = await fetch(`${apiBase}/ai/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      const res = await fetch(`${apiBase}/ai/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        <p className="text-xs text-gray-500">ผู้ช่วยอัจฉริยะสำหรับร้านของคุณ</p>
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
