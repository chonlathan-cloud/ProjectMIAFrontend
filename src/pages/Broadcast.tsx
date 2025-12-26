import { useEffect, useMemo, useState } from 'react';
import { Send, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { sendBroadcast, getLineStatus, type LineStatusResponse } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export function Broadcast() {
  const [message, setMessage] = useState('');
  const [showAIVariants, setShowAIVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const { user, store } = useStore();
  const navigate = useNavigate();

  const canSend = useMemo(() => {
    return !!message.trim() && !!lineStatus?.connected && !sending;
  }, [message, lineStatus?.connected, sending]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusLoading(true);
        const res = await getLineStatus(store?.id);
        setLineStatus(res.data);
      } catch (err) {
        console.error('load line status error', err);
        setLineStatus({ connected: false } as any);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [store?.id]);

  const refreshStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await getLineStatus(store?.id);
      setLineStatus(res.data);
      if (res.data?.connected) toast.success('เชื่อมต่อ LINE OA แล้ว');
      else toast.warning('ยังไม่พบการเชื่อมต่อ LINE OA');
    } catch (err: any) {
      toast.error(err?.message || 'ตรวจสอบสถานะไม่สำเร็จ');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleGenerateAI = () => {
    if (!message.trim()) return toast.error('กรุณากรอกข้อความก่อน');

    if (user?.tier === 'starter') {
      toast.warning('ฟีเจอร์นี้สำหรับแพ็คเกจ Growth ขึ้นไป');
      return;
    }

    setShowAIVariants(true);
    const base = message.trim();
    setAiVariants([
      `บอกข่าวโปรโมชั่น: ${base}\nจบด้วยลิงก์สั่งซื้อ`,
      `ย้ำความเร่งด่วน: ${base}\nใส่โค้ดส่วนลดและเวลาหมดอายุ`,
      `ชวนกลับมาซื้อซ้ำ: ${base}\nแถมสิทธิ์พิเศษสำหรับลูกค้าเก่า`,
    ]);
    toast.success('สร้างข้อความด้วย AI สำเร็จ!');
  };

  const handleSelectVariant = (content: string) => {
    setMessage(content);
    setSelectedVariant(content);
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error('กรุณากรอกข้อความก่อนส่ง');

    if (!store?.id) {
      toast.error('ไม่พบร้านที่ใช้งานอยู่');
      return;
    }

    if (!lineStatus?.connected) {
      toast.error('กรุณาเชื่อมต่อ LINE OA ก่อนส่ง');
      navigate('/settings/store');
      return;
    }

    try {
      setSending(true);
      await sendBroadcast({ content: message, sendNow: true, storeId: store.id });
      toast.success('ส่ง Broadcast สำเร็จ');
      setMessage('');
      setShowAIVariants(false);
      setSelectedVariant(null);
      setAiVariants([]);
    } catch (err: any) {
      toast.error(err?.message || 'ส่ง Broadcast ไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none select-none opacity-10 flex items-center justify-center">
        <img src="/image/logo_mia.jpg" alt="LineBoost watermark" className="w-[120vw] max-w-none object-contain" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-5 lg:px-10 space-y-6">
        <Card className="border-0 bg-gradient-to-r from-white via-emerald-50 to-[#008080]/10 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Broadcast Center</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ส่งข้อความ</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  สร้างแบรอดแคสต์ที่ดูมืออาชีพ เลือกใช้ AI เพื่อเร่งการเขียน และส่งได้ทันที
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={() => setShowAIVariants(true)}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    ให้ AI ช่วยร่างข้อความ
                  </Button>
                  <Button variant="outline" size="lg" className="text-base" onClick={handleSend} disabled={!canSend}>
                    ส่งทันที
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 p-5 shadow-sm min-w-[280px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">สถานะการส่ง</p>
                <div className="mt-2 flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit">
                    {statusLoading
                      ? 'ตรวจสอบการเชื่อมต่อ...'
                      : lineStatus?.connected
                      ? `เชื่อมต่อแล้ว (${lineStatus.displayName || 'LINE OA'})`
                      : 'ยังไม่เชื่อมต่อ LINE OA'}
                  </Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {lineStatus?.connected ? 'พร้อมส่งจริงผ่าน LINE Messaging API' : 'กรุณาเชื่อมต่อ LINE OA ที่หน้า Store Integration'}
                  </p>

                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={refreshStatus} disabled={statusLoading}>
                      {statusLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะอีกครั้ง'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">สร้างข้อความใหม่</CardTitle>
                <CardDescription className="text-lg">เขียนข้อความหรือใช้ AI ช่วยสร้าง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="เขียนข้อความที่ต้องการส่ง หรือพิมพ์หัวข้อเพื่อให้ AI ช่วยสร้าง..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500">{message.length} / 1000 ตัวอักษร</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={handleGenerateAI} className="flex-1" disabled={user?.tier === 'starter'}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    สร้างด้วย AI
                  </Button>
                  <Button onClick={handleSend} className="flex-1" disabled={!canSend}>
                    <Send className="w-5 h-5 mr-2" />
                    {sending ? 'กำลังส่ง...' : 'ส่งข้อความ'}
                  </Button>
                </div>

                {!lineStatus?.connected && (
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    ยังไม่เชื่อมต่อ LINE OA — ไปที่หน้า Store Integration เพื่อเชื่อมต่อก่อนส่ง
                  </div>
                )}
              </CardContent>
            </Card>

            {showAIVariants && (
              <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">ข้อความที่ AI สร้าง</CardTitle>
                  <CardDescription className="text-lg">เลือกข้อความที่ต้องการใช้</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiVariants.map((variant, index) => (
                    <div
                      key={`${index}-${variant}`}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedVariant === variant
                          ? 'border-[#008080] bg-[#008080]/5 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#008080]/50'
                      }`}
                      onClick={() => handleSelectVariant(variant)}
                    >
                      {selectedVariant === variant && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-r from-[#008080] to-[#00a0a0] rounded-full flex items-center justify-center shadow">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <p className="text-base whitespace-pre-wrap text-gray-700 dark:text-gray-300">{variant}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">ผู้รับ</CardTitle>
                <CardDescription className="text-lg">MVP: ยังไม่แยกกลุ่ม</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">ส่งหา follower ทั้งหมดของ OA (ตาม LINE Broadcast)</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
