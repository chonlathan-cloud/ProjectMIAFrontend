import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import {
  sendBroadcast,
  getLineStatus,
  generateBroadcastAi,
  sendBroadcastMcp,
  uploadLineImage,
  type LineStatusResponse,
  type BroadcastAiLayout,
} from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export function Broadcast() {
  const [message, setMessage] = useState('');
  const [aiDrafts, setAiDrafts] = useState<BroadcastAiLayout[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<BroadcastAiLayout | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const maxImageBytes = 1024 * 1024;

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

  const handleGenerateAI = async () => {
    if (!message.trim()) return toast.error('กรุณากรอกข้อความก่อน');

    if (user?.tier === 'starter') {
      toast.warning('ฟีเจอร์นี้สำหรับแพ็คเกจ Growth ขึ้นไป');
      return;
    }

    if (!store?.id) {
      toast.error('ไม่พบร้านที่ใช้งานอยู่');
      return;
    }

    try {
      setAiLoading(true);
      const res: any = await generateBroadcastAi({
        storeId: store.id,
        content: message.trim(),
      });
      const variants = res?.data?.variants;
      if (!variants || !Array.isArray(variants) || variants.length === 0) {
        throw new Error('ไม่พบผลลัพธ์จาก AI');
      }
      setAiDrafts(variants);
      const preferred = variants.find((variant: BroadcastAiLayout) => variant.type === 'card');
      setSelectedDraft(preferred || variants[0] || null);
      setUploadedImageUrl(null);
      toast.success('สร้างข้อความด้วย AI สำเร็จ!');
    } catch (err: any) {
      toast.error(err?.message || 'สร้างข้อความด้วย AI ไม่สำเร็จ');
    } finally {
      setAiLoading(false);
    }
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
      setAiDrafts([]);
      setSelectedDraft(null);
      setUploadedImageUrl(null);
    } catch (err: any) {
      toast.error(err?.message || 'ส่ง Broadcast ไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const handleSendAi = async () => {
    if (!selectedDraft || !store?.id) return;

    if (!lineStatus?.connected) {
      toast.error('กรุณาเชื่อมต่อ LINE OA ก่อนส่ง');
      navigate('/settings/store');
      return;
    }

    try {
      setSending(true);
      if (selectedDraft.type === 'text') {
        await sendBroadcastMcp({
          storeId: store.id,
          type: 'text',
          text: selectedDraft.text,
        });
      } else if (selectedDraft.type === 'card') {
        await sendBroadcastMcp({
          storeId: store.id,
          type: 'card',
          card: {
            ...selectedDraft.card,
            altText: selectedDraft.altText,
            imageUrl: uploadedImageUrl || selectedDraft.card.imageUrl,
          },
        });
      } else {
        await sendBroadcastMcp({
          storeId: store.id,
          type: 'flex',
          flex: {
            altText: selectedDraft.altText,
            contents: selectedDraft.flex.contents,
          },
        });
      }
      toast.success('ส่ง Broadcast ด้วย AI สำเร็จ');
      setAiDrafts([]);
      setSelectedDraft(null);
      setUploadedImageUrl(null);
      setMessage('');
    } catch (err: any) {
      toast.error(err?.message || 'ส่ง Broadcast ไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none select-none opacity-10 flex items-center justify-center">
        <img src="/image/logo_mia.jpg" alt="Mia-Connect BoosteSME watermark" className="w-[120vw] max-w-none object-contain" />
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
                  <Button size="lg" onClick={handleGenerateAI} disabled={aiLoading}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {aiLoading ? 'กำลังสร้าง...' : 'ให้ AI ช่วยร่างข้อความ'}
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
                  <Button
                    variant="outline"
                    onClick={handleGenerateAI}
                    className="flex-1"
                    disabled={user?.tier === 'starter' || aiLoading}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {aiLoading ? 'กำลังสร้าง...' : 'สร้างด้วย AI'}
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

            {aiDrafts.length > 0 && (
              <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">ตัวอย่างข้อความจาก AI</CardTitle>
                  <CardDescription className="text-lg">
                    เลือก 1 แบบเพื่อส่ง (ข้อความ, Card, Flex)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiDrafts.map((variant, index) => (
                      <button
                        key={`${variant.type}-${index}`}
                        type="button"
                        onClick={() => setSelectedDraft(variant)}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          selectedDraft === variant
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                        }`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                          {variant.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {variant.type === 'text'
                            ? 'ข้อความธรรมดา'
                            : variant.type === 'card'
                            ? 'Card Message'
                            : 'Flex Message'}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedDraft?.type === 'text' && (
                    <div className="border rounded-xl p-4 bg-white dark:bg-gray-900">
                      <p className="text-sm text-gray-500 mb-2">ข้อความ</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedDraft.text}
                      </p>
                    </div>
                  )}

                  {selectedDraft?.type === 'card' ? (
                    <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 space-y-3">
                      {(uploadedImageUrl || selectedDraft.card.imageUrl) && (
                        <img
                          src={uploadedImageUrl || selectedDraft.card.imageUrl}
                          alt="card preview"
                          className="w-full h-44 object-cover rounded-lg"
                        />
                      )}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{selectedDraft.card.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedDraft.card.body}
                        </p>
                      </div>
                      {selectedDraft.card.ctaLabel && (
                        <div className="inline-flex items-center gap-2 text-sm text-emerald-600">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                            {selectedDraft.card.ctaLabel}
                          </span>
                          {selectedDraft.card.ctaUrl && (
                            <span className="text-xs text-gray-400 truncate">{selectedDraft.card.ctaUrl}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : selectedDraft?.type === 'flex' ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-slate-50 dark:bg-slate-900/60">
                      <p className="text-sm text-gray-500 mb-2">Flex payload (JSON)</p>
                      <pre className="text-xs whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300">
                        {JSON.stringify(selectedDraft.flex.contents, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  {selectedDraft?.type === 'card' && (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        แนบรูปสำหรับ Card (จะอัปโหลดและแทนที่ imageUrl)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file || !store?.id) return;
                          if (file.size > maxImageBytes) {
                            toast.error('ไฟล์ใหญ่เกิน 1MB กรุณาลดขนาดก่อนอัปโหลด');
                            return;
                          }

                          try {
                            setUploadingImage(true);
                            const reader = new FileReader();
                            const dataBase64 = await new Promise<string>((resolve, reject) => {
                              reader.onload = () => {
                                const result = reader.result;
                                if (typeof result !== 'string') {
                                  reject(new Error('Invalid file'));
                                  return;
                                }
                                const base64 = result.split(',')[1] || '';
                                resolve(base64);
                              };
                              reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
                              reader.readAsDataURL(file);
                            });

                            const res: any = await uploadLineImage({
                              storeId: store.id,
                              fileName: file.name,
                              contentType: file.type || 'image/png',
                              dataBase64,
                            });
                            const url = res?.data?.url;
                            if (!url) throw new Error('ไม่พบ URL รูป');
                            setUploadedImageUrl(url);
                            toast.success('อัปโหลดรูปสำเร็จ');
                          } catch (err: any) {
                            toast.error(err?.message || 'อัปโหลดรูปไม่สำเร็จ');
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? 'กำลังอัปโหลด...' : 'แนบรูปจากเครื่อง'}
                      </Button>
                      {uploadingImage && (
                        <p className="text-xs text-gray-500 mt-2">กำลังอัปโหลด...</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">ไฟล์ไม่เกิน 1MB</p>
                      {uploadedImageUrl && (
                        <p className="text-xs text-emerald-600 break-all mt-2">อัปโหลดแล้ว: {uploadedImageUrl}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleSendAi} className="flex-1" disabled={sending || !selectedDraft}>
                      {sending ? 'กำลังส่ง...' : 'ส่งด้วย AI'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAiDrafts([]);
                        setSelectedDraft(null);
                        setUploadedImageUrl(null);
                      }}
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                  </div>
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
