import { useMemo, useState, type ReactNode } from "react";
import { Phone, MapPin, ShieldCheck } from "lucide-react";
import { trackEvent } from "@/lib/tracker";
import { Button } from "@/components/ui/button";

export type SiteConfigV1 = {
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

export type SiteConfigV2 = {
  version: "v2";
  templateId: "apple-minimal" | "apple-commerce" | "standard" | "clinic";
  business: {
    name: string;
    tagline?: string;
    themeColor: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaUrl?: string;
    imageUrl?: string;
  };
  products: Array<{
    id: string;
    name: string;
    price?: string;
    imageUrl?: string;
    url?: string;
    shortDesc?: string;
    tags?: string[];
    stock?: number;
  }>;
  sections?: {
    highlights?: string[];
    trust?: string[];
    gallery?: string[];
  };
  pdpa?: {
    consentText?: string;
    policyVersion?: string;
    showBanner?: boolean;
  };
  payment?: {
    promptpayId?: string;
  };
  metadata?: {
    slug?: string;
  };
};

export type SiteConfig = SiteConfigV1 | SiteConfigV2;

type NormalizedSite = {
  version: "v1" | "v2";
  templateId: string;
  business: {
    name: string;
    tagline?: string;
    themeColor: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaUrl?: string;
    imageUrl?: string;
  };
  products: SiteConfigV2["products"];
  sections: {
    highlights: string[];
    trust: string[];
    gallery: string[];
  };
};

type SitePreviewProps = {
  config: SiteConfig;
  businessNameFallback?: string;
  storeId?: string;
  enableTracking?: boolean;
  renderMode?: "public" | "builder";
};

const buildId = (value: string, idx: number) =>
  value
    ? `${value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, "-")}-${idx}`
    : `item-${idx}`;

const normalizeConfig = (
  config: SiteConfig,
  businessNameFallback?: string
): NormalizedSite => {
  if ((config as SiteConfigV2).version === "v2") {
    const data = config as SiteConfigV2;
    return {
      version: "v2",
      templateId: data.templateId,
      business: {
        name: data.business.name || businessNameFallback || "ConnectBridge Store",
        tagline: data.business.tagline,
        themeColor: data.business.themeColor || "#111827",
        logoUrl: data.business.logoUrl,
        address: data.business.address,
        phone: data.business.phone,
      },
      hero: {
        headline: data.hero.headline,
        subheadline: data.hero.subheadline,
        ctaText: data.hero.ctaText,
        ctaUrl: data.hero.ctaUrl,
        imageUrl: data.hero.imageUrl,
      },
      products: data.products || [],
      sections: {
        highlights: data.sections?.highlights || [],
        trust: data.sections?.trust || [],
        gallery: data.sections?.gallery || [],
      },
    };
  }

  const v1 = config as SiteConfigV1;
  const name = v1.businessName || businessNameFallback || "ConnectBridge Store";
  return {
    version: "v1",
    templateId: v1.templateId || "legacy",
    business: {
      name,
      tagline: v1.tagline,
      themeColor: v1.themeColor || "#111827",
      address: v1.address,
      phone: v1.phone,
    },
    hero: {
      headline: v1.heroHeadline || `ยินดีต้อนรับสู่ ${name}`,
      subheadline:
        v1.heroSubheadline ||
        "เว็บไซต์หน้าร้านที่เชื่อมต่อกับ LINE OA ของคุณ",
      ctaText: v1.ctaText || "ติดต่อผ่าน LINE",
      ctaUrl: v1.ctaUrl,
      imageUrl: v1.heroImageUrl,
    },
    products: (v1.offerings || []).map((item, idx) => ({
      id: buildId(item, idx),
      name: item,
      shortDesc: v1.highlights?.[idx],
    })),
    sections: {
      highlights: v1.highlights || [],
      trust: [],
      gallery: v1.gallery || [],
    },
  };
};

const DeviceFrame = ({
  children,
  businessName,
}: {
  children: ReactNode;
  businessName: string;
}) => (
  <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
    <div className="w-full max-w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-900 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-xl z-20" />
      <div className="h-12 bg-white flex items-center justify-center border-b border-gray-100 pt-4 z-10 shrink-0">
        <span className="text-xs font-medium text-gray-500">
          {businessName}
        </span>
      </div>
      {children}
    </div>
  </div>
);

export default function SitePreview({
  config,
  businessNameFallback,
  storeId,
  enableTracking = false,
  renderMode = "public",
}: SitePreviewProps) {
  const normalized = normalizeConfig(config, businessNameFallback);
  const accent = normalized.business.themeColor || "#111827";
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    total: number;
    promptpayId: string;
    qrUrl: string;
    slipUrl?: string;
  } | null>(null);
  const [slipStatus, setSlipStatus] = useState<"idle" | "uploading" | "error" | "success">(
    "idle"
  );
  const [slipError, setSlipError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      qty: number;
      imageUrl?: string;
    }>
  >([]);

  const parsePrice = (value?: string) => {
    if (!value) return 0;
    const normalizedPrice = Number(String(value).replace(/[,฿\s]/g, ""));
    return Number.isFinite(normalizedPrice) ? normalizedPrice : 0;
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const resolveApiBase = () => {
    const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
    if (!base) return "/api";
    return base.endsWith("/api") ? base : `${base}/api`;
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Invalid file"));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      reader.readAsDataURL(file);
    });

  const handleSlipUpload = async (file: File) => {
    if (!storeId || !orderResult) return;
    if (file.size > 1024 * 1024) {
      setSlipStatus("error");
      setSlipError("ไฟล์ใหญ่เกิน 1MB");
      return;
    }
    setSlipStatus("uploading");
    setSlipError(null);
    try {
      const base = resolveApiBase();
      const dataUrl = await fileToBase64(file);
      const res = await fetch(`${base}/sites/order/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          orderId: orderResult.orderId,
          slipBase64: dataUrl,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "อัปโหลดสลิปไม่สำเร็จ");
      }
      setOrderResult((prev) =>
        prev ? { ...prev, slipUrl: data.slipUrl } : prev
      );
      setSlipStatus("success");
    } catch (err: any) {
      setSlipStatus("error");
      setSlipError(err?.message || "อัปโหลดสลิปไม่สำเร็จ");
    }
  };

  const handleCtaClick = () => {
    if (!enableTracking || !storeId) return;
    trackEvent(
      storeId,
      "cta_click",
      { ctaText: normalized.hero.ctaText, ctaUrl: normalized.hero.ctaUrl },
      { eventName: "cta_click" }
    );
  };

  const handleAddToCart = (product: SiteConfigV2["products"][number]) => {
    const stock = Number(product.stock);
    if (Number.isFinite(stock) && stock <= 0) return;
    const price = parsePrice(product.price);
    if (!price) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => {
          if (item.id !== product.id) return item;
          const nextQty = item.qty + 1;
          if (Number.isFinite(stock)) {
            return { ...item, qty: Math.min(nextQty, stock) };
          }
          return { ...item, qty: nextQty };
        });
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          qty: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
    if (enableTracking && storeId) {
      trackEvent(
        storeId,
        "add_to_cart",
        { productName: product.name, price, quantity: 1 },
        { eventName: "add_to_cart", productId: product.id }
      );
    }
    setCartOpen(true);
  };

  const updateQty = (id: string, nextQty: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const stock = Number(
            normalized.products.find((product) => product.id === id)?.stock
          );
          const safeQty = Math.max(1, nextQty);
          if (Number.isFinite(stock)) {
            return { ...item, qty: Math.min(safeQty, stock) };
          }
          return { ...item, qty: safeQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartCheckout = () => {
    setCheckoutOpen(true);
    if (enableTracking && storeId) {
      trackEvent(storeId, "checkout_start", { total: cartTotal });
    }
  };

  const handleCheckoutSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeId) return;
    setCheckoutStatus("loading");
    setCheckoutError(null);
    try {
      const base = resolveApiBase();
      const res = await fetch(`${base}/sites/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            imageUrl: item.imageUrl,
          })),
          customer: {
            ...checkout,
            lineUserId: localStorage.getItem("cb_line_user_id") || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
      }
      setOrderResult({
        orderId: data.orderId,
        total: data.total,
        promptpayId: data.promptpayId,
        qrUrl: data.qrUrl,
      });
      setCheckoutOpen(false);
      if (enableTracking) {
        trackEvent(storeId, "checkout_submit", {
          total: cartTotal,
          orderId: data.orderId,
        });
      }
    } catch (err: any) {
      setCheckoutStatus("error");
      setCheckoutError(err?.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setCheckoutStatus("idle");
    }
  };

  const handleProductClick = (product: SiteConfigV2["products"][number]) => {
    if (!enableTracking || !storeId) return;
    trackEvent(
      storeId,
      "product_click",
      {
        productName: product.name,
        productUrl: product.url,
        imageUrl: product.imageUrl,
        price: product.price,
      },
      { eventName: "product_click", productId: product.id }
    );

    if (product.url) {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
  };

  const content = (
    <div className="flex-1 overflow-y-auto hide-scrollbar bg-gray-50 relative">
      <div className="relative h-72 w-full overflow-hidden rounded-b-3xl shadow-md">
        {normalized.hero.imageUrl ? (
          <img
            src={normalized.hero.imageUrl}
            alt={normalized.hero.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-400">
            เพิ่มรูปภาพ Hero
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {normalized.hero.headline}
          </h1>
          <p className="text-sm opacity-90 mb-4">
            {normalized.hero.subheadline}
          </p>
          {normalized.hero.ctaUrl ? (
            <a
              href={normalized.hero.ctaUrl}
              onClick={handleCtaClick}
              className="self-start px-6 py-2 rounded-full text-sm font-semibold shadow-lg"
              style={{ backgroundColor: accent }}
            >
              {normalized.hero.ctaText}
            </a>
          ) : (
            <span className="self-start px-6 py-2 rounded-full text-sm font-semibold bg-white/20">
              เพิ่มลิงก์ LINE OA เพื่อใช้งาน
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          สินค้าแนะนำ
        </h2>
        {normalized.products.length === 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-500">
            เพิ่มสินค้าเพื่อแสดงในหน้าร้าน
          </div>
        )}
        {normalized.products.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {normalized.products.map((product) => (
              <div
                key={product.id}
                className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col text-left"
              >
                <button type="button" onClick={() => handleProductClick(product)}>
                  <div className="h-24 bg-gray-100 rounded-xl mb-2 w-full overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        ใส่รูปสินค้า
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {product.name}
                    </h3>
                    {product.shortDesc && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {product.shortDesc}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-bold text-gray-900">
                    {product.price ? `฿${product.price}` : "สอบถามราคา"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-full bg-gray-100 disabled:opacity-60"
                    style={{ color: accent }}
                    disabled={Number.isFinite(Number(product.stock)) && Number(product.stock) <= 0}
                  >
                    {Number.isFinite(Number(product.stock)) && Number(product.stock) <= 0
                      ? "สินค้าหมด"
                      : "เพิ่มลงตะกร้า"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-gray-800 mb-2">
          <ShieldCheck size={18} className="text-emerald-500" />
          <h3 className="text-sm font-semibold">ความปลอดภัยและ PDPA</h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-600">
          {(normalized.sections.trust.length
            ? normalized.sections.trust
            : [
                "ยืนยันตัวตนผ่าน LINE OA",
                "เก็บข้อมูลตามมาตรฐาน PDPA",
                "บันทึก RoPA ทุกการยินยอม",
              ]
          ).map((item, idx) => (
            <li key={`${item}-${idx}`} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pb-24 text-center text-gray-400">
        <div className="flex justify-center gap-4 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>{normalized.business.address || "เพิ่มที่อยู่ร้านของคุณ"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{normalized.business.phone || "เพิ่มเบอร์ติดต่อ"}</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 text-[10px]">
          Powered by ConnectBridge
        </div>
      </div>

      {renderMode === "public" && (
        <>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 rounded-full shadow-lg px-4 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            ตะกร้า ({cartItems.reduce((sum, item) => sum + item.qty, 0)})
          </button>

          {cartOpen && (
            <div className="fixed inset-0 z-40 flex items-end justify-center">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setCartOpen(false)}
              />
              <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">ตะกร้าสินค้า</h3>
                  <button
                    type="button"
                    className="text-sm text-gray-500"
                    onClick={() => setCartOpen(false)}
                  >
                    ปิด
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <div className="mt-4 text-sm text-gray-500">
                    ยังไม่มีสินค้าในตะกร้า
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                      >
                        <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ฿{item.price.toLocaleString()}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full border text-sm"
                              onClick={() => updateQty(item.id, item.qty - 1)}
                            >
                              -
                            </button>
                            <span className="text-sm">{item.qty}</span>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full border text-sm"
                              onClick={() => updateQty(item.id, item.qty + 1)}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="ml-auto text-xs text-red-500"
                              onClick={() => removeItem(item.id)}
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>รวมทั้งหมด</span>
                      <span>฿{cartTotal.toLocaleString()}</span>
                    </div>
                    <Button
                      className="w-full mt-2"
                      onClick={handleStartCheckout}
                    >
                      ไปที่เช็คเอาต์
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {checkoutOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setCheckoutOpen(false)}
              />
              <form
                className="relative w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto overscroll-contain"
                onSubmit={handleCheckoutSubmit}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">เช็คเอาต์</h3>
                  <button
                    type="button"
                    className="text-sm text-gray-500"
                    onClick={() => setCheckoutOpen(false)}
                  >
                    ปิด
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">ชื่อผู้สั่งซื้อ</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={checkout.name}
                    onChange={(e) =>
                      setCheckout((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">เบอร์โทร</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={checkout.phone}
                    onChange={(e) =>
                      setCheckout((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">ที่อยู่จัดส่ง</label>
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    rows={3}
                    value={checkout.address}
                    onChange={(e) =>
                      setCheckout((prev) => ({ ...prev, address: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">หมายเหตุ</label>
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    rows={2}
                    value={checkout.note}
                    onChange={(e) =>
                      setCheckout((prev) => ({ ...prev, note: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>ยอดรวม</span>
                  <span>฿{cartTotal.toLocaleString()}</span>
                </div>
                <Button type="submit" className="w-full" disabled={checkoutStatus === "loading"}>
                  {checkoutStatus === "loading" ? "กำลังสร้างคำสั่งซื้อ..." : "ส่งคำสั่งซื้อ"}
                </Button>
                {checkoutError ? (
                  <div className="text-xs text-amber-600">{checkoutError}</div>
                ) : null}
              </form>
            </div>
          )}

          {orderResult && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setOrderResult(null)}
              />
              <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto overscroll-contain">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">ชำระเงินด้วย PromptPay</h3>
                  <button
                    type="button"
                    className="text-sm text-gray-500"
                    onClick={() => setOrderResult(null)}
                  >
                    ปิด
                  </button>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <img
                    src={orderResult.qrUrl}
                    alt="PromptPay QR"
                    className="mx-auto h-56 w-56 object-contain"
                  />
                  <div className="mt-3 text-sm text-gray-600">
                    ยอดชำระ: <span className="font-semibold">฿{orderResult.total.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    PromptPay: {orderResult.promptpayId}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-500">
                  หลังโอนเงินแล้ว กรุณาติดต่อร้านหรือส่งสลิปเพื่อยืนยัน
                </div>
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
                  <div className="font-semibold text-gray-700">อัปโหลดสลิป</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 text-xs"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) handleSlipUpload(file);
                    }}
                  />
                  {slipStatus === "uploading" && (
                    <div className="mt-2 text-amber-600">กำลังอัปโหลดสลิป...</div>
                  )}
                  {slipStatus === "success" && orderResult.slipUrl && (
                    <a
                      href={orderResult.slipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-emerald-600 underline"
                    >
                      ดูสลิปที่อัปโหลด
                    </a>
                  )}
                  {slipStatus === "error" && slipError && (
                    <div className="mt-2 text-red-600">{slipError}</div>
                  )}
                </div>
                <Button className="w-full" onClick={() => setOrderResult(null)}>
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (renderMode === "builder") {
    return (
      <div className="rounded-3xl bg-slate-50 p-4">
        <DeviceFrame businessName={normalized.business.name}>
          {content}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-4 border-t border-gray-200 z-30">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-gray-400 shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 leading-tight mb-2">
                  เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุด ท่านสามารถศึกษารายละเอียดเพิ่มเติมได้ที่ นโยบายความเป็นส่วนตัว (PDPA)
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-black text-white text-xs py-2 rounded-lg font-bold">
                    ยอมรับ
                  </button>
                  <button className="px-3 bg-gray-100 text-gray-500 text-xs py-2 rounded-lg font-bold">
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DeviceFrame>
      </div>
    );
  }

  return content;
}
