import { Users, Send, MousePointerClick, DollarSign, TrendingUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { mockAnalytics } from '@/lib/mockData';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, lineOA } = useStore();

  const stats = [
    {
      title: 'ผู้ติดตามทั้งหมด',
      value: mockAnalytics.totalFollowers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      change: '+12.5%',
    },
    {
      title: 'ข้อความที่ส่ง',
      value: mockAnalytics.messagesSent.toLocaleString(),
      icon: Send,
      color: 'text-line',
      bgColor: 'bg-green-50 dark:bg-green-950',
      change: '+8.2%',
    },
    {
      title: 'อัตราการคลิก',
      value: `${mockAnalytics.clickRate}%`,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      change: '+3.1%',
    },
    {
      title: 'รายได้จาก Line',
      value: `฿${mockAnalytics.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      change: '+15.8%',
    },
  ];

  if (!lineOA.connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ยินดีต้อนรับสู่ LineBoost SME</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">เริ่มต้นใช้งานโดยเชื่อมต่อ Line Official Account</p>
        </div>

        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-line/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-line" />
              </div>
            </div>
            <CardTitle>เชื่อมต่อ Line Official Account</CardTitle>
            <CardDescription className="text-base">
              เชื่อมต่อบัญชี Line OA ของคุณเพื่อเริ่มใช้งาน LineBoost SME
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              onClick={() => navigate('/line-setup')}
              size="lg"
              className="bg-line hover:bg-line-dark"
            >
              เชื่อมต่อ Line OA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ภาพรวม</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">ติดตามผลการดำเนินงานของคุณ</p>
        </div>
        <Button onClick={() => navigate('/broadcast')} className="bg-line hover:bg-line-dark">
          <Send className="w-4 h-4 mr-2" />
          ส่งข้อความใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">จากเดือนที่แล้ว</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Line OA ที่เชื่อมต่อ</CardTitle>
            <CardDescription>ข้อมูลบัญชี Line Official Account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ชื่อบัญชี</span>
                <span className="font-medium">{lineOA.name || 'ร้านค้าของฉัน'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ID</span>
                <span className="font-medium">{lineOA.id || '@myshop'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ผู้ติดตาม</span>
                <span className="font-medium">{lineOA.followers?.toLocaleString() || '12,547'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">อัตราตอบกลับ</span>
                <span className="font-medium">{lineOA.responseRate || '95'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>แพ็คเกจปัจจุบัน</CardTitle>
            <CardDescription>รายละเอียดแพ็คเกจของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">แพ็คเกจ</span>
                <span className="font-bold text-line">
                  {user?.tier === 'starter' && 'Starter'}
                  {user?.tier === 'growth' && 'Growth'}
                  {user?.tier === 'enterprise' && 'Enterprise'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ข้อความคงเหลือ</span>
                <span className="font-medium">
                  {user?.tier === 'starter' ? '350/500' : 'ไม่จำกัด'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">AI Generation</span>
                <span className="font-medium">
                  {user?.tier === 'starter' ? '5/10' : user?.tier === 'growth' ? '78/100' : 'ไม่จำกัด'}
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/settings')}
              >
                อัพเกรดแพ็คเกจ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>เริ่มต้นอย่างรวดเร็ว</CardTitle>
          <CardDescription>ฟีเจอร์หลักที่คุณควรลองใช้</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/broadcast')}
            >
              <Send className="w-6 h-6 text-line" />
              <span className="font-medium">ส่งข้อความ</span>
              <span className="text-xs text-gray-500">แบรอดแคสต์ถึงลูกค้า</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="w-6 h-6 text-line" />
              <span className="font-medium">ดูรายงาน</span>
              <span className="text-xs text-gray-500">วิเคราะห์ข้อมูล</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate('/customers')}
            >
              <Users className="w-6 h-6 text-line" />
              <span className="font-medium">จัดการลูกค้า</span>
              <span className="text-xs text-gray-500">แบ่งกลุ่มลูกค้า</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
