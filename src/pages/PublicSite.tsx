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

const shouldRedirectToLiff = () => {
  const ua = navigator.userAgent || "";
  return /line/i.test(ua);
};

const resolveApiBase = () => {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return "/api";
  return base.endsWith("/api") ? base : `${base}/api`;
};

export default function PublicSite() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [siteData, setSiteData] = useState<PublicSiteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdpaVisible, setPdpaVisible] = useState(true);
  const [pdpaExpanded, setPdpaExpanded] = useState(false);
  const [pdpaStatus, setPdpaStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );
  const [pdpaMessage, setPdpaMessage] = useState<string | null>(null);

  const shouldShowPdpa = siteData?.config && (siteData.config as any).pdpa?.showBanner !== false;
  const showPdpaBanner = shouldShowPdpa && pdpaVisible;

  useEffect(() => {
    if (!siteData?.storeId) return;
    const key = `cb_pdpa_accepted_${siteData.storeId}`;
    if (localStorage.getItem(key) === "true") {
      setPdpaVisible(false);
    }
  }, [siteData?.storeId]);

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

        const hasLineUserId = !!localStorage.getItem("cb_line_user_id");
        const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
        const liffAttempted = sessionStorage.getItem("cb_liff_attempted") === "true";
        if (!hasLineUserId && liffId && shouldRedirectToLiff() && !liffAttempted) {
          sessionStorage.setItem("cb_liff_attempted", "true");
          const returnUrl = window.location.href;
          window.location.replace(
            `/liff-bridge?returnUrl=${encodeURIComponent(returnUrl)}`
          );
          return;
        }

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

  const handlePdpaAccept = async () => {
    const lineUserId = localStorage.getItem("cb_line_user_id");
    if (!lineUserId) {
      setPdpaStatus("error");
      setPdpaMessage("กรุณาเปิดผ่าน LINE เพื่อยืนยันตัวตน");
      return;
    }

    try {
      setPdpaStatus("saving");
      setPdpaMessage(null);
      const base = resolveApiBase();
      const endpoint = `${base}/pdpa/consent`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: siteData.storeId,
          lineUserId,
          consented: true,
          source: "public_site",
          purpose: "marketing",
          policyVersion: "v1",
        }),
      });

      if (!res.ok) throw new Error("consent_failed");

      localStorage.setItem(`cb_pdpa_accepted_${siteData.storeId}`, "true");
      trackEvent(siteData.storeId, "pdpa_consent", {
        accepted: true,
        source: "public_site",
      });
      setPdpaVisible(false);
    } catch (err) {
      console.error("[PDPA] consent submit failed", err);
      setPdpaStatus("error");
      setPdpaMessage("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPdpaStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-24">
      {showPdpaBanner && (
        <div className="fixed inset-0 z-30 flex items-end px-4 pb-6 sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">PDPA</span>
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  โปรดให้ความยินยอมเพื่อใช้งานเว็บไซต์
                </p>
                <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">
                  เราใช้ข้อมูลเพื่อยืนยันตัวตนและมอบประสบการณ์ที่เหมาะสม คุณสามารถอ่านรายละเอียดนโยบายได้
                </p>
                <button
                  className="mt-2 text-[11px] font-semibold text-gray-700 underline underline-offset-2"
                  onClick={() => setPdpaExpanded((prev) => !prev)}
                >
                  {pdpaExpanded ? "ซ่อนรายละเอียด" : "อ่านนโยบายความเป็นส่วนตัว"}
                </button>
                {pdpaExpanded && (
                  <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600 leading-relaxed">
                    เราเก็บ LINE User ID และพฤติกรรมการใช้งานเพื่อยืนยันตัวตนและปรับปรุงประสบการณ์
                    คุณสามารถขอถอนความยินยอมได้ทุกเมื่อผ่าน LINE OA ของร้านค้า
                  </div>
                )}
                {pdpaMessage && (
                  <p className="mt-2 text-[11px] text-amber-600">{pdpaMessage}</p>
                )}
                <div className="mt-4">
                  <Button
                    className="w-full bg-black text-white text-sm py-3 rounded-xl font-semibold"
                    onClick={handlePdpaAccept}
                    disabled={pdpaStatus === "saving"}
                  >
                    {pdpaStatus === "saving" ? "กำลังบันทึก..." : "ยอมรับและใช้งานต่อ"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`max-w-5xl mx-auto space-y-6 ${
          showPdpaBanner ? "pointer-events-none select-none blur-[1px]" : ""
        }`}
      >
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
