import { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw, Link2, Globe, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authedJson, getAnalytics, getLineStatus, type AnalyticsData, type LineStatusResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';

type SiteAnalyticsResponse = {
  success: boolean;
  days: number;
  pageViews: number;
  uniqueSessions: number;
  ctaClicks: number;
  topPages: { page: string; count: number }[];
};

export function Analytics() {
  const { store } = useStore();
  const [lineStatus, setLineStatus] = useState<LineStatusResponse['data'] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [siteAnalytics, setSiteAnalytics] = useState<SiteAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const storeId = store?.id || '';

  useEffect(() => {
    if (!storeId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setStatusLoading(true);
        const [statusRes, analyticsRes, siteAnalyticsRes] = await Promise.all([
          getLineStatus(storeId),
          getAnalytics(storeId, 30),
          authedJson<SiteAnalyticsResponse>(`/sites/analytics?storeId=${encodeURIComponent(storeId)}&days=7`),
        ]);
        setLineStatus(statusRes.data);
        setAnalytics(analyticsRes.data);
        if (siteAnalyticsRes?.success) {
          setSiteAnalytics(siteAnalyticsRes);
        }
      } catch (err) {
        console.error('load analytics error', err);
      } finally {
        setLoading(false);
        setStatusLoading(false);
      }
    };

    fetchAll();
  }, [storeId]);

  const topEvents = useMemo(() => {
    if (!analytics?.eventTypeStats) return [];
    return [...analytics.eventTypeStats].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [analytics?.eventTypeStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">รายงานสถิติ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">สรุปข้อมูลการสื่อสารและพฤติกรรมล่าสุดของร้าน</p>
      </div>

      {!storeId && (
        <Card>
          <CardContent className="py-6 text-sm text-gray-500">
            กรุณาเลือกร้านค้าก่อนเพื่อดูรายงาน
          </CardContent>
        </Card>
      )}

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
              <p>สรุปจำนวนข้อความรับ-ส่งและผลลัพธ์การบรอดแคสต์</p>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-400">รวมข้อความ</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analytics?.summary?.totalMessages ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">บรอดแคสต์ทั้งหมด</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analytics?.summary?.totalBroadcasts ?? '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                <span>
                  {analytics ? `สรุปย้อนหลัง ${analytics.period} วัน` : 'กำลังโหลดข้อมูล...'}
                </span>
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
              <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-400">Page Views</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {siteAnalytics?.pageViews ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Sessions</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {siteAnalytics?.uniqueSessions ?? '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">CTA Clicks</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {siteAnalytics?.ctaClicks ?? '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                <span>
                  {siteAnalytics ? `สรุปย้อนหลัง ${siteAnalytics.days} วัน` : 'กำลังโหลดข้อมูล...'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-line" />
            สรุปกิจกรรมเด่น
          </CardTitle>
          <CardDescription>
            ประเภทกิจกรรมที่เกิดขึ้นบ่อยที่สุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            {topEvents.length === 0 ? (
              <p className="text-gray-500">ยังไม่มีข้อมูลกิจกรรมในช่วงนี้</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topEvents.map((event) => (
                  <div key={event.eventType} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <span className="text-gray-700">{event.eventType}</span>
                    <span className="font-semibold text-gray-900">{event.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
