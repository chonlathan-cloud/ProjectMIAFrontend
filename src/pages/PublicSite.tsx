import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { trackEvent } from "@/lib/tracker";

type SiteData = {
  slug: string;
  heroHeadline: string;
  layout: string;
};

export default function PublicSite() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [siteData, setSiteData] = useState<SiteData | null>(null);

  useEffect(() => {
    if (!storeSlug) return;

    // MVP: auto-generate config จาก slug
    const config: SiteData = {
      slug: storeSlug,
      layout: "default",
      heroHeadline: `ยินดีต้อนรับสู่ ${storeSlug}`,
    };

    setSiteData(config);

    trackEvent(storeSlug, "page_view", {
      layout: config.layout,
      title: config.heroHeadline,
    });
  }, [storeSlug]);

  if (!siteData) {
    return <div className="p-10 text-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">{siteData.heroHeadline}</h1>
      <p className="mt-4 text-gray-500">
        ติดต่อเราผ่าน LINE Official Account ได้ทันที
      </p>
      <a
        href="https://line.me/R/ti/p/@your-line-oa"
        className="mt-6 inline-block bg-green-500 text-white px-6 py-3 rounded"
      >
        แอด LINE
      </a>
    </div>
  );
}
