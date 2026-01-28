import { useEffect, useMemo, useState } from 'react';
import liff from '@line/liff';
import { trackEvent } from '@/lib/tracker';
import {
  setStoredLineUserId,
  setStoredShopId,
  setStoredToken,
} from '@/lib/lineAuthStorage';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

type Status = 'idle' | 'loading' | 'ready' | 'error';

const STORE_KEY = 'cb_store_id';
type LineShop = {
  shopId: string;
  shopName: string;
  role?: string;
};

export default function LiffBridge() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('กำลังเชื่อมต่อ LINE...');
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [shops, setShops] = useState<LineShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selecting, setSelecting] = useState(false);
  const returnUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('returnUrl');
    return fromUrl ? decodeURIComponent(fromUrl) : '';
  }, []);
  const shopIdParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('shopId');
    if (!fromUrl && returnUrl) {
      const match = returnUrl.match(/\/public\/([^/?#]+)/);
      if (match?.[1]) {
        localStorage.setItem(STORE_KEY, match[1]);
        return match[1];
      }
    }
    if (fromUrl) {
      localStorage.setItem(STORE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(STORE_KEY);
  }, [returnUrl]);

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
        setStoredLineUserId(profile.userId);
        setLineUserId(profile.userId);

        const params = new URLSearchParams(window.location.search);
        const shopId = params.get('shopId') || localStorage.getItem(STORE_KEY);
        if (shopId) {
          await trackEvent(shopId, 'liff_bridge', {
            lineUserId: profile.userId,
          });
        }

        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const response = await fetch(`${base}/auth/line`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: profile.userId, shopId: shopIdParam || undefined }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'LINE login failed');
        }

        if (data?.requiresSelection && Array.isArray(data?.shops)) {
          setShops(data.shops);
          setSelectedShopId(data.shops[0]?.shopId || '');
          setStatus('ready');
          setMessage('กรุณาเลือกร้านเพื่อเข้าสู่ระบบ');
          return;
        }

        if (data?.token) {
          setStoredToken(data.token);
          setStoredShopId(data.shopId || '');
          try {
            const firebaseRes = await fetch(`${base}/auth/line/firebase`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.token}`,
              },
              body: JSON.stringify({ shopId: data.shopId || shopIdParam || undefined }),
            });
            const firebaseData = await firebaseRes.json();
            if (firebaseRes.ok && firebaseData?.firebaseToken) {
              await signInWithCustomToken(auth, firebaseData.firebaseToken);
            }
          } catch (error) {
            console.warn('Firebase sign-in (LIFF) failed', error);
          }
        }

        setStatus('ready');
        setMessage('เชื่อมต่อสำเร็จ');
      } catch (error: any) {
        console.error('LIFF init error', error);
        setStatus('error');
        setMessage(error?.message || 'เชื่อมต่อ LIFF ไม่สำเร็จ');
      }
    };

    init();
  }, [shopIdParam]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (shops.length > 0) return;
    setAutoRedirecting(true);
    const timer = window.setTimeout(() => {
      const fallbackUrl = '/ai-chat';
      const targetUrl = returnUrl || fallbackUrl;
      window.location.replace(targetUrl);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [status, shopIdParam, returnUrl, shops.length]);

  const handleSelectShop = async () => {
    if (!lineUserId || !selectedShopId) return;
    try {
      setSelecting(true);
      const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
      const response = await fetch(`${base}/auth/line/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineUserId, shopId: selectedShopId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'เลือก shop ไม่สำเร็จ');
      if (data?.token) {
        setStoredToken(data.token);
        setStoredShopId(data.shopId || '');
        try {
          const firebaseRes = await fetch(`${base}/auth/line/firebase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({ shopId: data.shopId || selectedShopId }),
          });
          const firebaseData = await firebaseRes.json();
          if (firebaseRes.ok && firebaseData?.firebaseToken) {
            await signInWithCustomToken(auth, firebaseData.firebaseToken);
          }
        } catch (error) {
          console.warn('Firebase sign-in (LIFF select) failed', error);
        }
      }
      setShops([]);
      setMessage('เชื่อมต่อสำเร็จ');
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'เลือก shop ไม่สำเร็จ');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 p-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          Mia-Connect BoosteSME
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Mia Bridge</h1>
        <p className="text-gray-600">{message}</p>
        {status === 'ready' && shops.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">เลือกร้านของคุณ</p>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
            >
              {shops.map((shop) => (
                <option key={shop.shopId} value={shop.shopId}>
                  {shop.shopName}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm"
              onClick={handleSelectShop}
              disabled={selecting}
            >
              {selecting ? 'กำลังเข้าสู่ระบบ...' : 'ยืนยัน'}
            </button>
          </div>
        )}
        {status === 'ready' && shops.length === 0 && (
          <>
            <p className="text-sm text-emerald-600">
              เชื่อมต่อสำเร็จแล้ว กำลังพาไปหน้าเว็บไซต์
            </p>
            <a
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white"
              href={returnUrl || '/ai-chat'}
            >
              {autoRedirecting ? 'กำลังพาไป...' : 'ไปหน้าเว็บไซต์'}
            </a>
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
