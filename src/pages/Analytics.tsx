import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, Link2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLineStatus, type LineStatusResponse } from '@/lib/api';

export function Analytics() {
  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusLoading(true);
        const res = await getLineStatus();
        setLineStatus(res.data);
      } catch (err) {
        console.error('load line status error', err);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">รายงานสถิติ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">หน้ารายงานจะดึงข้อมูลจริงจาก Backend / LINE OA เท่านั้น</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-line" />
            ข้อมูล Analytics ยังไม่เชื่อมต่อ
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-line" />
            {statusLoading
              ? 'กำลังตรวจสอบการเชื่อมต่อ...'
              : lineStatus?.connected
              ? `เชื่อมต่อแล้วกับ ${lineStatus.displayName || 'LINE OA'} (ยังไม่ดึงสถิติ)`
              : 'ยังไม่เชื่อมต่อ LINE OA หรือ Backend'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>เชื่อมต่อ Backend ก่อน: ตั้งค่า <code className="px-1 bg-gray-100 rounded">VITE_API_BASE_URL</code> ให้ชี้ไปยังเซิร์ฟเวอร์จริง และให้ Backend คืน endpoint สถิติ</p>
            <p>เมื่อมีข้อมูลจริงแล้ว สามารถใส่ series ลงใน component นี้ (Recharts หรือ lib ที่ต้องการ) โดยอ่านจาก API</p>
            <div className="flex items-center gap-2 text-gray-600">
              <RefreshCw className="w-4 h-4" />
              <span>ปัจจุบันไม่มีการเรียก API ใดๆ ในหน้า Analytics เพื่อหลีกเลี่ยงข้อมูลเดโม</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
