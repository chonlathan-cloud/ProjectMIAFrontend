import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import liff from "@line/liff";
import { trackEvent } from "@/lib/tracker";
import SitePreview, { SiteConfig } from "@/components/site/SitePreview";
import { Button } from "@/components/ui/button";

type PublicSiteResponse = {
  success: boolean;
  storeId: string;
  config: SiteConfig;
  version?: number;
  businessInfo?: { name?: string };
};

const resolvePublicEndpoint = (slug: string) => {
  const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
  if (!base) return `/api/public/sites/${slug}`;
  return `${base}/public/sites/${slug}`;
};

const initLiffIfAvailable = async (storeId: string) => {
  const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
  if (!liffId) return;

  try {
    await liff.init({ liffId });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      localStorage.setItem("cb_line_user_id", profile.userId);
      trackEvent(storeId, "liff_init", { lineUserId: profile.userId });
    }
  } catch (error) {
    console.warn("[PublicSite] LIFF init failed", error);
  }
};

export default function PublicSite() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [siteData, setSiteData] = useState<PublicSiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdpaVisible, setPdpaVisible] = useState(true);

  const shouldShowPdpa = siteData?.config && (siteData.config as any).pdpa?.showBanner !== false;
  const showPdpaBanner = shouldShowPdpa && pdpaVisible;

  useEffect(() => {
    if (!storeSlug) return;

    const load = async () => {
      try {
        setError(null);
        const url = resolvePublicEndpoint(storeSlug);
        const res = await fetch(url);
        const data = (await res.json()) as PublicSiteResponse;
        if (!res.ok || !data?.success) {
          const message = (data as any)?.message || "โหลดไม่สำเร็จ";
          throw new Error(message);
        }

        setSiteData(data);
        await initLiffIfAvailable(data.storeId);
        trackEvent(data.storeId, "page_view", {
          layout: (data.config as any)?.templateId,
          version: data.version,
        });
      } catch (err: any) {
        setError(err?.message || "โหลดเว็บไซต์ไม่สำเร็จ");
      }
    };

    load();
  }, [storeSlug]);

  if (error) {
    return <div className="p-10 text-center text-red-600">{error}</div>;
  }

  if (!siteData) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {showPdpaBanner && (
          <div className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">PDPA</span>
              </span>
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 leading-tight mb-2">
                  เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุด ท่านสามารถศึกษารายละเอียดเพิ่มเติมได้ที่ นโยบายความเป็นส่วนตัว (PDPA)
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-black text-white text-xs py-2 rounded-lg font-bold" asChild>
                    <a href={`/pdpa/${siteData.storeId}`}>ยอมรับ</a>
                  </Button>
                  <button
                    className="px-3 bg-gray-100 text-gray-500 text-xs py-2 rounded-lg font-bold"
                    onClick={() => setPdpaVisible(false)}
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SitePreview
          config={siteData.config}
          businessNameFallback={siteData.businessInfo?.name}
          storeId={siteData.storeId}
          enableTracking
        />
      </div>
    </div>
  );
}
