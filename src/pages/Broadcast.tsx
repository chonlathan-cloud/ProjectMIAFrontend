import { useState } from 'react';
import { Send, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { mockAIGeneratedMessages } from '@/lib/mockData';
import { toast } from 'sonner';

export function Broadcast() {
  const [message, setMessage] = useState('');
  const [showAIVariants, setShowAIVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const { user } = useStore();

  const handleGenerateAI = () => {
    if (!message.trim()) {
      toast.error('กรุณากรอกข้อความก่อน');
      return;
    }

    if (user?.tier === 'starter') {
      toast.warning('ฟีเจอร์นี้สำหรับแพ็คเกจ Growth ขึ้นไป');
      return;
    }

    setShowAIVariants(true);
    toast.success('สร้างข้อความด้วย AI สำเร็จ!');
  };

  const handleSelectVariant = (content: string, id: string) => {
    setMessage(content);
    setSelectedVariant(id);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('กรุณากรอกข้อความก่อนส่ง');
      return;
    }

    toast.success('ส่งข้อความสำเร็จ! กำลังส่งถึงผู้ติดตาม 12,547 คน');
    setMessage('');
    setShowAIVariants(false);
    setSelectedVariant(null);
  };

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
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Broadcast Center</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ส่งข้อความ</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  สร้างแบรอดแคสต์ที่ดูมืออาชีพ เลือกใช้ AI เพื่อเร่งการเขียน และส่งหาเซกเมนต์ลูกค้าได้ทันที
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={() => setShowAIVariants(true)}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    ให้ AI ช่วยร่างข้อความ
                  </Button>
                  <Button variant="outline" size="lg" className="text-base" onClick={handleSend}>
                    ส่งทันที
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 p-5 shadow-sm min-w-[280px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">สรุปแคมเปญ</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-700 dark:text-gray-200">ผู้รับรวม</span>
                  <span className="text-2xl font-bold text-[#008080]">12,547</span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#008080] to-[#00a0a0]" style={{ width: '68%' }} />
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Engagement ล่าสุด: 68%</p>
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
                  <Label htmlFor="message">ข้อความ</Label>
                  <Textarea
                    id="message"
                    placeholder="เขียนข้อความที่ต้องการส่ง หรือพิมพ์หัวข้อเพื่อให้ AI ช่วยสร้าง..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500">
                    {message.length} / 1000 ตัวอักษร
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGenerateAI}
                    className="flex-1"
                    disabled={user?.tier === 'starter'}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    สร้างด้วย AI
                    {user?.tier === 'starter' && (
                      <Badge variant="secondary" className="ml-2">Pro</Badge>
                    )}
                  </Button>
                  <Button
                    onClick={handleSend}
                    className="flex-1"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    ส่งข้อความ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showAIVariants && (
              <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">ข้อความที่ AI สร้าง</CardTitle>
                  <CardDescription className="text-lg">เลือกข้อความที่ต้องการใช้</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockAIGeneratedMessages.map((variant) => (
                    <div
                      key={variant.id}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedVariant === variant.id
                          ? 'border-[#008080] bg-[#008080]/5 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#008080]/50'
                      }`}
                      onClick={() => handleSelectVariant(variant.content, variant.id)}
                    >
                      {selectedVariant === variant.id && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-r from-[#008080] to-[#00a0a0] rounded-full flex items-center justify-center shadow">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">ตัวเลือก {variant.variant}</Badge>
                      </div>
                      <p className="text-base whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {variant.content}
                      </p>
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
                <CardDescription className="text-lg">จำนวนผู้ที่จะได้รับข้อความ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-600 dark:text-gray-400">ผู้ติดตามทั้งหมด</span>
                    <span className="text-3xl font-bold text-[#008080]">12,547</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600 dark:text-gray-400">VIP</span>
                      <span className="font-semibold">2,145 คน</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600 dark:text-gray-400">Regular</span>
                      <span className="font-semibold">8,523 คน</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600 dark:text-gray-400">New</span>
                      <span className="font-semibold">1,879 คน</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">การใช้งาน</CardTitle>
                <CardDescription className="text-lg">ข้อความคงเหลือในเดือนนี้</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user?.tier === 'starter' ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-base">
                          <span>350 / 500 ข้อความ</span>
                          <span className="font-medium">70%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div className="bg-gradient-to-r from-[#008080] to-[#00a0a0] h-3 rounded-full" style={{ width: '70%' }} />
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" size="lg">
                        อัพเกรดเพื่อส่งไม่จำกัด
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-[#008080]">ไม่จำกัด</p>
                      <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                        ส่งข้อความได้ไม่จำกัด
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">เคล็ดลับ</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-base text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#008080] flex-shrink-0" />
                    <span>ใช้คำกระตุ้นการตัดสินใจ (Call-to-Action)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#008080] flex-shrink-0" />
                    <span>เพิ่ม Emoji เพื่อดึงดูดความสนใจ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#008080] flex-shrink-0" />
                    <span>ส่งเวลา 10:00-14:00 น. เพื่อ engagement สูงสุด</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#008080] flex-shrink-0" />
                    <span>ทดสอบด้วย A/B Testing ก่อนส่งจริง</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
