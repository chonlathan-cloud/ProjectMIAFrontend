import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Send,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Bell,
  Sparkles,
  Megaphone,
  FileCheck,
  ArrowUpRight,
  Lightbulb,
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
import { mockAnalytics } from '@/lib/mockData';
import { flexTemplates } from '@/lib/flexTemplates';
import {
  getMe,
  getLineStatus,
  type LineStatusResponse,
  getRecentMessages,
  type RecentMessage,
} from '@/lib/api';
import { FirestoreDebug } from '@/components/FirestoreDebug';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, lineOA } = useStore();

  const [me, setMe] = useState<any | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState<boolean>(false);

  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [lineStatusError, setLineStatusError] = useState<string | null>(null);
  const [lineStatusLoading, setLineStatusLoading] = useState<boolean>(false);

  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [recentMessagesLoading, setRecentMessagesLoading] = useState(false);
  const [recentMessagesError, setRecentMessagesError] = useState<string | null>(null);
  const [recentMessagesUpdatedAt, setRecentMessagesUpdatedAt] = useState<Date | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiImageUrl, setAiImageUrl] = useState('');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const handleUseAiPrompt = () => {
    const payload = `สินค้า/โปรโมชัน: ${aiTopic || '-'}${aiImageUrl ? `\nลิงก์รูป: ${aiImageUrl}` : ''}`;
    navigator?.clipboard?.writeText(payload).catch(() => {});
    setAiDialogOpen(false);
  };

  const handleCopyFlexTemplate = (templateId: string) => {
    const template = flexTemplates.find((tpl) => tpl.id === templateId);
    if (!template) return;
    navigator?.clipboard
      ?.writeText(JSON.stringify({ type: 'flex', altText: template.altText, contents: template.contents }, null, 2))
      .then(() => setCopiedTemplateId(templateId))
      .catch(() => setCopiedTemplateId(templateId));
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  // helper: โหลด recent messages (ใช้ทั้งตอน mount + ปุ่มรีเฟรช)
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

  // โหลด status + recent messages เมื่อมี user
  useEffect(() => {
    if (!user) {
      setMe(null);
      setMeError(null);
      setMeLoading(false);

      setLineStatus(null);
      setLineStatusError(null);
      setLineStatusLoading(false);

      setRecentMessages([]);
      setRecentMessagesError(null);
      setRecentMessagesLoading(false);
      return;
    }

    // backend auth
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

    // line status
    setLineStatusLoading(true);
    getLineStatus()
      .then((res) => {
        setLineStatus(res.data);
        setLineStatusError(null);
      })
      .catch((err) => {
        console.error('getLineStatus error:', err);
        setLineStatusError(err.message || 'Failed to load LINE status');
        setLineStatus(null);
      })
      .finally(() => {
        setLineStatusLoading(false);
      });

    // recent messages
    loadRecentMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const metricsLoading = useMemo(
    () => meLoading || lineStatusLoading || (!user && !lineOA.connected),
    [lineStatusLoading, meLoading, user, lineOA.connected],
  );

  const todaySales = useMemo(() => Math.round(mockAnalytics.revenue / 30), []);
  const pendingChats = useMemo(
    () => Math.max(recentMessages.filter((msg) => msg.isFromUser).length, 7),
    [recentMessages],
  );
  const funnelData = useMemo(
    () => ({
      sent: mockAnalytics.messagesSent || 1200,
      opened: Math.round((mockAnalytics.messagesSent || 1200) * 0.7),
      clicked: Math.round((mockAnalytics.messagesSent || 1200) * 0.32),
      purchased: Math.round((mockAnalytics.messagesSent || 1200) * 0.08),
    }),
    [],
  );

  const aiCaptionSuggestions = useMemo(
    () => [
      'Flash sale 19.00 น. วันนี้เท่านั้น! กดรับโค้ดลดเพิ่ม 15%',
      'ลูกค้าชอบชุดนี้สุด! แถมส่งฟรีเมื่อซื้อ 2 ชิ้น กดรับเลย',
      'ดึกแล้วหิวไหม? สั่งตอนนี้ ส่งด่วนใน 30 นาที พร้อมโปร 1 แถม 1',
    ],
    [],
  );

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
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="gap-2 border-emerald-200 dark:border-emerald-800 text-[11px] bg-emerald-50/70 dark:bg-emerald-950/40"
      >
        <span className={`inline-flex h-2.5 w-2.5 rounded-full shadow-sm ${statusColor}`} />
        {statusText}
      </Badge>
      {statusDetail && (
        <span className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md border border-red-200/60 dark:border-red-800/60">
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
        <div className="flex items-center justify-between rounded-lg border border-red-200/60 dark:border-red-800/60 bg-red-50/60 dark:bg-red-950/30 px-3 py-2">
          <p className="text-sm text-red-600">{recentMessagesError}</p>
          <Button size="sm" variant="outline" onClick={loadRecentMessages}>
            ลองอีกครั้ง
          </Button>
        </div>
      );
    }

    if (!recentMessages.length) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 p-4 text-center space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            ยังไม่มีข้อความจากลูกค้าในช่วงนี้
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
            className="flex items-start justify-between gap-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800 pb-2"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100">
                  {msg.isFromUser ? 'ลูกค้า' : 'บอท'}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleString('th-TH')}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-800 dark:text-gray-100 break-words">
                {msg.text || '(ไม่มีข้อความ)'}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    // พิจารณาจาก backend เป็นหลัก ถ้าไม่มีให้ fallback มาใช้ store เดิม
    const isLineConnected = lineStatus?.connected ?? lineOA.connected;

    if (!isLineConnected) {
      return (
        <div className="space-y-5 lg:space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              ยินดีต้อนรับสู่ LineBoost SME
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
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
              <CardTitle className="text-xl md:text-2xl">เชื่อมต่อ Line Official Account</CardTitle>
              <CardDescription className="text-sm md:text-base">
                เชื่อมต่อบัญชี Line OA ของคุณเพื่อเริ่มใช้งาน LineBoost SME
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6 px-6">
              <Button
                onClick={() => navigate('/line-setup')}
                size="lg"
                className="bg-gradient-to-r from-[#008080] to-[#00a0a0] hover:from-[#007070] hover:to-[#009090] text-sm md:text-base text-white border-none shadow-md shadow-teal-500/30"
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
        {/* Hero + KPI */}
        <Card className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                        SME Growth Hub
                      </h2>
                    </div>
                  </div>
                  <div className="hidden md:block">{backendStatus}</div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  ภาพรวมธุรกิจ
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl">
                  ภาพรวมแบบเรียลไทม์ของผู้ติดตาม การมีส่วนร่วม และรายได้จาก LINE พร้อมเส้นทางลัดเริ่มต้น
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/broadcast')}
                    size="lg"
                    className="bg-gradient-to-r from-[#008080] to-[#00a0a0] hover:from-[#007070] hover:to-[#009090] text-sm md:text-base text-white shadow-lg shadow-teal-500/30 border-none"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    ส่งข้อความใหม่
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm md:text-base border-emerald-200 dark:border-emerald-800"
                    onClick={() => navigate('/analytics')}
                  >
                    ดูรายงาน
                  </Button>
                </div>
              </div>
              <div className="w-full lg:w-auto space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    KPI ล่าสุด (30 วัน)
                  </p>
                  <div className="md:hidden">{backendStatus}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                  {metricsLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4 shadow-sm space-y-2"
                      >
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">ผู้ติดตาม</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          {mockAnalytics.totalFollowers.toLocaleString()}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+12.5% MoM</p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">อัตราคลิก</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          {mockAnalytics.clickRate}%
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+3.1% WoW</p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">รายได้จาก Line</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          ฿{mockAnalytics.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">+15.8% MoM</p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/70 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">ตอบกลับ</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          {lineOA.responseRate || '95'}%
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">เสถียร</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
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
                {metricsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="flex items-center mt-2 text-sm md:text-base">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-600 font-medium">{stat.change}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">เทียบ 30 วันก่อน</span>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

        {/* Dream mobile sections reused on desktop (no mobile nav) */}
        <div className="hidden lg:block">
          {renderDreamSections({ showHeader: false })}
        </div>

        {/* ข้อมูล OA + ข้อความล่าสุด */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
            <CardHeader className="p-5 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl">Line OA ที่เชื่อมต่อ</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  ข้อมูลบัญชี Line Official Account
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/line-setup')}
                className="text-xs"
              >
                แก้ไขโปรไฟล์ OA
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ชื่อบัญชี</span>
                  <span className="font-semibold text-base md:text-lg">{lineOA.name || 'ร้านค้าของฉัน'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ID</span>
                  <span className="font-semibold text-base md:text-lg">{lineOA.id || '@myshop'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">ผู้ติดตาม</span>
                  <span className="font-semibold text-base md:text-lg">
                    {lineOA.followers?.toLocaleString() || '12,547'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-600 dark:text-gray-400">อัตราตอบกลับ</span>
                  <span className="font-semibold text-base md:text-lg">
                    {lineOA.responseRate || '95'}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
            <CardHeader className="p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl">ข้อความล่าสุดจาก LINE</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  ดู history ล่าสุดที่ลูกค้าทักเข้ามาและบอทตอบกลับ
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecentMessages}
                disabled={recentMessagesLoading}
                className="text-xs gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {recentMessagesLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                <span>ช่วงเวลา: ล่าสุด 5 รายการ</span>
                <span>
                  อัพเดตล่าสุด:{' '}
                  {recentMessagesUpdatedAt
                    ? recentMessagesUpdatedAt.toLocaleTimeString('th-TH')
                    : 'ยังไม่ดึงข้อมูล'}
                </span>
              </div>
              {renderRecentMessages()}
            </CardContent>
          </Card>
        </div>

        {/* Quick start */}
        <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-xl md:text-2xl">เริ่มต้นอย่างรวดเร็ว</CardTitle>
            <CardDescription className="text-sm md:text-base">ฟีเจอร์หลักที่คุณควรลองใช้</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-start gap-3 text-left text-sm md:text-base"
                onClick={() => navigate('/broadcast')}
              >
                <Send className="w-7 h-7 text-line" />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm md:text-base">ส่งข้อความ</span>
                  <span className="text-sm text-gray-500">แบรอดแคสต์ถึงลูกค้า</span>
                </div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-start gap-3 text-left text-sm md:text-base"
                onClick={() => navigate('/analytics')}
              >
                <TrendingUp className="w-7 h-7 text-line" />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm md:text-base">ดูรายงาน</span>
                  <span className="text-sm text-gray-500">วิเคราะห์ข้อมูล</span>
                </div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-5 px-6 flex flex-col items-start gap-3 text-left text-sm md:text-base"
                onClick={() => navigate('/customers')}
              >
                <Users className="w-7 h-7 text-line" />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm md:text-base">จัดการลูกค้า</span>
                  <span className="text-sm text-gray-500">แบ่งกลุ่มลูกค้า</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flex templates */}
        <Card className="border border-white/70 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 shadow-sm">
          <CardHeader className="p-5 flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">Flex Message Templates</CardTitle>
              <CardDescription className="text-sm md:text-base">
                เทมเพลตมาตรฐาน 3 แบบ สำหรับส่งให้ลูกค้าทาง LINE
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-emerald-200 dark:border-emerald-800">
              พร้อมคัดลอก JSON
            </Badge>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {flexTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{tpl.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tpl.description}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">
                      altText: {tpl.altText}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-dashed border-gray-200 dark:border-gray-700 p-3 text-[11px] text-gray-600 dark:text-gray-300 overflow-hidden">
                    <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">สรุปโครงสร้าง</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>ชนิด: {tpl.contents.type === 'carousel' ? 'Carousel' : 'Bubble'}</li>
                      <li>ส่วนหลัก: {tpl.contents.hero ? 'Hero image' : 'ข้อความ'} + Footer CTA</li>
                      <li>พร้อมส่งผ่าน Messaging API</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyFlexTemplate(tpl.id)}
                    >
                      {copiedTemplateId === tpl.id ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiDialogOpen(true)}
                      className="text-xs"
                    >
                      ปรับด้วย AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDreamSections = ({ showHeader = true }: { showHeader?: boolean }) => {
    const isLineConnected = lineStatus?.connected ?? lineOA.connected;

    if (!isLineConnected) {
      return renderContent();
    }

    return (
      <div
        className="space-y-4 pb-4"
        style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
      >
        {showHeader && (
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">LineBoost SME</p>
              <h1 className="text-xl font-semibold text-gray-900">สรุปหน้าร้าน</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  ร้านออนไลน์พร้อมขาย
                </span>
                <span className="text-[11px] text-gray-400">อัพเดต 3 นาทีที่แล้ว</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="relative text-emerald-700">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {pendingChats}
              </span>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-500">ยอดขายวันนี้</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-gray-900">฿{todaySales.toLocaleString()}</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  +12%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">รวมทุกช่องทาง</p>
            </CardContent>
          </Card>
          <Card className="border border-red-100 bg-gradient-to-br from-red-50 via-white to-red-50 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-500">รอตอบแชท</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-bold text-red-600">{pendingChats}</span>
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                  <MessageSquare className="w-4 h-4" />
                  เร่งตอบ!
                </span>
              </div>
              <p className="text-[11px] text-gray-500">ลูกค้าอาจหนีถ้าตอบช้า</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">ปิดการขายในนิ้วโป้งเดียว</p>
          <Button
            className="w-full justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 py-5 px-4 text-base"
            size="lg"
            onClick={() => setAiDialogOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              ให้ AI ช่วยคิดแคปชั่น
            </span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto py-4 px-3 flex items-center justify-start gap-2 text-sm"
              onClick={() => navigate('/broadcast')}
            >
              <Megaphone className="w-4 h-4 text-emerald-600" />
              บรอดแคสต์ด่วน
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 px-3 flex items-center justify-start gap-2 text-sm"
              onClick={() => navigate('/payments')}
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              ตรวจสลิป/โอน
            </Button>
          </div>
        </div>

        <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50 shadow-sm dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">เส้นทางการเงิน</CardTitle>
            <CardDescription className="text-sm">
              ส่งไป {funnelData.sent.toLocaleString()} คน → ซื้อจริงกี่คน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>เปิดอ่าน</span>
                <span className="font-semibold">{funnelData.opened.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{ width: `${Math.min((funnelData.opened / funnelData.sent) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>คลิก</span>
                <span className="font-semibold">{funnelData.clicked.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-600 dark:bg-emerald-300/90"
                  style={{ width: `${Math.min((funnelData.clicked / funnelData.sent) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-amber-700 dark:text-amber-200">ซื้อจริง</span>
                <span className="font-bold text-amber-700 dark:text-amber-200">
                  {funnelData.purchased.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-amber-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-amber-500 dark:bg-amber-400"
                  style={{ width: `${Math.min((funnelData.purchased / funnelData.sent) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Smart Insight
            </CardTitle>
            <CardDescription className="text-sm">
              AI สรุปให้: ลูกค้าชอบคลิกตอน 19.00 น. ลองตั้งเวลาบรอดแคสต์ช่วงนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>แนะนำ: ส่งโค้ดลดเพิ่ม 10% สำหรับคนที่ยังไม่จ่ายใน 2 ชม. นี้</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate('/broadcast')} className="text-xs">
                ตั้งเวลาบรอดแคสต์
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={loadRecentMessages}>
                ดูแชทร้อน
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMobileDream = () => (
    <div className="lg:hidden">{renderDreamSections({ showHeader: true })}</div>
  );

  return (
    <div className="relative">
      <FirestoreDebug />

      <div className="absolute inset-0 pointer-events-none select-none opacity-[0.05] hidden lg:flex items-center justify-center">
        <img
          src="/image/logo_mia.jpg"
          alt="LineBoost watermark"
          className="w-[120vw] max-w-none object-contain"
        />
      </div>
      <div className="relative">
        <div className="lg:hidden">{renderMobileDream()}</div>
        <div className="hidden lg:block">{renderContent()}</div>
      </div>

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
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <span>แนบลิงก์รูปสินค้า (รองรับ Google Drive)</span>
              </div>
              <Input
                placeholder="https://drive.google.com/your-product-image"
                value={aiImageUrl}
                onChange={(e) => setAiImageUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              ปิด
            </Button>
            <Button onClick={handleUseAiPrompt}>คัดลอกให้ AI ใช้</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
