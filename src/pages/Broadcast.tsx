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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ส่งข้อความ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">สร้างและส่งแบรอดแคสต์ถึงลูกค้าของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สร้างข้อความใหม่</CardTitle>
              <CardDescription>เขียนข้อความหรือใช้ AI ช่วยสร้าง</CardDescription>
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
                <p className="text-xs text-gray-500">
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
                  <Sparkles className="w-4 h-4 mr-2" />
                  สร้างด้วย AI
                  {user?.tier === 'starter' && (
                    <Badge variant="secondary" className="ml-2">Pro</Badge>
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  className="flex-1 bg-line hover:bg-line-dark"
                >
                  <Send className="w-4 h-4 mr-2" />
                  ส่งข้อความ
                </Button>
              </div>
            </CardContent>
          </Card>

          {showAIVariants && (
            <Card>
              <CardHeader>
                <CardTitle>ข้อความที่ AI สร้าง</CardTitle>
                <CardDescription>เลือกข้อความที่ต้องการใช้</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAIGeneratedMessages.map((variant) => (
                  <div
                    key={variant.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedVariant === variant.id
                        ? 'border-line bg-line/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-line/50'
                    }`}
                    onClick={() => handleSelectVariant(variant.content, variant.id)}
                  >
                    {selectedVariant === variant.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-line rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">ตัวเลือก {variant.variant}</Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {variant.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ผู้รับ</CardTitle>
              <CardDescription>จำนวนผู้ที่จะได้รับข้อความ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ผู้ติดตามทั้งหมด</span>
                  <span className="text-2xl font-bold text-line">12,547</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VIP</span>
                    <span className="font-medium">2,145 คน</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Regular</span>
                    <span className="font-medium">8,523 คน</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">New</span>
                    <span className="font-medium">1,879 คน</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การใช้งาน</CardTitle>
              <CardDescription>ข้อความคงเหลือในเดือนนี้</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user?.tier === 'starter' ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>350 / 500 ข้อความ</span>
                        <span className="font-medium">70%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-line h-2 rounded-full" style={{ width: '70%' }} />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      อัพเกรดเพื่อส่งไม่จำกัด
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-line">ไม่จำกัด</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ส่งข้อความได้ไม่จำกัด
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เคล็ดลับ</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-line flex-shrink-0" />
                  <span>ใช้คำกระตุ้นการตัดสินใจ (Call-to-Action)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-line flex-shrink-0" />
                  <span>เพิ่ม Emoji เพื่อดึงดูดความสนใจ</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-line flex-shrink-0" />
                  <span>ส่งเวลา 10:00-14:00 น. เพื่อ engagement สูงสุด</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-line flex-shrink-0" />
                  <span>ทดสอบด้วย A/B Testing ก่อนส่งจริง</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
