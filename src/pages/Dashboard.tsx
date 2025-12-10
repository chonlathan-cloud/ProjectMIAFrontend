import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Users,
  MessageSquare,
  RefreshCw,
  Megaphone,
  Sparkles,
  Link2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  getMe,
  getLineStatus,
  type LineStatusResponse,
  getRecentMessages,
  type RecentMessage,
} from '@/lib/api';
import { FirestoreDebug } from '@/components/FirestoreDebug';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, lineOA } = useStore();

  const [me, setMe] = useState<any | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState<boolean>(false);

  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [lineStatusLoading, setLineStatusLoading] = useState<boolean>(false);

  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [recentMessagesLoading, setRecentMessagesLoading] = useState(false);
  const [recentMessagesError, setRecentMessagesError] = useState<string | null>(null);
  const [recentMessagesUpdatedAt, setRecentMessagesUpdatedAt] = useState<Date | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiImageUrl, setAiImageUrl] = useState('');

  const handleUseAiPrompt = () => {
    const payload = `สินค้า/โปรโมชัน: ${aiTopic || '-'}${aiImageUrl ? `\nลิงก์รูป: ${aiImageUrl}` : ''}`;
    navigator?.clipboard?.writeText(payload).catch(() => {});
    setAiDialogOpen(false);
  };

  const loadRecentMessages = async () => {
    try {
      setRecentMessagesLoading(true);
      setRecentMessagesError(null);
      const res = await getRecentMessages();
      setRecentMessages(res.data.items || []);
      setRecentMessagesUpdatedAt(new Date());
    } catch (err: any) {
      console.error('getRecentMessages error:', err);
      setRecentMessagesError(err.message || 'Failed to load recent messages');
      setRecentMessages([]);
    } finally {
      setRecentMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setMe(null);
      setMeError(null);
      setMeLoading(false);

      setLineStatus(null);
      setLineStatusLoading(false);

      setRecentMessages([]);
      setRecentMessagesError(null);
      setRecentMessagesLoading(false);
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

    setLineStatusLoading(true);
    getLineStatus()
      .then((res) => {
        setLineStatus(res.data);
      })
      .catch((err) => {
        console.error('getLineStatus error:', err);
        setLineStatus(null);
      })
      .finally(() => {
        setLineStatusLoading(false);
      });

    loadRecentMessages();
  }, [user]);

  const metricsLoading = useMemo(
    () => meLoading || lineStatusLoading || recentMessagesLoading,
    [lineStatusLoading, meLoading, recentMessagesLoading],
  );

  type StatIcon = ComponentType<{ className?: string }>;
  type StatItem = {
    title: string;
    value: string;
    icon: StatIcon;
    color: string;
    bgColor: string;
    change: string;
  };

  const stats: StatItem[] = [
    {
      title: 'สถานะ LINE OA',
      value: lineStatusLoading
        ? 'กำลังโหลด...'
        : lineStatus?.connected
        ? 'เชื่อมต่อแล้ว'
        : 'ยังไม่เชื่อมต่อ',
      icon: Link2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      change: lineStatus?.displayName || '',
    },
    {
      title: 'ข้อความล่าสุด',
      value: recentMessagesLoading
        ? 'กำลังโหลด...'
        : recentMessages.length
        ? `${recentMessages.length} รายการ`
        : 'ยังไม่มีข้อมูล',
      icon: MessageSquare,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      change: recentMessagesUpdatedAt
        ? `อัพเดต ${recentMessagesUpdatedAt.toLocaleTimeString('th-TH')}`
        : '',
    },
    {
      title: 'บัญชีผู้ใช้',
      value: user?.email || user?.name || 'ยังไม่เข้าสู่ระบบ',
      icon: Users,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      change: user ? 'เข้าสู่ระบบแล้ว' : '',
    },
    {
      title: 'Backend API',
      value: meLoading
        ? 'กำลังตรวจสอบ'
        : me
        ? 'พร้อมใช้งาน'
        : meError
        ? 'เชื่อมต่อไม่ได้'
        : 'ยังไม่โหลด',
      icon: RefreshCw,
      color: meError ? 'text-red-600' : 'text-emerald-700',
      bgColor: meError ? 'bg-red-50' : 'bg-emerald-50',
      change: meError || '',
    },
  ];

  const aiCaptionSuggestions = useMemo(
    () => [
      'Flash sale 19.00 น. วันนี้เท่านั้น! กดรับโค้ดลดเพิ่ม 15%',
      'ลูกค้าชอบชุดนี้สุด! แถมส่งฟรีเมื่อซื้อ 2 ชิ้น กดรับเลย',
      'ดึกแล้วหิวไหม? สั่งตอนนี้ ส่งด่วนใน 30 นาที พร้อมโปร 1 แถม 1',
    ],
    [],
  );
  const primaryAiHint = aiCaptionSuggestions[0];

  let statusColor = 'bg-gray-300';
  let statusText = 'รอการเข้าสู่ระบบ...';
  let statusDetail: string | null = null;

  if (!user) {
    statusColor = 'bg-gray-300';
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
    statusText = 'เชื่อมต่อ Backend แล้ว';
  }

  const backendStatus = (
    <div className="flex items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
        <span className={`inline-flex h-2.5 w-2.5 rounded-full shadow-sm ${statusColor}`} />
        {statusText}
      </span>
      {statusDetail && (
        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
          {statusDetail}
        </span>
      )}
    </div>
  );

  const renderRecentMessages = () => {
    if (recentMessagesLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3 pb-2">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (recentMessagesError) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-600 font-medium">{recentMessagesError}</p>
          <Button size="sm" variant="outline" onClick={loadRecentMessages}>
            ลองอีกครั้ง
          </Button>
        </div>
      );
    }

    if (!recentMessages.length) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">
            ยังไม่มีข้อความจากลูกค้าในช่วงนี้
          </p>
          <p className="text-sm text-gray-500">
            ระบบจะดึงข้อความใหม่ให้เมื่อมีการสนทนาเข้ามา
          </p>
          <Button size="sm" variant="outline" onClick={loadRecentMessages}>
            รีเฟรชตอนนี้
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {recentMessages.slice(0, 5).map((msg) => (
          <div
            key={msg.id}
            className="flex items-start justify-between gap-3 border-b last:border-b-0 border-gray-100 pb-2"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                  {msg.isFromUser ? 'ลูกค้า' : 'บอท'}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleString('th-TH')}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-800 break-words">
                {msg.text || '(ไม่มีข้อความ)'}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    const isLineConnected = lineStatus?.connected ?? lineOA.connected;

    if (!isLineConnected) {
      return (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(15,23,42,0.06)] bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-medium">
                    LineBoost · ขั้นตอนแรก
                  </span>
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">เชื่อมต่อ Line Official Account</h1>
                  <p className="text-base text-gray-600 max-w-2xl">
                    ผูกบัญชี Line OA ของคุณเพื่อเริ่มส่งข้อความ วิเคราะห์ผล และดูแชทของลูกค้า
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/line-setup')}>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      เชื่อมต่อ Line OA
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => navigate('/analytics')}>
                      ดูรายงานตัวอย่าง
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-[320px] rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm text-gray-500 mb-2">สถานะระบบ</p>
                  {backendStatus}
                  <p className="text-sm text-gray-500 mt-4">
                    ระบบจะเริ่มติดตามข้อความและสถิติทันทีหลังเชื่อมต่อ Line OA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border border-gray-100 bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-emerald-200 bg-white shadow-sm">
                    <img src="/image/logo_mia.jpg" alt="LineBoost" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">LineBoost</p>
                    <h2 className="text-2xl font-semibold text-gray-900">แผงควบคุมร้าน {lineOA.name || 'Line OA'}</h2>
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight">
                  AI แนะนำสิ่งแรกที่ควรทำวันนี้
                </h1>
                <p className="text-base text-gray-600 max-w-3xl">
                  โฟกัสงานที่สำคัญที่สุดก่อน ระบบสรุปข้อมูลและแนะนำขั้นตอนถัดไปให้คุณ พร้อมทางลัดไปยัง Broadcast, Inbox, Analytics
                </p>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-emerald-700 text-xs font-semibold border border-emerald-100">
                      คำแนะนำจาก AI
                    </span>
                    <span className="text-xs text-gray-500">อัพเดตล่าสุด {recentMessagesUpdatedAt ? recentMessagesUpdatedAt.toLocaleTimeString('th-TH') : 'ขณะนี้'}</span>
                  </div>
                  <p className="text-base text-gray-800">
                    {primaryAiHint}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/broadcast')}>
                      ทำทันที (Broadcast)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAiDialogOpen(true)}>
                      ปรับข้อความด้วย AI
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {backendStatus}
                  <span className="text-sm text-gray-500">
                    อัพเดตล่าสุด {recentMessagesUpdatedAt ? recentMessagesUpdatedAt.toLocaleTimeString('th-TH') : 'ขณะนี้'}
                  </span>
                </div>
              </div>
              <div className="w-full lg:w-[380px] grid grid-cols-2 gap-3">
                {metricsLoading
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  : stats.map((stat) => (
                      <div
                        key={stat.title}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{stat.title}</p>
                          <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                        <p className="text-xs text-emerald-600 mt-1">{stat.change} เทียบ 30 วันก่อน</p>
                      </div>
                    ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="rounded-3xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <CardHeader className="p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Line OA ที่เชื่อมต่อ</CardTitle>
                <CardDescription className="text-sm">ข้อมูลบัญชีหลักของคุณ</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/line-setup')} className="text-xs">
                แก้ไข
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ชื่อบัญชี</span>
                  <span className="font-semibold text-gray-900">{lineOA.name || 'ร้านค้าของฉัน'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Line ID</span>
                  <span className="font-semibold text-gray-900">{lineOA.id || '@myshop'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ผู้ติดตาม</span>
                  <span className="font-semibold text-gray-900">{lineOA.followers?.toLocaleString() || '12,547'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">อัตราตอบกลับ</span>
                  <span className="font-semibold text-gray-900">{lineOA.responseRate || '95'}%</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/analytics')}
                >
                  รายงาน
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/broadcast')}
                >
                  Broadcast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/inbox')}
                >
                  ข้อความเข้า
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] lg:col-span-2">
            <CardHeader className="p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">ข้อความล่าสุดจากลูกค้า</CardTitle>
                <CardDescription className="text-sm">รายการ 5 ข้อความล่าสุดจาก LINE</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadRecentMessages} disabled={recentMessagesLoading} className="text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                {recentMessagesLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3">
                <span>ช่วงเวลา: ล่าสุด 5 รายการ</span>
                <span>
                  อัพเดตล่าสุด: {recentMessagesUpdatedAt ? recentMessagesUpdatedAt.toLocaleTimeString('th-TH') : 'ยังไม่ดึงข้อมูล'}
                </span>
              </div>
              {renderRecentMessages()}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="rounded-3xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <CardHeader className="p-5">
              <CardTitle className="text-xl">ทางลัดสำหรับ SME</CardTitle>
              <CardDescription className="text-sm">ทำงานเร็วใน 3 คลิก</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                <Button variant="outline" size="lg" className="w-full justify-start gap-3" onClick={() => navigate('/broadcast')}>
                  <Megaphone className="w-5 h-5 text-emerald-600" />
                  ส่งบรอดแคสต์ด่วน
                </Button>
                <Button variant="outline" size="lg" className="w-full justify-start gap-3" onClick={() => navigate('/inbox')}>
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  เปิดกล่องข้อความ
                </Button>
                <Button variant="outline" size="lg" className="w-full justify-start gap-3" onClick={() => setAiDialogOpen(true)}>
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  ให้ AI ช่วยคิดแคปชั่น
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="relative space-y-6">
      <FirestoreDebug />
      {renderContent()}

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ให้ AI ช่วยคิดแคปชั่น</DialogTitle>
            <DialogDescription>
              บอกสั้นๆ ว่าวันนี้ขายอะไร แนบลิงก์รูป (Google Drive/URL) เพื่อให้ AI สร้างภาพโปรโมชันได้ตรงสินค้า
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="เช่น เสื้อครอป ออกใหม่"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <span>แนบลิงก์รูปสินค้า (รองรับ Google Drive)</span>
              </div>
              <Input
                placeholder="https://drive.google.com/your-product-image"
                value={aiImageUrl}
                onChange={(e) => setAiImageUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                แชร์ภาพสินค้า/โปสเตอร์จาก Google Drive หรือ URL สาธารณะ เพื่อให้ AI สร้างภาพโฆษณาและโปรโมชันได้ตรงสินค้ามากขึ้น
              </p>
            </div>
            <div className="space-y-2">
              {aiCaptionSuggestions.map((cap) => (
                <Button
                  key={cap}
                  variant="outline"
                  className="w-full justify-start text-left text-sm"
                  onClick={() => {
                    setAiTopic(cap);
                    navigator?.clipboard?.writeText(cap).catch(() => {});
                    setAiDialogOpen(false);
                  }}
                >
                  {cap}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Button variant="ghost" onClick={() => setAiDialogOpen(false)} className="order-2 sm:order-1">
              ปิด
            </Button>
            <Button onClick={handleUseAiPrompt} className="order-1 sm:order-2">
              คัดลอกข้อความที่เตรียมไว้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
