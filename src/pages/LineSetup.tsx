import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export function LineSetup() {
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const { setLineOA } = useStore();
  const navigate = useNavigate();

  const handleConnect = () => {
    setLineOA({
      connected: true,
      name: accountName || 'ร้านค้าของฉัน',
      id: accountId || '@myshop',
      followers: 12547,
      responseRate: 95,
    });

    toast.success('เชื่อมต่อ Line Official Account สำเร็จ!');
    navigate('/dashboard');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">เชื่อมต่อ Line Official Account</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">ทำตามขั้นตอนเพื่อเชื่อมต่อบัญชีของคุณ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((s) => (
          <Card
            key={s.number}
            className={`${
              step === s.number
                ? 'border-line border-2'
                : step > s.number
                ? 'border-green-500'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step > s.number
                    ? 'bg-green-500 text-white'
                    : step === s.number
                    ? 'bg-line text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {step > s.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{s.number}</span>
                )}
              </div>
              <CardTitle className="text-sm">{s.title}</CardTitle>
              <CardDescription className="text-xs">{s.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'ขั้นตอนที่ 1: เตรียมบัญชี Line OA'}
            {step === 2 && 'ขั้นตอนที่ 2: สแกน QR Code'}
            {step === 3 && 'ขั้นตอนที่ 3: กรอกข้อมูล'}
            {step === 4 && 'ขั้นตอนที่ 4: เสร็จสิ้น'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ข้อกำหนดเบื้องต้น
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>มี Line Official Account (ถ้ายังไม่มี สามารถสร้างได้ที่ Line Business ID)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>มีสิทธิ์ Admin ในบัญชี Line OA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>เปิดใช้งาน Messaging API (ตั้งค่าได้ที่ Line Official Account Manager)</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <Button onClick={() => setStep(2)} className="bg-line hover:bg-line-dark">
                  ถัดไป
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="w-32 h-32 text-gray-400" />
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400">
                  เปิดแอป Line แล้วสแกน QR Code นี้<br />
                  เพื่ออนุญาตให้ LineBoost SME เข้าถึงบัญชีของคุณ
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ย้อนกลับ
                </Button>
                <Button onClick={() => setStep(3)} className="bg-line hover:bg-line-dark">
                  สแกนแล้ว ถัดไป
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
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
                <Button onClick={() => setStep(4)} className="bg-line hover:bg-line-dark">
                  ถัดไป
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  พร้อมใช้งาน!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  คุณได้เชื่อมต่อ Line Official Account เรียบร้อยแล้ว<br />
                  เริ่มต้นใช้งาน LineBoost SME เพื่อเพิ่มยอดขายของคุณ
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ชื่อบัญชี:</span>
                  <span className="font-medium">{accountName || 'ร้านค้าของฉัน'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">LINE ID:</span>
                  <span className="font-medium">{accountId || '@myshop'}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleConnect} className="bg-line hover:bg-line-dark">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  เริ่มใช้งาน LineBoost SME
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
