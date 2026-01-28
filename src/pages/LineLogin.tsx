import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  setStoredLineUserId,
  setStoredShopId,
  setStoredToken,
} from '@/lib/lineAuthStorage';

export default function LineLogin() {
  const [status, setStatus] = useState<'loading' | 'error' | 'redirect'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ LINE Login...');

  const apiBase = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    return base.replace(/\/$/, '');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const token = params.get('token');
    const shopId = params.get('shopId');
    const lineUserId = params.get('lineUserId');

    if (error === 'no_shop') {
      setStatus('error');
      setMessage('ยังไม่พบการเชื่อมต่อร้านค้า กรุณากดปุ่มเริ่มต้นใช้งานครั้งแรกจาก LINE OA');
      return;
    }

    if (token && shopId) {
      setStoredToken(token);
      setStoredShopId(shopId);
      if (lineUserId) {
        setStoredLineUserId(lineUserId);
      }
      setStatus('redirect');
      setMessage('กำลังพาไปหน้า AI Chat...');
      window.location.replace('/ai-chat');
      return;
    }

    const signedToken = params.get('t');
    const bootstrap = async () => {
      try {
        const endpoint = signedToken ? '/auth/line/bootstrap' : '/auth/line/login-url';
        const response = await fetch(`${apiBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: signedToken ? JSON.stringify({ token: signedToken }) : undefined,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'LINE Login bootstrap failed');
        }
        if (!data?.loginUrl) {
          throw new Error('ไม่พบลิงก์สำหรับ LINE Login');
        }
        window.location.href = data.loginUrl;
      } catch (error: any) {
        console.error('LineLogin bootstrap error', error);
        toast.error(error?.message || 'เชื่อมต่อ LINE Login ไม่สำเร็จ');
        setStatus('error');
        setMessage(error?.message || 'เชื่อมต่อ LINE Login ไม่สำเร็จ');
      }
    };

    bootstrap();
  }, [apiBase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 p-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          Mia-Connect BoosteSME
        </p>
        <h1 className="text-2xl font-bold text-gray-900">LINE Login</h1>
        <p className="text-gray-600">{message}</p>
        {status === 'error' && (
          <button
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        )}
      </div>
    </div>
  );
}
