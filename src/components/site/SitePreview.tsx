import { Phone, MapPin, Star } from "lucide-react";

export type SiteConfig = {
  category?: "restaurant" | "cafe" | "clinic";
  templateId?: string;
  slug?: string;
  businessName?: string;
  tagline?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  themeColor?: string;
  highlights?: string[];
  offerings?: string[];
  gallery?: string[];
  address?: string;
  phone?: string;
};

type SitePreviewProps = {
  config: SiteConfig;
  businessNameFallback?: string;
};

export default function SitePreview({
  config,
  businessNameFallback,
}: SitePreviewProps) {
  const accent = config.themeColor || "#16a34a";
  const accentSoft = `${accent}22`;
  const name = config.businessName || businessNameFallback || "LineBoost Store";
  const headline = config.heroHeadline || `ยินดีต้อนรับสู่ ${name}`;
  const subheadline =
    config.heroSubheadline || "เว็บไซต์หน้าร้านที่เชื่อมต่อกับ LINE OA ของคุณ";
  const heroImage = config.heroImageUrl || "";
  const ctaText = config.ctaText || "ติดต่อผ่าน LINE";
  const ctaUrl = config.ctaUrl || "";
  const highlights = config.highlights || [];
  const offerings = config.offerings || [];
  const gallery = config.gallery || [];

  return (
    <div className="w-full bg-white rounded-[28px] border overflow-hidden shadow-[0_20px_60px_-35px_rgba(15,23,42,0.5)]">
      <div
        className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] px-8 py-10 text-white"
        style={{
          background: `radial-gradient(circle at 12% 20%, ${accentSoft} 0%, transparent 55%), linear-gradient(120deg, ${accent} 0%, #111827 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative z-10">
          <div className="text-[10px] uppercase tracking-[0.45em] text-white/70">
            {config.category || "business"}
          </div>
          <h2 className="text-4xl font-bold mt-3 leading-tight">{headline}</h2>
          <p className="mt-4 text-white/80 max-w-xl text-base leading-relaxed">
            {subheadline}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {ctaUrl ? (
              <a
                href={ctaUrl}
                className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold bg-white text-gray-900 shadow-md"
              >
                {ctaText}
              </a>
            ) : (
              <span className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold bg-white/20 text-white">
                เพิ่มลิงก์ LINE OA เพื่อใช้งาน
              </span>
            )}
            <span className="text-xs text-white/70">
              {config.tagline || "เชื่อมต่อกับลูกค้าแบบเรียลไทม์"}
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center">
          {heroImage ? (
            <img
              src={heroImage}
              alt={headline}
              className="w-full h-72 object-cover rounded-[24px] shadow-2xl ring-1 ring-white/20"
            />
          ) : (
            <div className="w-full h-72 rounded-[24px] border border-dashed border-white/40 text-white/80 flex items-center justify-center text-sm">
              เพิ่มรูปภาพ Hero
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-8 space-y-6">
        {highlights.length > 0 && (
          <section>
            <div className="text-sm font-semibold text-gray-900">จุดเด่น</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {highlights.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="flex gap-3 rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-700"
                >
                  <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {offerings.length > 0 && (
          <section>
            <div className="text-sm font-semibold text-gray-900">
              {config.category === "clinic" ? "บริการเด่น" : "เมนูแนะนำ"}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {offerings.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-2xl border px-4 py-3 text-sm text-gray-700 bg-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section>
            <div className="text-sm font-semibold text-gray-900">แกลเลอรี</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {gallery.map((url, idx) => (
                <img
                  key={`${url}-${idx}`}
                  src={url}
                  alt={`gallery-${idx}`}
                  className="w-full h-44 object-cover rounded-2xl border shadow-sm"
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{config.address || "เพิ่มที่อยู่ร้านของคุณ"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{config.phone || "เพิ่มเบอร์ติดต่อ"}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
