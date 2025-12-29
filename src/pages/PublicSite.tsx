import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function PublicSite() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [siteData, setSiteData] = useState<PublicSiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        trackEvent(data.storeId, "page_view", {
          layout: data.config?.templateId,
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-semibold">ยินยอม PDPA</p>
              <p className="text-sm text-gray-600">
                กรุณากดยืนยันก่อนเริ่มใช้งาน เพื่อให้ร้านสามารถตอบกลับผ่าน AI ได้
              </p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <a href={`/pdpa/${siteData.storeId}`}>ยืนยัน PDPA</a>
            </Button>
          </div>
        </div>
        <SitePreview
          config={siteData.config}
          businessNameFallback={siteData.businessInfo?.name}
        />
      </div>
    </div>
  );
}
