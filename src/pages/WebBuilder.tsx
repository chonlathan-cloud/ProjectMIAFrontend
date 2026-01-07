import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authedJson, getLineOaLink, uploadLineImage } from "@/lib/api";
import SitePreview, { SiteConfig, SiteConfigV2 } from "@/components/site/SitePreview";

const templates: Array<{
  id: SiteConfigV2["templateId"];
  name: string;
  description: string;
  config: SiteConfigV2;
}> = [
  {
    id: "standard",
    name: "Standard",
    description: "เหมาะกับสินค้าทั่วไป เน้นภาพชัด โฟกัสการสั่งซื้อ",
    config: {
      version: "v2",
      templateId: "standard",
      business: {
        name: "ConnectBridge Store",
        tagline: "ร้านค้าสมัยใหม่เชื่อมต่อ LINE",
        themeColor: "#111827",
      },
      hero: {
        headline: "หน้าร้านที่สะอาด เรียบ และชวนซื้อ",
        subheadline: "Mobile-first full layout สำหรับ SME ที่ต้องการปิดการขายเร็ว",
        ctaText: "คุยกับร้านผ่าน LINE",
        ctaUrl: "",
        imageUrl: "",
      },
      products: [
        {
          id: "product-1",
          name: "สินค้าเด่นประจำสัปดาห์",
          price: "890",
          imageUrl: "",
          url: "",
          shortDesc: "ขายดีสุดในหมวดนี้",
          tags: ["best-seller"],
        },
        {
          id: "product-2",
          name: "สินค้าขายดี",
          price: "1290",
          imageUrl: "",
          url: "",
          shortDesc: "โปรโมชันพิเศษสำหรับลูกค้า LINE",
          tags: ["promo"],
        },
      ],
      sections: {
        highlights: [
          "สินค้าใหม่อัปเดตทุกสัปดาห์",
          "ตอบกลับไวผ่าน LINE OA",
          "จัดส่งภายใน 24 ชั่วโมง",
        ],
        trust: [
          "ยืนยันตัวตนด้วย LINE",
          "เก็บข้อมูลตามมาตรฐาน PDPA",
          "บันทึก RoPA ทุกการยินยอม",
        ],
        gallery: [],
      },
      pdpa: {
        showBanner: true,
        policyVersion: "v1",
      },
      payment: {
        promptpayId: "",
      },
    },
  },
  {
    id: "clinic",
    name: "Clinic",
    description: "เหมาะกับคลินิกที่ต้องการระบบนัดหมายผ่าน LINE",
    config: {
      version: "v2",
      templateId: "clinic",
      business: {
        name: "ConnectBridge Clinic",
        tagline: "คลินิกทันสมัยพร้อมระบบนัดหมาย",
        themeColor: "#0f766e",
        address: "123 ถนนสุขุมวิท กรุงเทพฯ",
        phone: "02-000-0000",
      },
      hero: {
        headline: "ดูแลสุขภาพด้วยทีมแพทย์ผู้เชี่ยวชาญ",
        subheadline: "นัดหมายง่ายผ่าน LINE พร้อมแจ้งเตือนคิวอัตโนมัติ",
        ctaText: "นัดหมายผ่าน LINE",
        ctaUrl: "",
        imageUrl: "",
      },
      products: [
        {
          id: "product-1",
          name: "ตรวจสุขภาพฟันเบื้องต้น",
          price: "1200",
          imageUrl: "",
          url: "",
          shortDesc: "ตรวจ-วิเคราะห์โดยทันตแพทย์",
          tags: ["appointment"],
        },
        {
          id: "product-2",
          name: "ขูดหินปูน + เคลือบฟลูออไรด์",
          price: "1800",
          imageUrl: "",
          url: "",
          shortDesc: "ลดอาการเสียวฟัน พร้อมคำแนะนำดูแล",
          tags: ["clinic-care"],
        },
      ],
      sections: {
        highlights: [
          "จองคิวออนไลน์ผ่าน LINE ได้ทันที",
          "ยืนยันตัวตน + แจ้งเตือนนัดหมายอัตโนมัติ",
          "บริการมาตรฐานคลินิก พร้อมทีมแพทย์ดูแล",
        ],
        trust: [
          "ดูแลข้อมูลตาม PDPA",
          "บันทึก RoPA ทุกการยินยอม",
          "มาตรฐานความปลอดภัยระดับคลินิก",
        ],
        gallery: [],
      },
      pdpa: {
        showBanner: true,
        policyVersion: "v1",
      },
      payment: {
        promptpayId: "",
      },
    },
  },
];

const createProduct = () => ({
  id: `product-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  price: "",
  imageUrl: "",
  url: "",
  shortDesc: "",
  tags: [] as string[],
  stock: undefined as number | undefined,
});

const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const toTextarea = (lines?: string[]) => (lines || []).join("\n");

const normalizeTemplateId = (
  value?: string
): SiteConfigV2["templateId"] => {
  if (value === "apple-commerce") return "clinic";
  if (value === "apple-minimal") return "standard";
  if (value === "clinic") return "clinic";
  return "standard";
};

const toV2Config = (
  input: SiteConfig,
  storeName?: string,
  fallbackTemplateId: SiteConfigV2["templateId"] = "standard"
): SiteConfigV2 => {
  if ((input as SiteConfigV2).version === "v2") {
    const v2 = input as SiteConfigV2;
    return {
      ...v2,
      templateId: normalizeTemplateId(v2.templateId),
    };
  }

  const legacy = input as any;
  const businessName = legacy.businessName || storeName || "ConnectBridge Store";

  return {
    version: "v2",
    templateId: normalizeTemplateId(fallbackTemplateId),
    business: {
      name: businessName,
      tagline: legacy.tagline || "",
      themeColor: legacy.themeColor || "#111827",
      address: legacy.address || "",
      phone: legacy.phone || "",
    },
    hero: {
      headline: legacy.heroHeadline || `ยินดีต้อนรับสู่ ${businessName}`,
      subheadline:
        legacy.heroSubheadline ||
        "เว็บไซต์หน้าร้านที่เชื่อมต่อกับ LINE OA ของคุณ",
      ctaText: legacy.ctaText || "ติดต่อผ่าน LINE",
      ctaUrl: legacy.ctaUrl || "",
      imageUrl: legacy.heroImageUrl || "",
    },
    products: (legacy.offerings || []).map((item: string, idx: number) => ({
      id: `legacy-${idx}`,
      name: item,
      price: "",
      imageUrl: "",
      url: "",
      shortDesc: legacy.highlights?.[idx] || "",
      tags: [],
    })),
    sections: {
      highlights: legacy.highlights || [],
      trust: [],
      gallery: legacy.gallery || [],
    },
    pdpa: {
      showBanner: true,
      policyVersion: "v1",
    },
    payment: {
      promptpayId: legacy.payment?.promptpayId || "",
    },
  };
};

export default function WebBuilder() {
  const navigate = useNavigate();
  const { store } = useStore();
  const storeId = store?.id || "";

  const [activeTemplateId, setActiveTemplateId] = useState(templates[0].id);
  const [config, setConfig] = useState<SiteConfigV2>(templates[0].config);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lineOaUrl, setLineOaUrl] = useState<string>("");
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement | null>(null);
  const maxImageBytes = 1024 * 1024;
  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeTemplateId) || templates[0],
    [activeTemplateId]
  );

  const applyTemplate = (templateId: SiteConfigV2["templateId"]) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setActiveTemplateId(templateId);
    setConfig({
      ...template.config,
      business: {
        ...template.config.business,
        name: store?.name || template.config.business.name,
      },
    });
  };

  const loadConfig = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res: any = await authedJson(`/sites?storeId=${storeId}`);
      const draftConfig = res?.draft?.config as SiteConfig | undefined;
      const published = res?.published;
      const oa = await getLineOaLink(storeId);

      if (draftConfig) {
        const v2 = toV2Config(
          draftConfig,
          store?.name,
          activeTemplateId
        );
        const resolvedTemplateId = normalizeTemplateId(v2.templateId);
        setConfig(v2);
        setActiveTemplateId(resolvedTemplateId);
      } else {
        applyTemplate(activeTemplateId);
      }

      if (oa?.lineOaUrl) {
        setLineOaUrl(oa.lineOaUrl);
        setConfig((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            ctaUrl: prev.hero.ctaUrl || oa.lineOaUrl,
          },
        }));
      }

      if (published?.slug) {
        setPublishedUrl(`${window.location.origin}/public/${published.slug}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "โหลดข้อมูลเว็บไซต์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [storeId]);

  const handleSaveDraft = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await authedJson("/sites/draft", {
        method: "PUT",
        body: JSON.stringify({
          storeId,
          config: {
            ...config,
            templateId: activeTemplateId,
          },
        }),
      });
      toast.success("บันทึกแบบร่างแล้ว");
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storeId) return;
    setPublishing(true);
    try {
      await authedJson("/sites/draft", {
        method: "PUT",
        body: JSON.stringify({
          storeId,
          config: {
            ...config,
            templateId: activeTemplateId,
          },
        }),
      });

      const res: any = await authedJson("/sites/publish", {
        method: "POST",
        body: JSON.stringify({ storeId }),
      });

      if (res?.slug) {
        setPublishedUrl(`${window.location.origin}/public/${res.slug}`);
      }

      toast.success("เผยแพร่เว็บไซต์แล้ว");
      await loadConfig();
    } catch (err: any) {
      toast.error(err?.message || "เผยแพร่ไม่สำเร็จ");
    } finally {
      setPublishing(false);
    }
  };

  const updateBusiness = (key: keyof SiteConfigV2["business"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      business: {
        ...prev.business,
        [key]: value,
      },
    }));
  };

  const updateHero = (key: keyof SiteConfigV2["hero"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value,
      },
    }));
  };

  const updatePayment = (key: "promptpayId", value: string) => {
    setConfig((prev) => ({
      ...prev,
      payment: {
        ...(prev.payment || {}),
        [key]: value,
      },
    }));
  };

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

  const updateSections = (
    key: keyof NonNullable<SiteConfigV2["sections"]>,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: toLines(value),
      },
    }));
  };

  const updateProduct = (
    index: number,
    key: keyof SiteConfigV2["products"][number],
    value: string | number | undefined
  ) => {
    setConfig((prev) => {
      const next = [...prev.products];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, products: next };
    });
  };

  const addProduct = () => {
    setConfig((prev) => ({
      ...prev,
      products: [...prev.products, createProduct()],
    }));
  };

  const compressImageIfNeeded = async (file: File) => {
    if (file.size <= maxImageBytes) return file;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("อ่านรูปไม่สำเร็จ"));
      img.src = URL.createObjectURL(file);
    });

    const canvas = document.createElement("canvas");
    const maxDimension = 1400;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("สร้าง canvas ไม่สำเร็จ");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(image.src);

    let quality = 0.85;
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    while (blob && blob.size > maxImageBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
    }

    if (!blob) throw new Error("แปลงรูปไม่สำเร็จ");
    if (blob.size > maxImageBytes) {
      throw new Error("ไฟล์ยังใหญ่เกิน 1MB หลังย่อ");
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const fileToBase64 = async (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Invalid file"));
          return;
        }
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      reader.readAsDataURL(file);
    });

  const handleProductImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const index = uploadingImageIndex;
    event.target.value = "";

    if (!file || index === null || !storeId) {
      setUploadingImageIndex(null);
      return;
    }

    try {
      setUploadingImageIndex(index);
      const processedFile = await compressImageIfNeeded(file);
      const dataBase64 = await fileToBase64(processedFile);

      const res: any = await uploadLineImage({
        storeId,
        fileName: processedFile.name,
        contentType: processedFile.type || "image/jpeg",
        dataBase64,
      });
      const url = res?.data?.url;
      if (!url) throw new Error("ไม่พบ URL รูป");
      updateProduct(index, "imageUrl", url);
      toast.success("อัปโหลดรูปสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleProductImagePick = (index: number) => {
    setUploadingImageIndex(index);
    fileInputRef.current?.click();
  };

  const handleHeroImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !storeId) {
      setUploadingHeroImage(false);
      return;
    }

    try {
      setUploadingHeroImage(true);
      const processedFile = await compressImageIfNeeded(file);
      const dataBase64 = await fileToBase64(processedFile);
      const res: any = await uploadLineImage({
        storeId,
        fileName: processedFile.name,
        contentType: processedFile.type || "image/jpeg",
        dataBase64,
      });
      const url = res?.data?.url;
      if (!url) throw new Error("ไม่พบ URL รูป");
      updateHero("imageUrl", url);
      toast.success("อัปโหลด Hero สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message || "อัปโหลด Hero ไม่สำเร็จ");
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const removeProduct = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== index),
    }));
  };

  if (!store) {
    return <div className="p-8 text-center">กรุณาเลือกร้านค้า</div>;
  }

  return (
    <div className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProductImageUpload}
      />
      <input
        ref={heroFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleHeroImageUpload}
      />
      <div className="rounded-3xl border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white px-6 py-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-white/60">
              Website Builder
            </div>
            <h1 className="text-3xl font-bold mt-2">ออกแบบหน้าร้านของคุณ</h1>
            <p className="text-sm text-white/70 mt-1">
              ร้านค้า: {store.name || store.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/settings/store")}
              className="bg-white text-slate-900 border-white hover:bg-slate-100"
            >
              เชื่อมต่อ LINE OA
            </Button>
            <Button onClick={handleSaveDraft} disabled={saving || loading}>
              {saving ? "กำลังบันทึก..." : "บันทึกแบบร่าง"}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePublish}
              disabled={publishing || loading}
            >
              {publishing ? "กำลังเผยแพร่..." : "เผยแพร่"}
            </Button>
          </div>
        </div>
        {publishedUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-emerald-200">
            <span className="font-semibold text-emerald-100">Public URL:</span>
            <span className="truncate max-w-[520px]">{publishedUrl}</span>
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-200 text-emerald-900 bg-emerald-100 hover:bg-emerald-50"
              onClick={() => copyText("ลิงก์เว็บไซต์", publishedUrl)}
            >
              คัดลอก
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-100 hover:text-white"
              onClick={() => window.open(publishedUrl, "_blank")}
            >
              เปิด
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>เลือกเทมเพลต</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    activeTemplateId === template.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.description}
                      </div>
                    </div>
                    {activeTemplateId === template.id && (
                      <Badge className="bg-emerald-500">ใช้งานอยู่</Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>ข้อมูลร้านค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ชื่อร้าน
                </label>
                <Input
                  value={config.business.name}
                  onChange={(e) => updateBusiness("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tagline
                </label>
                <Input
                  value={config.business.tagline || ""}
                  onChange={(e) => updateBusiness("tagline", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Theme Color
                  </label>
                  <Input
                    value={config.business.themeColor}
                    onChange={(e) => updateBusiness("themeColor", e.target.value)}
                    placeholder="#111827"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    LINE OA Link
                  </label>
                  <Input
                    value={config.hero.ctaUrl || lineOaUrl}
                    onChange={(e) => updateHero("ctaUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    ที่อยู่ร้าน
                  </label>
                  <Input
                    value={config.business.address || ""}
                    onChange={(e) => updateBusiness("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    เบอร์ติดต่อ
                  </label>
                  <Input
                    value={config.business.phone || ""}
                    onChange={(e) => updateBusiness("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  PromptPay ID
                </label>
                <Input
                  value={config.payment?.promptpayId || ""}
                  onChange={(e) => updatePayment("promptpayId", e.target.value)}
                  placeholder="เบอร์มือถือ / เลขบัตร / เลขผู้เสียภาษี"
                />
                <p className="text-xs text-gray-500">
                  ใช้สร้าง QR PromptPay สำหรับชำระเงินในหน้าร้าน
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Headline
                </label>
                <Input
                  value={config.hero.headline}
                  onChange={(e) => updateHero("headline", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Subheadline
                </label>
                <Textarea
                  value={config.hero.subheadline}
                  onChange={(e) => updateHero("subheadline", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    CTA Text
                  </label>
                  <Input
                    value={config.hero.ctaText}
                    onChange={(e) => updateHero("ctaText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    CTA URL
                  </label>
                  <Input
                    value={config.hero.ctaUrl || lineOaUrl}
                    onChange={(e) => updateHero("ctaUrl", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Hero Image URL
                </label>
                <Input
                  value={config.hero.imageUrl || ""}
                  onChange={(e) => updateHero("imageUrl", e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHeroImage}
                  >
                    {uploadingHeroImage ? "กำลังอัปโหลด..." : "อัปโหลดจากเครื่อง"}
                  </Button>
                  <span className="text-[11px] text-gray-400">
                    ไฟล์จะถูกย่อให้ต่ำกว่า 1MB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>สินค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.products.map((product, index) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">
                      สินค้า #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-xs text-red-500"
                    >
                      ลบ
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">ชื่อสินค้า</label>
                    <Input
                      value={product.name}
                      onChange={(e) =>
                        updateProduct(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">ราคา</label>
                      <Input
                        value={product.price || ""}
                        onChange={(e) =>
                          updateProduct(index, "price", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">สต็อก</label>
                      <Input
                        type="number"
                        value={product.stock ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateProduct(
                            index,
                            "stock",
                            value ? Number(value) : undefined
                          );
                        }}
                        placeholder="ปล่อยว่าง = ไม่จำกัด"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">ลิงก์สินค้า</label>
                    <Input
                      value={product.url || ""}
                      onChange={(e) =>
                        updateProduct(index, "url", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">รูปสินค้า</label>
                      <Input
                        value={product.imageUrl || ""}
                        onChange={(e) =>
                          updateProduct(index, "imageUrl", e.target.value)
                        }
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleProductImagePick(index)}
                          disabled={uploadingImageIndex === index}
                        >
                          {uploadingImageIndex === index ? "กำลังอัปโหลด..." : "แนบรูปจากเครื่อง"}
                        </Button>
                        <span className="text-[11px] text-gray-400">ไฟล์จะถูกย่อให้ต่ำกว่า 1MB</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">คำอธิบายสั้น</label>
                      <Input
                        value={product.shortDesc || ""}
                        onChange={(e) =>
                          updateProduct(index, "shortDesc", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addProduct}>
                เพิ่มสินค้า
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Trust / PDPA / Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Highlights (ขึ้นบรรทัดใหม่)
                </label>
                <Textarea
                  value={toTextarea(config.sections?.highlights)}
                  onChange={(e) => updateSections("highlights", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Trust / PDPA (ขึ้นบรรทัดใหม่)
                </label>
                <Textarea
                  value={toTextarea(config.sections?.trust)}
                  onChange={(e) => updateSections("trust", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Gallery URLs (ขึ้นบรรทัดใหม่)
                </label>
                <Textarea
                  value={toTextarea(config.sections?.gallery)}
                  onChange={(e) => updateSections("gallery", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Preview (Mobile-first)</CardTitle>
            </CardHeader>
            <CardContent>
              <SitePreview config={config} businessNameFallback={store.name} renderMode="builder" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>สถานะการเชื่อมต่อ LINE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <div>LINE OA URL: {lineOaUrl || "ยังไม่พบ"}</div>
              <div>เทมเพลต: {activeTemplate.name}</div>
              <div>สถานะ: {loading ? "กำลังโหลด" : "พร้อมใช้งาน"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
