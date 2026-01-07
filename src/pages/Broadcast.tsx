import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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

type LineQuotaInfo = {
  limit: number;
  totalUsage: number;
  remaining: number;
};

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
  const [quotaInfo, setQuotaInfo] = useState<LineQuotaInfo | null>(null);
  const [editableText, setEditableText] = useState('');
  const [editableCard, setEditableCard] = useState<{
    title: string;
    body: string;
    altText: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  } | null>(null);
  const [editableFlex, setEditableFlex] = useState<{
    altText: string;
    contentsText: string;
  } | null>(null);
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

  useEffect(() => {
    if (!selectedDraft) {
      setEditableText('');
      setEditableCard(null);
      setEditableFlex(null);
      return;
    }

    if (selectedDraft.type === 'text') {
      setEditableText(selectedDraft.text || '');
      setEditableCard(null);
      setEditableFlex(null);
      return;
    }

    if (selectedDraft.type === 'card') {
      setEditableCard({
        title: selectedDraft.card.title || '',
        body: selectedDraft.card.body || '',
        altText: selectedDraft.altText || '',
        imageUrl: selectedDraft.card.imageUrl,
        ctaLabel: selectedDraft.card.ctaLabel,
        ctaUrl: selectedDraft.card.ctaUrl,
      });
      setEditableText('');
      setEditableFlex(null);
      return;
    }

    if (selectedDraft.type === 'flex') {
      setEditableFlex({
        altText: selectedDraft.altText || '',
        contentsText: JSON.stringify(selectedDraft.flex.contents, null, 2),
      });
      setEditableText('');
      setEditableCard(null);
    }
  }, [selectedDraft]);

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
      let res: any = null;
      if (selectedDraft.type === 'text') {
        const nextText = editableText.trim();
        if (!nextText) {
          toast.error('กรุณาระบุข้อความก่อนส่ง');
          return;
        }
        res = await sendBroadcastMcp({
          storeId: store.id,
          type: 'text',
          text: nextText,
        });
      } else if (selectedDraft.type === 'card') {
        const nextCard = editableCard;
        if (!nextCard?.title || !nextCard.body || !nextCard.altText) {
          toast.error('กรุณากรอกข้อมูล card ให้ครบ');
          return;
        }
        res = await sendBroadcastMcp({
          storeId: store.id,
          type: 'card',
          card: {
            title: nextCard.title,
            body: nextCard.body,
            altText: nextCard.altText,
            ctaLabel: nextCard.ctaLabel,
            ctaUrl: nextCard.ctaUrl,
            imageUrl: uploadedImageUrl || nextCard.imageUrl,
          },
        });
      } else {
        const nextFlex = editableFlex;
        if (!nextFlex?.altText || !nextFlex.contentsText.trim()) {
          toast.error('กรุณากรอกข้อมูล flex ให้ครบ');
          return;
        }
        let parsedContents: any = null;
        try {
          parsedContents = JSON.parse(nextFlex.contentsText);
        } catch {
          toast.error('Flex JSON ไม่ถูกต้อง');
          return;
        }
        res = await sendBroadcastMcp({
          storeId: store.id,
          type: 'flex',
          flex: {
            altText: nextFlex.altText,
            contents: parsedContents,
          },
        });
      }
      const quota = res?.data?.quota || res?.quota;
      if (quota?.remaining !== undefined) {
        setQuotaInfo(quota);
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
    <div className="relative overflow-hidden" style={{ animation: 'broadcast-fade 0.6s ease-out' }}>
      <style>
        {`
          @keyframes broadcast-fade {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute -bottom-40 left-10 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[120px]" />
      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.08] flex items-center justify-center">
        <img src="/image/logo_mia.jpg" alt="Mia watermark" className="w-[120vw] max-w-none object-contain" />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-5 lg:px-10 space-y-8">
        <Card className="border-0 bg-gradient-to-br from-white via-emerald-50 to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 shadow-xl">
          <CardContent className="p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  <span className="rounded-full border border-emerald-300/60 px-3 py-1">AI Action Layer</span>
                  <span className="rounded-full border border-amber-300/60 px-3 py-1">MCP Enabled</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white">
                  Broadcast Command Center
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  พิมพ์คำสั่งธรรมชาติให้ AI สร้างข้อความ (Text / Card / Flex) แล้วส่งผ่าน LINE OA ได้ทันที
                  พร้อมตัวอย่างและการอัปโหลดภาพสำหรับ Card
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={handleGenerateAI} disabled={aiLoading}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {aiLoading ? 'กำลังสร้าง...' : 'สร้างด้วย AI Action'}
                  </Button>
                  <Button variant="outline" size="lg" className="text-base" onClick={handleSend} disabled={!canSend}>
                    ส่งข้อความธรรมดาทันที
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 p-5 shadow-sm min-w-[280px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">สถานะการส่ง</p>
                <div className="mt-2 flex flex-col gap-2">
                  <Badge variant="outline" className="w-fit">
                    {statusLoading
                      ? 'ตรวจสอบการเชื่อมต่อ...'
                      : lineStatus?.connected
                      ? `เชื่อมต่อแล้ว (${lineStatus.displayName || 'LINE OA'})`
                      : 'ยังไม่เชื่อมต่อ LINE OA'}
                  </Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {lineStatus?.connected
                      ? 'พร้อมส่งจริงผ่าน LINE Messaging API'
                      : 'กรุณาเชื่อมต่อ LINE OA ที่หน้า Store Integration'}
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

        <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-6">
          <div className="space-y-6">
            <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">คำสั่งหลัก</CardTitle>
                <CardDescription className="text-lg">พิมพ์ข้อความตั้งต้น แล้วให้ AI เลือก layout ที่เหมาะสม</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="ตัวอย่าง: ช่วยบรอดแคสต์โปรส้มตำ 29 บาท ให้ลูกค้ากลุ่มหิวดึก พร้อมปุ่มสั่งซื้อ"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <div className="flex flex-wrap items-center text-sm text-gray-500">
                    <span>{message.length} / 1000 ตัวอักษร</span>
                    <span className="flex-1 text-center text-xs text-gray-500">
                      ข้อความต้องไม่เกิน 1000 ตัวอักษร
                    </span>
                    <span className="text-xs text-emerald-700">
                      AI จะสร้าง 3 แบบ: text / card / flex
                    </span>
                  </div>
                  {quotaInfo && (
                    <div className="text-xs text-center text-gray-500">
                      โควต้าบรอดแคสต์คงเหลือ: {quotaInfo.remaining} / {quotaInfo.limit}
                    </div>
                  )}
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
                    {sending ? 'กำลังส่ง...' : 'ส่งข้อความธรรมดา'}
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
                  <CardTitle className="text-2xl">AI Output</CardTitle>
                  <CardDescription className="text-lg">เลือกแบบที่ต้องการส่งผ่าน MCP</CardDescription>
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
                    <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 space-y-3">
                      <p className="text-sm text-gray-500">ข้อความ</p>
                      <Textarea
                        value={editableText}
                        onChange={(event) => setEditableText(event.target.value)}
                        rows={5}
                      />
                    </div>
                  )}

                  {selectedDraft?.type === 'card' ? (
                    <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 space-y-3">
                      {(uploadedImageUrl || editableCard?.imageUrl) && (
                        <img
                          src={uploadedImageUrl || editableCard?.imageUrl}
                          alt="card preview"
                          className="w-full h-44 object-cover rounded-lg"
                        />
                      )}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">Alt Text</label>
                          <Input
                            value={editableCard?.altText || ''}
                            onChange={(event) =>
                              setEditableCard((prev) =>
                                prev ? { ...prev, altText: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">Title</label>
                          <Input
                            value={editableCard?.title || ''}
                            onChange={(event) =>
                              setEditableCard((prev) =>
                                prev ? { ...prev, title: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">Body</label>
                          <Textarea
                            value={editableCard?.body || ''}
                            onChange={(event) =>
                              setEditableCard((prev) =>
                                prev ? { ...prev, body: event.target.value } : prev
                              )
                            }
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500">CTA Label</label>
                            <Input
                              value={editableCard?.ctaLabel || ''}
                              onChange={(event) =>
                                setEditableCard((prev) =>
                                  prev ? { ...prev, ctaLabel: event.target.value } : prev
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500">CTA URL</label>
                            <Input
                              value={editableCard?.ctaUrl || ''}
                              onChange={(event) =>
                                setEditableCard((prev) =>
                                  prev ? { ...prev, ctaUrl: event.target.value } : prev
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedDraft?.type === 'flex' ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 bg-slate-50 dark:bg-slate-900/60">
                      <p className="text-sm text-gray-500 mb-2">Flex payload (JSON)</p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">Alt Text</label>
                          <Input
                            value={editableFlex?.altText || ''}
                            onChange={(event) =>
                              setEditableFlex((prev) =>
                                prev ? { ...prev, altText: event.target.value } : prev
                              )
                            }
                          />
                        </div>
                        <Textarea
                          value={editableFlex?.contentsText || ''}
                          onChange={(event) =>
                            setEditableFlex((prev) =>
                              prev ? { ...prev, contentsText: event.target.value } : prev
                            )
                          }
                          rows={8}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : null}

                  {selectedDraft?.type === 'card' && (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 bg-amber-50/40 dark:bg-amber-900/10">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        แนบรูปสำหรับ Card (ระบบจะอัปโหลดและแทนที่ imageUrl)
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
                <CardTitle className="text-2xl">เส้นทางการส่ง</CardTitle>
                <CardDescription className="text-lg">แสดงรูปแบบที่ API รองรับ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4">
                  <p className="font-semibold text-emerald-800">AI Broadcast (MCP)</p>
                  <p>สร้าง text/card/flex จากภาษาธรรมชาติ แล้วส่งผ่าน MCP endpoint</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">ข้อความธรรมดา</p>
                  <p>ส่งตาม API เดิม เหมาะกับข้อความสั้น หรือทดสอบเร็ว</p>
                </div>
                <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                  <p className="font-semibold text-amber-800">Card + รูป</p>
                  <p>อัปโหลดรูปเพื่อแทนที่ imageUrl ก่อนส่ง ช่วยให้โปรโมชันดูเด่น</p>
                </div>
              </CardContent>
            </Card>

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
