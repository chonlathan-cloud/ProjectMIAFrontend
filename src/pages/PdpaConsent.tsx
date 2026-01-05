import { useEffect, useMemo, useState } from 'react';
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
  const returnUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('returnUrl');
    return value ? decodeURIComponent(value) : '';
  }, []);
  const fallbackReturnUrl = storeId ? `/public/${storeId}` : '';
  const effectiveReturnUrl = returnUrl || fallbackReturnUrl;

  const lineUserId = useMemo(() => {
    return localStorage.getItem('cb_line_user_id');
  }, []);

  useEffect(() => {
    if (status !== 'done' || !effectiveReturnUrl) return;
    const timer = window.setTimeout(() => {
      window.location.replace(effectiveReturnUrl);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [status, effectiveReturnUrl]);

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

      if (consented) {
        const key = `cb_pdpa_accepted_${storeId}`;
        localStorage.setItem(key, 'true');
      }
      setStatus('done');
      setMessage(consented ? 'ขอบคุณสำหรับการยินยอม' : 'บันทึกการปฏิเสธเรียบร้อย');
    } catch (error) {
      console.error('[PDPA] consent submit failed', error);
      setStatus('error');
      setMessage('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-3xl border border-emerald-100/60 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
          <div className="p-8 lg:p-10 space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
                Mia-Connect BoosteSME
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                ความยินยอมในการใช้ข้อมูล (PDPA)
              </h1>
              <p className="text-gray-600">
                เพื่อให้คุณได้รับประสบการณ์ที่เหมาะสมกับร้านค้า เราขอความยินยอมในการจัดเก็บและใช้ข้อมูลบางส่วน
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">ข้อมูลที่จัดเก็บ</p>
                <p className="text-sm text-emerald-700">
                  LINE User ID, ประวัติการสนทนา, และพฤติกรรมการใช้งานในหน้าเว็บของร้านค้า
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">วัตถุประสงค์การใช้งาน</p>
                <p className="text-sm text-emerald-700">
                  ส่งข้อความที่เกี่ยวข้อง, ให้บริการหลังบ้าน, และปรับปรุงประสบการณ์ลูกค้า
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">RoPA Automation</p>
                <p className="text-sm text-emerald-700">
                  ระบบจะบันทึก Record of Processing Activities (RoPA) ทุกครั้งที่มีการยินยอม
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">สิทธิของคุณ</p>
                <p className="text-sm text-emerald-700">
                  สามารถขอถอนความยินยอม หรือลบข้อมูลได้ทุกเมื่อผ่านช่องทางติดต่อของร้านค้า
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">ช่องทางติดต่อ</p>
              <p>
                หากต้องการถอนความยินยอมหรือสอบถามข้อมูลเพิ่มเติม โปรดติดต่อร้านค้าผ่าน LINE OA
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-100">Consent Status</p>
              <p className="text-xl sm:text-2xl font-semibold">ยืนยันสิทธิการใช้งาน</p>
              <p className="text-emerald-100">{message}</p>
            </div>

            <div className="space-y-3">
              <button
                className="w-full px-5 py-3 rounded-xl bg-white text-emerald-700 font-semibold disabled:opacity-70"
                onClick={() => submitConsent(true)}
                disabled={status === 'saving' || status === 'done'}
              >
                {status === 'saving' ? 'กำลังบันทึก...' : status === 'done' ? 'ยืนยันแล้ว ✅' : 'ยินยอมและเริ่มใช้งาน'}
              </button>
              <button
                className="w-full px-5 py-3 rounded-xl border border-white/50 text-white/90 disabled:opacity-70"
                onClick={() => submitConsent(false)}
                disabled={status === 'saving' || status === 'done'}
              >
                ไม่ยินยอม
              </button>
            </div>

            <div className="space-y-2 text-xs text-emerald-100">
              {effectiveReturnUrl && status === 'done' && (
                <a
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/40 text-white"
                  href={effectiveReturnUrl}
                >
                  กลับไปหน้าเว็บ
                </a>
              )}
              {status === 'error' && (
                <p className="text-amber-200">บันทึกไม่สำเร็จ กรุณาลองใหม่</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
