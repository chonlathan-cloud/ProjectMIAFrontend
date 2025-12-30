import { useEffect, useMemo, useState } from 'react';
import liff from '@line/liff';
import { trackEvent } from '@/lib/tracker';

type Status = 'idle' | 'loading' | 'ready' | 'error';

const STORE_KEY = 'cb_store_id';

export default function LiffBridge() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('กำลังเชื่อมต่อ LINE...');
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const storeId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('storeId');
    if (fromUrl) {
      localStorage.setItem(STORE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORE_KEY);
  }, []);

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
        const storeId = params.get('storeId') || localStorage.getItem(STORE_KEY);
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

  useEffect(() => {
    if (status !== 'ready' || !storeId) return;
    setAutoRedirecting(true);
    const timer = window.setTimeout(() => {
      window.location.replace(`/pdpa/${storeId}`);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [status, storeId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 p-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          Mia-Connect BoosteSME
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Mia Bridge</h1>
        <p className="text-gray-600">{message}</p>
        {status === 'ready' && (
          <>
            <p className="text-sm text-emerald-600">
              เชื่อมต่อสำเร็จแล้ว กำลังพาไปหน้า PDPA
            </p>
            {storeId && (
              <a
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white"
                href={`/pdpa/${storeId}`}
              >
                {autoRedirecting ? 'กำลังพาไป...' : 'ไปหน้า PDPA'}
              </a>
            )}
          </>
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
