import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import {
  authedJson,
  createLineConnect,
  getLineStatus,
  listStores,
  saveLineCredentials,
  type LineStatusResponse,
} from '@/lib/api';
import { useStore } from '@/store/useStore';

export function LineSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [channelAccessToken, setChannelAccessToken] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [lineDisplayName, setLineDisplayName] = useState('');
  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { user } = useStore();

  // ตรวจ query param เมื่อกลับมาจาก LINE callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === '1') {
      setConnected(true);
      setStep(4);
      toast.success('เชื่อมต่อ Line Official Account เรียบร้อยแล้ว');
    }
    listStores()
      .then((res) => {
        const list = res?.data?.stores || res?.stores || [];
        setStores(list);
        if (list.length) setStoreId(list[0].id);
      })
      .catch((err) => {
        console.error('load stores error', err);
        toast.error('โหลดรายการสโตร์ไม่สำเร็จ');
      });

    const fetchStatus = async () => {
      try {
        setStatusLoading(true);
        const statusRes = await getLineStatus();
        const data = statusRes?.data;
        setLineStatus(data);

        if (data?.connected) {
          setConnected(true);
          setStep(4);
          setLineUserId(data.lineAccountId || data.lineUserId || '');
          setLineDisplayName(data.displayName || '');
          setAccountName((prev) => data.displayName || prev || '');
          setAccountId((prev) => data.lineAccountId || data.lineUserId || prev || '');
        }
      } catch (err) {
        console.error('load line status error', err);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // ปุ่มบน: เชื่อมต่อผ่าน LINE ในหน้านี้ (redirect ตรง)
  const handleConnect = async () => {
    if (connected || lineStatus?.connected) {
      toast.info('เชื่อมต่อ LINE OA แล้ว');
      return;
    }
    try {
      setConnecting(true);
      const res = await authedJson<{
        success?: boolean;
        data?: { loginUrl?: string; state?: string };
        message?: string;
      }>('/api/line/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: {
            firebaseUid: user?.id,
            storeId: storeId || undefined,
          },
        }),
      });

      if (res && 'success' in res && res.success === false) {
        throw new Error(res.message || 'เริ่มเชื่อมต่อ LINE ไม่สำเร็จ');
      }

      const url = res?.data?.loginUrl;
      if (!url) {
        throw new Error(res?.message || 'ไม่พบ loginUrl จากเซิร์ฟเวอร์');
      }

      toast.success('กำลังพาไปเชื่อมต่อ LINE...');
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เชื่อมต่อ LINE ไม่สำเร็จ';
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  };

  // ยิงสร้าง URL + QR ใช้ใน wizard (Step 1 → Step 2)
  const handleShowQr = async () => {
    if (connected || lineStatus?.connected) {
      toast.info('เชื่อมต่อ LINE OA แล้ว');
      setStep(4);
      return;
    }
    try {
      setConnecting(true);
      const { loginUrl: url } = await createLineConnect({
        state: {
          firebaseUid: user?.id,
          storeId: storeId || undefined,
        },
      });

      if (!url) {
        throw new Error('ไม่พบ loginUrl จากเซิร์ฟเวอร์');
      }

      setLoginUrl(url);
      setStep(2);
      toast.success('สร้าง QR Code สำหรับเชื่อมต่อ LINE แล้ว');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'สร้าง QR สำหรับเชื่อมต่อ LINE ไม่สำเร็จ';
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  };

  // ปุ่มบน: ดูวิธีเชื่อมต่อด้วย QR → แค่พาผู้ใช้ไปอ่าน wizard ด้านล่าง
  const handleGuideClick = () => {
    setStep(1);
    toast.info('ดูขั้นตอนการเชื่อมต่อด้วย QR ได้ด้านล่าง');
    const el = document.getElementById('line-setup-steps');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveCredentials = async () => {
    if (!storeId) {
      toast.error('กรุณาเลือกสโตร์');
      return;
    }
    if (!channelAccessToken.trim()) {
      toast.error('กรุณากรอก Channel Access Token');
      return;
    }
    try {
      setConnecting(true);
      await saveLineCredentials(storeId, {
        channelAccessToken,
        channelSecret: channelSecret || undefined,
        lineUserId: lineUserId || undefined,
        displayName: lineDisplayName || undefined,
      });
      toast.success('บันทึกโทเคน LINE สำเร็จ');
      const refreshed = await getLineStatus();
      setLineStatus(refreshed.data);
    } catch (err: any) {
      toast.error(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setConnecting(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'เตรียมบัญชี Line OA',
      description: 'ตรวจสอบว่าคุณมี Line Official Account แล้ว',
    },
    {
      number: 2,
      title: 'สแกน QR Code',
      description: 'ใช้แอป Line สแกน QR Code เพื่อเชื่อมต่อ',
    },
    {
      number: 3,
      title: 'กรอกข้อมูล',
      description: 'กรอกข้อมูลบัญชี Line OA ของคุณ',
    },
    {
      number: 4,
      title: 'เสร็จสิ้น',
      description: 'เริ่มใช้งาน LineBoost SME',
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none select-none opacity-10 flex items-center justify-center">
        <img
          src="/image/logo_mia.jpg"
          alt="LineBoost watermark"
          className="w-[120vw] max-w-none object-contain"
        />
      </div>
      <div className="relative max-w-screen-2xl mx-auto px-5 lg:px-10 space-y-6">
        <Card className="border-0 bg-gradient-to-r from-white via-emerald-50 to-[#008080]/10 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  Line OA Setup
                </p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  เชื่อมต่อ Line Official Account
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  ทำตามขั้นตอนแบบเป็นลำดับเพื่อให้บัญชี Line OA เชื่อมกับ LineBoost อย่างปลอดภัย
                  และเริ่มใช้งานได้ทันที
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={connecting || connected || lineStatus?.connected}
                  >
                    {connected || lineStatus?.connected
                      ? 'เชื่อมต่อแล้ว'
                      : connecting
                      ? 'กำลังเชื่อมต่อ...'
                      : 'เริ่มเชื่อมต่อผ่าน LINE'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleGuideClick}
                    disabled={connecting}
                    className="text-base"
                  >
                    ดูวิธีเชื่อมต่อด้วย QR
                  </Button>
                </div>
              </div>
              <div className="space-y-4 min-w-[280px]">
                <div className="rounded-2xl border border-white/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#008080] to-emerald-500 text-white flex items-center justify-center">
                      {statusLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">LINE OA Status</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {lineStatus?.connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}
                      </p>
                      {lineStatus?.connected && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 truncate">
                          {lineStatus.displayName || lineDisplayName || 'LINE OA'} ({lineStatus.lineAccountId || lineStatus.lineUserId || 'ไม่พบ channelId'})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 p-5 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">สถานะ</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Step {step} / 4
                  </h3>
                  <div className="mt-4 h-2 rounded-full bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#008080] to-[#00a0a0]"
                      style={{ width: `${(step / 4) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {steps[step - 1]?.title}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle>ตั้งค่าโทเคน LINE สำหรับสโตร์</CardTitle>
            <CardDescription>รองรับหลายร้าน หลาย LINE OA โดยกรอก Channel Access Token / Secret ต่อสโตร์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label>เลือกสโตร์</Label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <Label>LINE OA ID (channelId)</Label>
                <Input
                  placeholder="1657xxxxxx"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Label>ชื่อแสดงในระบบ</Label>
                <Input
                  placeholder="ชื่อ OA"
                  value={lineDisplayName}
                  onChange={(e) => setLineDisplayName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Channel Access Token</Label>
                <Input
                  placeholder="LINE Messaging API channel access token"
                  value={channelAccessToken}
                  onChange={(e) => setChannelAccessToken(e.target.value)}
                />
              </div>
              <div>
                <Label>Channel Secret (ถ้ามี)</Label>
                <Input
                  placeholder="LINE channel secret"
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveCredentials} disabled={connecting}>
                {connecting ? 'กำลังบันทึก...' : 'บันทึกโทเคน LINE'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div
          id="line-setup-steps"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {steps.map((s) => (
            <Card
              key={s.number}
              className={`
                border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm
                ${step === s.number ? 'ring-2 ring-[#008080]/60' : ''}
              `}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 font-semibold ${
                    step > s.number
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100'
                      : step === s.number
                      ? 'bg-gradient-to-r from-[#008080] to-[#00a0a0] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step > s.number ? <Check className="w-5 h-5" /> : <span>{s.number}</span>}
                </div>
                <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {s.title}
                </CardTitle>
                <CardDescription className="text-sm">{s.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && 'ขั้นตอนที่ 1: เตรียมบัญชี Line OA'}
              {step === 2 && 'ขั้นตอนที่ 2: สแกน QR Code'}
              {step === 3 && 'ขั้นตอนที่ 3: กรอกข้อมูล'}
              {step === 4 && 'ขั้นตอนที่ 4: เสร็จสิ้น'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
                    ข้อกำหนดเบื้องต้น
                  </h3>
                  <ul className="space-y-3 text-base text-emerald-800 dark:text-emerald-200">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>
                        มี Line Official Account (ถ้ายังไม่มี สามารถสร้างได้ที่ Line Business ID)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>มีสิทธิ์ Admin ในบัญชี Line OA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>
                        เปิดใช้งาน Messaging API (ตั้งค่าได้ที่ Line Official Account Manager)
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3">
                  <Button onClick={handleShowQr} disabled={connecting}>
                    {connecting ? 'กำลังสร้าง QR...' : 'ถัดไป'}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center py-8">
                  <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-gray-300 dark:border-gray-700">
                    {loginUrl ? (
                      <QRCode value={loginUrl} className="w-56 h-56" />
                    ) : (
                      <p className="text-gray-500 text-sm text-center px-4">
                        กำลังเตรียม QR สำหรับเชื่อมต่อ LINE...
                      </p>
                    )}
                  </div>
                  <p className="text-center text-gray-600 dark:text-gray-400 text-lg">
                    เปิดแอป Line แล้วสแกน QR Code นี้
                    <br />
                    เพื่ออนุญาตให้ LineBoost SME เข้าถึงบัญชีของคุณ
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ย้อนกลับ
                  </Button>
                  <Button onClick={() => setStep(3)}>สแกนแล้ว ถัดไป</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">ชื่อบัญชี Line OA</Label>
                    <Input
                      id="accountName"
                      placeholder="เช่น ร้านค้าของฉัน"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountId">LINE ID</Label>
                    <Input
                      id="accountId"
                      placeholder="เช่น @myshop"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      หา LINE ID ได้จาก Line Official Account Manager
                    </p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ย้อนกลับ
                  </Button>
                  <Button onClick={() => setStep(4)}>ถัดไป</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="flex justify-center mb-5">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    พร้อมใช้งาน!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    คุณได้เชื่อมต่อ Line Official Account เรียบร้อยแล้ว
                    <br />
                    เริ่มต้นใช้งาน LineBoost SME เพื่อเพิ่มยอดขายของคุณ
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ชื่อบัญชี:</span>
                    <span className="font-semibold">
                      {lineStatus?.displayName || accountName || 'ร้านค้าของฉัน'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">LINE ID:</span>
                    <span className="font-semibold">
                      {lineStatus?.lineAccountId || lineStatus?.lineUserId || accountId || '@myshop'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => navigate('/')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    เริ่มใช้งาน LineBoost SME
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
