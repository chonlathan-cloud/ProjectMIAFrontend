import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";
import { authedJson } from "@/lib/api";
import type { SiteConfig } from "@/components/site/SitePreview";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SitesResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // storeId จริงของร้าน
  const storeId = store?.id || import.meta.env.VITE_STORE_ID || "";

  const getBusinessName = (config?: SiteConfig) => {
    if (!config) return undefined;
    const anyConfig: any = config;
    return anyConfig.business?.name || anyConfig.businessName;
  };

  const publicUrl = useMemo(() => {
    const slug = sites?.published?.slug;
    if (!slug) return "";
    return `${window.location.origin}/public/${slug}`;
  }, [sites?.published?.slug]);

  const liffUrl = useMemo(() => {
    if (!publicUrl) return "";
    return `${window.location.origin}/liff-bridge?returnUrl=${encodeURIComponent(
      publicUrl
    )}`;
  }, [publicUrl]);

  const copyText = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`คัดลอก ${label} แล้ว`);
    } catch (error) {
      console.error("copy failed", error);
      toast.error("คัดลอกไม่สำเร็จ");
    }
  };

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [sitesRes, analyticsRes] = await Promise.all([
        authedJson<SitesResponse>(
          `/sites?storeId=${encodeURIComponent(storeId)}`
        ),
        authedJson<AnalyticsResponse>(
          `/sites/analytics?storeId=${encodeURIComponent(storeId)}&days=7`
        ),
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
    if (!storeId) return;
    loadAll();
  }, [storeId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website</h1>
          <div className="text-xs text-gray-400 mt-1">storeId: {storeId}</div>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold"
        >
          รีเฟรช
        </button>
      </div>

      {!storeId && (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-xl">
          กรุณาเลือกร้านค้าก่อน
        </div>
      )}
      {loading && storeId && (
        <div className="p-4 bg-white rounded-xl">Loading...</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>
      )}

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
                แก้ไขล่าสุด:{" "}
                {new Date(sites.draft.updatedAt).toLocaleString()}
              </div>
            )}
            {getBusinessName(sites.draft?.config) && (
              <div className="text-sm text-gray-700 mt-2">
                ชื่อร้าน: {getBusinessName(sites.draft?.config)}
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
                    เผยแพร่เมื่อ:{" "}
                    {new Date(sites.published.publishedAt).toLocaleString()}
                  </div>
                )}
                {getBusinessName(sites.published?.config) && (
                  <div className="text-sm text-gray-700 mt-2">
                    ชื่อร้าน: {getBusinessName(sites.published?.config)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Share Links Card */}
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">ลิงก์แชร์ให้ลูกค้า (เปิดผ่าน LINE)</div>
            {liffUrl ? (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                <div className="break-all">{liffUrl}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyText("ลิงก์ LINE", liffUrl)}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    คัดลอกลิงก์
                  </button>
                  <button
                    onClick={() => window.open(liffUrl, "_blank")}
                    className="px-3 py-2 rounded-lg border text-sm font-semibold"
                  >
                    เปิด
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 mt-2">
                ยังไม่มีลิงก์ (ต้องเผยแพร่เว็บไซต์ก่อน)
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && storeId && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/web-builder")}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold"
          >
            เปิด Website Builder
          </button>
        </div>
      )}

      {!loading && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Page Views (7 วัน)</div>
            <div className="text-3xl font-bold mt-2">
              {analytics.pageViews}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">Sessions</div>
            <div className="text-3xl font-bold mt-2">
              {analytics.uniqueSessions}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border">
            <div className="text-sm text-gray-500">CTA Clicks</div>
            <div className="text-3xl font-bold mt-2">
              {analytics.ctaClicks}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border lg:col-span-3">
            <div className="text-sm text-gray-500 mb-3">Top Pages</div>
            <div className="space-y-2">
              {analytics.topPages.map((p) => (
                <div
                  key={p.page}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="text-gray-700">{p.page}</div>
                  <div className="font-semibold">{p.count}</div>
                </div>
              ))}

              {!analytics.topPages.length && (
                <div className="text-sm text-gray-400">
                  ยังไม่มีข้อมูล
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
