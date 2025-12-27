import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { trackEvent } from '@/lib/tracker';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export default function LiffBridge() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('กำลังเชื่อมต่อ LINE...');

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('loading');
        const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
        if (!liffId) {
          setStatus('error');
          setMessage('ยังไม่ได้ตั้งค่า VITE_LIFF_ID');
          return;
        }

        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        localStorage.setItem('cb_line_user_id', profile.userId);

        const params = new URLSearchParams(window.location.search);
        const storeId = params.get('storeId');
        if (storeId) {
          await trackEvent(storeId, 'liff_bridge', {
            lineUserId: profile.userId,
          });
        }

        setStatus('ready');
        setMessage('เชื่อมต่อสำเร็จ สามารถกลับไปใช้งานได้เลย');
      } catch (error: any) {
        console.error('LIFF init error', error);
        setStatus('error');
        setMessage(error?.message || 'เชื่อมต่อ LIFF ไม่สำเร็จ');
      }
    };

    init();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 p-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          LineBoost SME
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Mia Bridge</h1>
        <p className="text-gray-600">{message}</p>
        {status === 'ready' && (
          <p className="text-sm text-emerald-600">
            คุณสามารถปิดหน้านี้และกลับไปใช้งานระบบได้เลย
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500">
            กรุณาลองใหม่ หรือแจ้งทีมงาน
          </p>
        )}
      </div>
    </div>
  );
}
