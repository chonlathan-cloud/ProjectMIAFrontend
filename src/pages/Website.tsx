import { useEffect, useMemo, useState } from "react";

// ปรับ API_BASE ให้ตรง env ของ LineBoost dashboard
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

type SiteConfig = {
  businessName?: string;
  themeColor?: string;
  sections?: any[];
};

type SitesResponse = {
  success: boolean;
  draft: { config: SiteConfig; updatedAt?: string } | null;
  published: {
    config: SiteConfig;
    slug?: string;
    version?: number;
    publishedAt?: string;
  } | null;
};

type AnalyticsResponse = {
  success: boolean;
  days: number;
  pageViews: number;
  uniqueSessions: number;
  ctaClicks: number;
  topPages: { page: string; count: number }[];
};

export default function Website() {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SitesResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // MVP: เอา storeId จาก env ก่อน (ของจริงค่อยผูกกับ useStore())
  const storeId = import.meta.env.VITE_STORE_ID || "test-store-001";

  const publishedUrl = useMemo(() => {
    if (!sites?.published?.slug) return null;
    return `${window.location.origin}/s/${sites.published.slug}`;
  }, [sites?.published?.slug]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [sitesRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/sites?storeId=${encodeURIComponent(storeId)}`).then(r => r.json()),
        fetch(`${API_BASE}/sites/analytics?storeId=${encodeURIComponent(storeId)}&days=7`).then(r => r.json()),
      ]);

      if (!sitesRes?.success) throw new Error("load sites failed");
      if (!analyticsRes?.success) throw new Error("load analytics failed");

      setSites(sitesRes);
      setAnalytics(analyticsRes);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Website</h1>
        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold"
        >
          รีเฟรช
        </button>
      </div>

      {loading && <div className="p-4 bg-white rounded-xl">Loading...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

      {!loading && sites && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Draft Card */}
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Draft</div>
            <div className="text-lg font-bold mt-1">
              {sites.draft ? "มีแบบร่าง" : "ยังไม่มี"}
            </div>
            {sites.draft?.updatedAt && (
              <div className="text-xs text-gray-400 mt-2">
                แก้ไขล่าสุด: {new Date(sites.draft.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Published Card */}
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Published</div>
            <div className="text-lg font-bold mt-1">
              {sites.published ? "เผยแพร่แล้ว" : "ยังไม่ได้เผยแพร่"}
            </div>
            {sites.published && (
              <>
                <div className="text-xs text-gray-400 mt-2">
                  version: {sites.published.version}
                </div>
                {sites.published.publishedAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    เผยแพร่เมื่อ: {new Date(sites.published.publishedAt).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* URL Card */}
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Public URL</div>
            {publishedUrl ? (
              <>
                <a
                  href={publishedUrl}
                  target="_blank"
                  className="block text-blue-600 underline break-all mt-2"
                >
                  {publishedUrl}
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(publishedUrl)}
                  className="mt-3 px-3 py-2 rounded-lg bg-gray-100 text-sm font-semibold"
                >
                  Copy link
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-400 mt-2">ยังไม่มีลิงก์</div>
            )}
          </div>
        </div>
      )}

      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Page Views (7 วัน)</div>
            <div className="text-3xl font-bold mt-2">{analytics.pageViews}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Sessions</div>
            <div className="text-3xl font-bold mt-2">{analytics.uniqueSessions}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">CTA Clicks</div>
            <div className="text-3xl font-bold mt-2">{analytics.ctaClicks}</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border lg:col-span-3">
            <div className="text-sm text-gray-500 mb-3">Top Pages</div>
            <div className="space-y-2">
              {analytics.topPages.map((p) => (
                <div key={p.page} className="flex items-center justify-between text-sm">
                  <div className="text-gray-700">{p.page}</div>
                  <div className="font-semibold">{p.count}</div>
                </div>
              ))}
              {!analytics.topPages.length && (
                <div className="text-sm text-gray-400">ยังไม่มีข้อมูล</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
