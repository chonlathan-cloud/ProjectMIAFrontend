import { useEffect, useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { getAiSettings, updateAiSettings } from '@/lib/api';

export function Settings() {
  const { user, store } = useStore();
  const navigate = useNavigate();
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    const load = async () => {
      setAiError(null);
      try {
        const res: any = await getAiSettings(store.id);
        const enabled = res?.aiEnable ?? res?.data?.aiEnable ?? true;
        setAiEnabled(!!enabled);
      } catch (err: any) {
        console.error("load ai settings failed:", err);
        setAiError(err?.message || "โหลดสถานะ AI ไม่สำเร็จ");
      }
    };
    load();
  }, [store?.id]);

  const handleToggleAi = async (next: boolean) => {
    if (!store?.id) return;
    setAiLoading(true);
    setAiError(null);
    setAiEnabled(next);
    try {
      await updateAiSettings(store.id, next);
    } catch (err: any) {
      console.error("update ai settings failed:", err);
      setAiError(err?.message || "บันทึกสถานะ AI ไม่สำเร็จ");
      setAiEnabled(!next);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ตั้งค่า</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          จัดการการเชื่อมต่อ LINE OA และข้อมูลบัญชี
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การเชื่อมต่อ LINE OA</CardTitle>
          <CardDescription>
            ตั้งค่า Channel Access Token และผูกร้านกับระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/settings/store')}
            className="w-full bg-emerald-600 text-white flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            ตั้งค่า LINE Token และผูกร้าน
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่า AI</CardTitle>
          <CardDescription>เปิด/ปิดการตอบกลับอัตโนมัติของ MIA ต่อร้าน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">AI Auto Reply</p>
              <p className="text-sm text-gray-500">ต้องให้ลูกค้ายอมรับ PDPA ก่อนจึงตอบได้</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={aiEnabled ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}>
                {aiEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Badge>
              <Switch
                checked={aiEnabled}
                onCheckedChange={handleToggleAi}
                disabled={!store?.id || aiLoading}
              />
            </div>
          </div>
          {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}
          {!store?.id ? (
            <p className="text-sm text-gray-500">กรุณาเลือกร้านก่อนตั้งค่า AI</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลบัญชี</CardTitle>
          <CardDescription>ข้อมูลส่วนตัวของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ชื่อ</p>
              <p className="font-medium">{user?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">อีเมล</p>
              <p className="font-medium">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">สถานะ</p>
              <Badge className="bg-green-600 text-white">ใช้งานอยู่</Badge>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline">แก้ไขข้อมูล</Button>
            <Button variant="outline">เปลี่ยนรหัสผ่าน</Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
