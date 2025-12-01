import { useEffect, useState } from 'react';
import {
  Users,
  Send,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { mockAnalytics } from '@/lib/mockData';
import { getMe } from '@/lib/api';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, lineOA } = useStore();

  const [me, setMe] = useState<any | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState<boolean>(false);

  useEffect(() => {
    // ยังไม่มี user จาก Firebase → ยังไม่ต้องเรียก backend
    if (!user) {
      setMe(null);
      setMeError(null);
      setMeLoading(false);
      return;
    }

    setMeLoading(true);
    getMe()
      .then((data) => {
        setMe(data);
        setMeError(null);
      })
      .catch((err) => {
        console.error('getMe error:', err);
        setMeError(err.message || 'Failed to load backend auth status');
        setMe(null);
      })
      .finally(() => {
        setMeLoading(false);
      });
  }, [user]);

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

  // สถานะไฟจราจรของ backend
  let statusColor = 'bg-gray-400';
  let statusText = 'รอการเข้าสู่ระบบ...';
  let statusDetail: string | null = null;

  if (!user) {
    statusColor = 'bg-gray-400';
    statusText = 'รอการเข้าสู่ระบบ...';
  } else if (meLoading) {
    statusColor = 'bg-amber-400';
    statusText = 'กำลังเชื่อมต่อ Backend...';
  } else if (meError) {
    statusColor = 'bg-red-500';
    statusText = 'เชื่อมต่อ Backend ผิดพลาด';
    statusDetail = meError;
  } else if (me) {
    statusColor = 'bg-emerald-500';
    statusText = 'เชื่อมต่อ Backend แล้ว (Protected)';
  }

  const backendStatus = (
    <Card className="mb-4 border border-emerald-200/60 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/40">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
              System Status
            </CardTitle>
            <CardDescription className="text-xs">
              สถานะการเชื่อมต่อ Backend (Auth + API)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full shadow-sm ${statusColor}`}
            />
            <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-100">
              {statusText}
            </span>
          </div>
        </div>
      </CardHeader>
      {statusDetail && (
        <CardContent className="px-4 pb-3">
          <p className="text-[11px] text-red-500">
            {statusDetail}
          </p>
        </CardContent>
      )}
    </Card>
  );

  const renderContent = () => {
    if (!lineOA.connected) {
      return (
        <div className="space-y-5 lg:space-y-6">
          {backendStatus}

          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              ยินดีต้อนรับสู่ LineBoost SME
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
              เริ่มต้นใช้งานโดยเชื่อมต่อ Line Official Account
            </p>
          </div>

          <Card className="border-2 border-dashed">
            <CardHeader className="text-center p-6 lg:p-7">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-line/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-line" />
                </div>
              </div>
              <CardTitle className="text-2xl">เชื่อมต่อ Line Official Account</CardTitle>
              <CardDescription className="text-lg">
                เชื่อมต่อบัญชี Line OA ของคุณเพื่อเริ่มใช้งาน LineBoost SME
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6 px-6">
              <Button
                onClick={() => navigate('/line-setup')}
                size="lg"
                className="bg-gradient-to-r from-[#008080] to-[#00a0a0] hover:from-[#007070] hover:to-[#009090] text-base text-white border-none shadow-md shadow-teal-500/30"
              >
                เชื่อมต่อ Line OA
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-5 lg:space-y-6">
        {backendStatus}

        <Card className="border-0 bg-gradient-to-r from-white via-emerald-50 to-line/10 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-emerald-200/60 dark:ring-emerald-700/50 shadow-md shadow-emerald-500/20 bg-white">
                    <img
                      src="/image/logo_mia.jpg"
                      alt="LineBoost"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                      LineBoost Pulse
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      SME Growth Hub
                    </h2>
                  </div>
                </div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  LineBoost Pulse
                </p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ภาพรวมธุรกิจ</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  สรุปการเติบโตแบบเรียลไทม์ ดูยอดผู้ติดตาม อัตราตอบกลับ และผลลัพธ์ล่าสุดของแคมเปญ
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/broadcast')}
                    size="lg"
                    className="bg-gradient-to-r from-[#008080] to-[#00a0a0] hover:from-[#007070] hover:to-[#009090] text-base text-white shadow-lg shadow-teal-500/30 border-none"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    ส่งข้อความใหม่
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base border-emerald-200 dark:border-emerald-800"
                    onClick={() => navigate('/analytics')}
                  >
                    ดูรายงาน
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                <div className="rounded-2xl border border-white/60 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">ผู้ติดตาม</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mockAnalytics.totalFollowers.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+12.5%</p>
                </div>
                <div className="rounded-2xl border border-white/60 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">อัตราคลิก</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mockAnalytics.clickRate}%
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+3.1%</p>
                </div>
                <div className="rounded-2xl border border-white/60 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">รายได้จาก Line</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ฿{mockAnalytics.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+15.8%</p>
                </div>
                <div className="rounded-2xl border border-white/60 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">ตอบกลับ</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {lineOA.responseRate || '95'}%
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">เสถียร</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-5">
                <CardTitle className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="flex items-center mt-2 text-base">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-600 font-medium">{stat.change}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">จากเดือนที่แล้ว</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
            <CardHeader className="p-5">
              <CardTitle className="text-2xl">Line OA ที่เชื่อมต่อ</CardTitle>
              <CardDescription className="text-lg">ข้อมูลบัญชี Line Official Account</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ชื่อบัญชี</span>
                  <span className="font-semibold text-lg">{lineOA.name || 'ร้านค้าของฉัน'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ID</span>
                  <span className="font-semibold text-lg">{lineOA.id || '@myshop'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ผู้ติดตาม</span>
                  <span className="font-semibold text-lg">
                    {lineOA.followers?.toLocaleString() || '12,547'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">อัตราตอบกลับ</span>
                  <span className="font-semibold text-lg">
                    {lineOA.responseRate || '95'}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
            <CardHeader className="p-5">
              <CardTitle className="text-2xl">แพ็คเกจปัจจุบัน</CardTitle>
              <CardDescription className="text-lg">รายละเอียดแพ็คเกจของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">แพ็คเกจ</span>
                  <span className="font-bold text-line text-lg">
                    {user?.tier === 'starter' && 'Starter'}
                    {user?.tier === 'growth' && 'Growth'}
                    {user?.tier === 'enterprise' && 'Enterprise'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ข้อความคงเหลือ</span>
                  <span className="font-semibold text-lg">
                    {user?.tier === 'starter' ? '350/500' : 'ไม่จำกัด'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">AI Generation</span>
                  <span className="font-semibold text-lg">
                    {user?.tier === 'starter'
                      ? '5/10'
                      : user?.tier === 'growth'
                      ? '78/100'
                      : 'ไม่จำกัด'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-base"
                  onClick={() => navigate('/settings')}
                >
                  อัพเกรดแพ็คเกจ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-2xl">เริ่มต้นอย่างรวดเร็ว</CardTitle>
            <CardDescription className="text-lg">ฟีเจอร์หลักที่คุณควรลองใช้</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-center gap-3 text-lg"
                onClick={() => navigate('/broadcast')}
              >
                <Send className="w-7 h-7 text-line" />
                <span className="font-medium text-lg">ส่งข้อความ</span>
                <span className="text-sm text-gray-500">แบรอดแคสต์ถึงลูกค้า</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-center gap-3 text-lg"
                onClick={() => navigate('/analytics')}
              >
                <TrendingUp className="w-7 h-7 text-line" />
                <span className="font-medium text-lg">ดูรายงาน</span>
                <span className="text-sm text-gray-500">วิเคราะห์ข้อมูล</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-center gap-3 text-lg"
                onClick={() => navigate('/customers')}
              >
                <Users className="w-7 h-7 text-line" />
                <span className="font-medium text-lg">จัดการลูกค้า</span>
                <span className="text-sm text-gray-500">แบ่งกลุ่มลูกค้า</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
      <div className="relative">
        {renderContent()}
      </div>
    </div>
  );
}
