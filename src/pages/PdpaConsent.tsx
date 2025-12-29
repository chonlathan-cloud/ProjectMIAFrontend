import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const resolveApiBase = () => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) return '';
  return base.endsWith('/api') ? base : `${base}/api`;
};

export default function PdpaConsent() {
  const { storeId } = useParams<{ storeId: string }>();
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('กรุณายืนยันความยินยอม PDPA');
  const bridgeUrl = storeId ? `/liff-bridge?storeId=${storeId}` : '/liff-bridge';

  const lineUserId = useMemo(() => {
    return localStorage.getItem('cb_line_user_id');
  }, []);

  const submitConsent = async (consented: boolean) => {
    if (!storeId || !lineUserId) {
      setStatus('error');
      setMessage('ไม่พบ storeId หรือ lineUserId (กรุณาเปิดผ่าน LIFF)');
      return;
    }

    try {
      setStatus('saving');
      const base = resolveApiBase();
      const endpoint = `${base}/pdpa/consent`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          lineUserId,
          consented,
          source: 'miniapp',
          purpose: 'marketing',
          policyVersion: 'v1',
        }),
      });

      if (!res.ok) throw new Error('consent_failed');

      setStatus('done');
      setMessage(consented ? 'ขอบคุณสำหรับการยินยอม' : 'บันทึกการปฏิเสธเรียบร้อย');
    } catch (error) {
      console.error('[PDPA] consent submit failed', error);
      setStatus('error');
      setMessage('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-6 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
          Mia-Connect BoosteSME
        </p>
        <h1 className="text-2xl font-bold text-gray-900">PDPA Consent</h1>
        <p className="text-gray-600">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            className="px-5 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-60"
            onClick={() => submitConsent(true)}
            disabled={status === 'saving'}
          >
            ยอมรับ
          </button>
          <button
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-60"
            onClick={() => submitConsent(false)}
            disabled={status === 'saving'}
          >
            ไม่ยอมรับ
          </button>
        </div>

        <p className="text-xs text-gray-400">
          จำเป็นต้องเปิดผ่าน LIFF เพื่อยืนยันตัวตน
        </p>
        <a
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-emerald-200 text-emerald-600"
          href={bridgeUrl}
        >
          เปิด LIFF อีกครั้ง
        </a>
      </div>
    </div>
  );
}
