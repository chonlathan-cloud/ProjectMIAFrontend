import { useState } from 'react';
import { TestTube2, Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export function ABTest() {
  const [testName, setTestName] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const { user } = useStore();

  const handleCreateTest = () => {
    if (user?.tier === 'starter') {
      toast.warning('ฟีเจอร์นี้สำหรับแพ็คเกจ Growth ขึ้นไป');
      return;
    }

    if (!testName || !variantA || !variantB) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    toast.success('สร้าง A/B Test สำเร็จ!');
    setTestName('');
    setVariantA('');
    setVariantB('');
  };

  const mockTests = [
    {
      id: '1',
      name: 'โปรโมชั่นส่วนลด - CTA',
      status: 'running',
      variantA: { name: 'A: "ซื้อเลย!"', sent: 3500, clicked: 892, rate: 25.5 },
      variantB: { name: 'B: "คลิกที่นี่"', sent: 3500, clicked: 735, rate: 21.0 },
      winner: 'A',
    },
    {
      id: '2',
      name: 'ข้อความต้อนรับ',
      status: 'completed',
      variantA: { name: 'A: แบบสั้น', sent: 5000, clicked: 1850, rate: 37.0 },
      variantB: { name: 'B: แบบยาว', sent: 5000, clicked: 1650, rate: 33.0 },
      winner: 'A',
    },
    {
      id: '3',
      name: 'คูปองพิเศษ - วันเกิด',
      status: 'draft',
      variantA: { name: 'A: มีภาพ', sent: 0, clicked: 0, rate: 0 },
      variantB: { name: 'B: ไม่มีภาพ', sent: 0, clicked: 0, rate: 0 },
      winner: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'กำลังทดสอบ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'draft':
        return 'แบบร่าง';
      default:
        return status;
    }
  };

  if (user?.tier === 'starter') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">A/B Testing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">ทดสอบและเปรียบเทียบข้อความเพื่อผลลัพธ์ที่ดีที่สุด</p>
        </div>

        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-line/10 rounded-full flex items-center justify-center">
                <TestTube2 className="w-10 h-10 text-line" />
              </div>
            </div>
            <CardTitle>อัพเกรดเพื่อใช้ A/B Testing</CardTitle>
            <CardDescription className="text-base">
              ฟีเจอร์นี้สำหรับแพ็คเกจ Growth และ Enterprise เท่านั้น<br />
              ทดสอบข้อความหลายรูปแบบเพื่อหาสูตรที่ให้ผลลัพธ์ดีที่สุด
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button className="bg-line hover:bg-line-dark">
              อัพเกรดแพ็คเกจ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">A/B Testing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">ทดสอบและเปรียบเทียบข้อความเพื่อผลลัพธ์ที่ดีที่สุด</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สร้าง A/B Test ใหม่</CardTitle>
          <CardDescription>สร้างการทดสอบเพื่อเปรียบเทียบข้อความ 2 แบบ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testName">ชื่อการทดสอบ</Label>
            <Input
              id="testName"
              placeholder="เช่น โปรโมชั่นส่วนลด - CTA"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variantA">ตัวเลือก A</Label>
              <Textarea
                id="variantA"
                placeholder="กรอกข้อความตัวเลือก A..."
                value={variantA}
                onChange={(e) => setVariantA(e.target.value)}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantB">ตัวเลือก B</Label>
              <Textarea
                id="variantB"
                placeholder="กรอกข้อความตัวเลือก B..."
                value={variantB}
                onChange={(e) => setVariantB(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateTest} className="bg-line hover:bg-line-dark">
              <Plus className="w-4 h-4 mr-2" />
              สร้าง A/B Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การทดสอบทั้งหมด</CardTitle>
          <CardDescription>ดูและจัดการ A/B Tests ของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockTests.map((test) => (
            <Card key={test.id} className="border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription className="mt-1">
                      ID: {test.id}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(test.status)}>
                    {getStatusText(test.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{test.variantA.name}</h4>
                      {test.winner === 'A' && test.status === 'completed' && (
                        <Badge className="bg-green-600 text-white">ชนะ</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ส่งแล้ว:</span>
                        <span className="font-medium">{test.variantA.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">คลิก:</span>
                        <span className="font-medium">{test.variantA.clicked.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">อัตราคลิก:</span>
                        <span className="font-bold text-line">{test.variantA.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{test.variantB.name}</h4>
                      {test.winner === 'B' && test.status === 'completed' && (
                        <Badge className="bg-green-600 text-white">ชนะ</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">ส่งแล้ว:</span>
                        <span className="font-medium">{test.variantB.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">คลิก:</span>
                        <span className="font-medium">{test.variantB.clicked.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">อัตราคลิก:</span>
                        <span className="font-bold text-line">{test.variantB.rate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {test.status === 'draft' && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-line hover:bg-line-dark">
                      เริ่มทดสอบ
                    </Button>
                    <Button size="sm" variant="outline">
                      แก้ไข
                    </Button>
                  </div>
                )}

                {test.status === 'running' && (
                  <div className="mt-4">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      ดูผลลัพธ์แบบเรียลไทม์
                    </Button>
                  </div>
                )}

                {test.status === 'completed' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      ✓ ตัวเลือก {test.winner} ชนะด้วยอัตราคลิกสูงกว่า{' '}
                      {test.winner === 'A'
                        ? (test.variantA.rate - test.variantB.rate).toFixed(1)
                        : (test.variantB.rate - test.variantA.rate).toFixed(1)}
                      %
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
