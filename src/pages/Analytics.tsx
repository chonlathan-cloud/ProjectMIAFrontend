import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, Link2, Globe, MessageSquare } from 'lucide-react';
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-line" />
              รายงาน LINE OA
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-line" />
              {statusLoading
                ? 'กำลังตรวจสอบการเชื่อมต่อ...'
                : lineStatus?.connected
                ? `เชื่อมต่อแล้วกับ ${lineStatus.displayName || 'LINE OA'}`
                : 'ยังไม่เชื่อมต่อ LINE OA'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>แสดงข้อมูลการสนทนา, ผู้ติดตาม และผลลัพธ์การส่งข้อความจาก LINE OA</p>
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="w-4 h-4" />
                <span>ยังไม่ได้เชื่อมต่อ API สถิติจาก LINE OA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-line" />
              รายงานพฤติกรรมเว็บไซต์
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-line" />
              สรุปยอดเข้าชมและการคลิกจากหน้าเว็บ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>รวมพฤติกรรมเว็บไซต์ไว้ในหน้าเดียวกับ LINE เพื่อให้ทีมดูภาพรวมได้เร็ว</p>
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="w-4 h-4" />
                <span>ยังไม่ได้เชื่อมต่อ API พฤติกรรมเว็บไซต์</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-line" />
            สถานะการเชื่อมต่อ Analytics
          </CardTitle>
          <CardDescription>
            เชื่อมต่อ Backend เพื่อให้ดึงข้อมูลจริงได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>ตั้งค่า <code className="px-1 bg-gray-100 rounded">VITE_API_BASE_URL</code> ให้ชี้ไปยังเซิร์ฟเวอร์จริง และให้ Backend คืน endpoint สถิติ</p>
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
