import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export function Customers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ลูกค้า</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">ข้อมูลลูกค้าจะดึงจาก Backend เท่านั้น (ลบข้อมูลเดโมแล้ว)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อลูกค้า</CardTitle>
          <CardDescription>กำลังรอเชื่อมต่อข้อมูลจริง</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-line/10 text-line flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-base text-gray-700 dark:text-gray-200 font-semibold">ยังไม่มีข้อมูลลูกค้า</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              เชื่อมต่อ Backend และ API รายชื่อลูกค้าจริง จากนั้นดึงข้อมูลมาแสดงที่หน้านี้
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">GET /api/customers (ตัวอย่าง)</Badge>
              <Badge variant="outline">รองรับการค้นหา/แบ่งกลุ่ม</Badge>
            </div>
            <Button variant="outline" onClick={() => window.open('https://developers.line.biz/', '_blank')}>
              เปิด Line Developers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
