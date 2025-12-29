import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authedJson, getLineOaLink } from "@/lib/api";
import SitePreview, { SiteConfig } from "@/components/site/SitePreview";

const templates: Array<{
  id: string;
  name: string;
  category: "restaurant" | "cafe" | "clinic";
  config: SiteConfig;
}> = [
  {
    id: "restaurant-classic",
    name: "ร้านอาหารคลาสสิก",
    category: "restaurant",
    config: {
      category: "restaurant",
      templateId: "restaurant-classic",
      businessName: "ร้านอาหารบ้านสวน",
      tagline: "ครัวไทยสูตรดั้งเดิม",
      heroHeadline: "อิ่มอร่อยแบบโฮมเมดทุกจาน",
      heroSubheadline: "วัตถุดิบสดใหม่ พร้อมเสิร์ฟและเดลิเวอรี่",
      heroImageUrl: "",
      ctaText: "จองโต๊ะผ่าน LINE",
      ctaUrl: "",
      themeColor: "#D94F30",
      highlights: ["เมนูซิกเนเจอร์ทุกสัปดาห์", "วัตถุดิบพรีเมียม", "ส่งด่วนใน 30 นาที"],
      offerings: ["ข้าวกะเพราเนื้อโคขุน", "ต้มยำกุ้งน้ำข้น", "แกงเขียวหวานไก่"],
      gallery: [],
      address: "123 ถนนสุขุมวิท กรุงเทพฯ",
      phone: "02-000-0000",
    },
  },
  {
    id: "cafe-minimal",
    name: "คาเฟ่มินิมอล",
    category: "cafe",
    config: {
      category: "cafe",
      templateId: "cafe-minimal",
      businessName: "LineBoost Cafe",
      tagline: "Slow bar & specialty",
      heroHeadline: "กาแฟหอมละมุนในทุกวัน",
      heroSubheadline: "คัดเมล็ดพิเศษ พร้อมขนมอบสดใหม่",
      heroImageUrl: "",
      ctaText: "สั่งเครื่องดื่มผ่าน LINE",
      ctaUrl: "",
      themeColor: "#6F4E37",
      highlights: ["เมล็ดกาแฟคัดพิเศษ", "เบเกอรี่อบใหม่ทุกวัน", "พื้นที่นั่งทำงานสบาย"],
      offerings: ["Latte Signature", "Cold Brew Citrus", "Matcha Cloud"],
      gallery: [],
      address: "88 ถนนสีลม กรุงเทพฯ",
      phone: "02-111-2222",
    },
  },
  {
    id: "clinic-clean",
    name: "คลินิกสะอาด",
    category: "clinic",
    config: {
      category: "clinic",
      templateId: "clinic-clean",
      businessName: "Smile Care Clinic",
      tagline: "ดูแลสุขภาพด้วยทีมแพทย์ผู้เชี่ยวชาญ",
      heroHeadline: "สุขภาพดีเริ่มต้นได้ที่นี่",
      heroSubheadline: "นัดหมายง่าย ดูแลครบวงจร พร้อมติดตามผล",
      heroImageUrl: "",
      ctaText: "นัดหมายผ่าน LINE",
      ctaUrl: "",
      themeColor: "#1E88E5",
      highlights: ["แพทย์เฉพาะทางประจำ", "ห้องตรวจมาตรฐาน", "แจ้งเตือนนัดหมายอัตโนมัติ"],
      offerings: ["ตรวจสุขภาพทั่วไป", "ทันตกรรม", "ผิวพรรณและความงาม"],
      gallery: [],
      address: "55 ถนนพระราม 9 กรุงเทพฯ",
      phone: "02-333-4444",
    },
  },
];

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toTextarea(lines?: string[]) {
  return (lines || []).join("\n");
}

export default function WebBuilder() {
  const navigate = useNavigate();
  const { store } = useStore();
  const storeId = store?.id || "";

  const [activeCategory, setActiveCategory] = useState<
    "restaurant" | "cafe" | "clinic"
  >("restaurant");
  const [activeTemplateId, setActiveTemplateId] = useState(templates[0].id);
  const [config, setConfig] = useState<SiteConfig>(templates[0].config);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [lineOaUrl, setLineOaUrl] = useState<string>("");

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.category === activeCategory),
    [activeCategory]
  );

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setActiveTemplateId(templateId);
    setConfig({
      ...template.config,
      businessName: store?.name || template.config.businessName,
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
        setConfig(draftConfig);
        setActiveCategory(draftConfig.category || "restaurant");
        setActiveTemplateId(draftConfig.templateId || templates[0].id);
      } else {
        applyTemplate(filteredTemplates[0]?.id || templates[0].id);
      }

      if (published?.slug) {
        setPublishedUrl(`${window.location.origin}/public/${published.slug}`);
      }

      if (oa?.lineOaUrl) {
        setLineOaUrl(oa.lineOaUrl);
        setConfig((prev) => ({
          ...prev,
          ctaUrl: prev.ctaUrl || oa.lineOaUrl,
        }));
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
            category: config.category || activeCategory,
            templateId: config.templateId || activeTemplateId,
            highlights: config.highlights || [],
            offerings: config.offerings || [],
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
            category: config.category || activeCategory,
            templateId: config.templateId || activeTemplateId,
            highlights: config.highlights || [],
            offerings: config.offerings || [],
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
    } catch (err: any) {
      toast.error(err?.message || "เผยแพร่ไม่สำเร็จ");
    } finally {
      setPublishing(false);
    }
  };

  if (!store) {
    return <div className="p-8 text-center">กรุณาเลือกร้านค้า</div>;
  }

  return (
    <div className="space-y-8">
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
      </div>

      {publishedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Public URL</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="text-sm text-gray-600 break-all">{publishedUrl}</div>
            <Button
              variant="outline"
              onClick={() => window.open(publishedUrl, "_blank")}
            >
              เปิดหน้าเว็บไซต์
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>เลือกประเภทร้าน</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(["restaurant", "cafe", "clinic"] as const).map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  onClick={() => {
                    setActiveCategory(cat);
                    const first = templates.find((t) => t.category === cat);
                    if (first) applyTemplate(first.id);
                  }}
                >
                  {cat === "restaurant" ? "ร้านอาหาร" : cat === "cafe" ? "ร้านกาแฟ" : "คลินิก"}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เลือกเทมเพลต</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className={`w-full text-left border rounded-xl p-3 transition ${
                    activeTemplateId === template.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {template.name}
                    </div>
                    {activeTemplateId === template.id && (
                      <Badge className="bg-emerald-600">เลือกอยู่</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.config.heroHeadline}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลร้าน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Hero Image URL</label>
                <Input
                  value={config.heroImageUrl || ""}
                  onChange={(e) =>
                    setConfig({ ...config, heroImageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug (ลิงก์เว็บไซต์)</label>
                <Input
                  value={config.slug || ""}
                  onChange={(e) => setConfig({ ...config, slug: e.target.value })}
                  placeholder="เช่น lineboost-cafe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ชื่อร้าน</label>
                <Input
                  value={config.businessName || ""}
                  onChange={(e) =>
                    setConfig({ ...config, businessName: e.target.value })
                  }
                  placeholder="ชื่อร้านของคุณ"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tagline</label>
                <Input
                  value={config.tagline || ""}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  placeholder="คำโปรยสั้นๆ"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Headline</label>
                <Textarea
                  value={config.heroHeadline || ""}
                  onChange={(e) =>
                    setConfig({ ...config, heroHeadline: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subheadline</label>
                <Textarea
                  value={config.heroSubheadline || ""}
                  onChange={(e) =>
                    setConfig({ ...config, heroSubheadline: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">สีธีม</label>
                <Input
                  type="color"
                  value={config.themeColor || "#16a34a"}
                  onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ปุ่ม CTA / LINE OA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">ข้อความบนปุ่ม</label>
                <Input
                  value={config.ctaText || ""}
                  onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                  placeholder="เช่น แอด LINE"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ลิงก์ LINE OA</label>
                <Input
                  value={config.ctaUrl || ""}
                  onChange={(e) => setConfig({ ...config, ctaUrl: e.target.value })}
                  placeholder="https://line.me/R/ti/p/@your-oa"
                />
              </div>
              <div className="text-xs text-gray-500">
                {lineOaUrl
                  ? `ระบบดึงลิงก์ LINE OA ให้อัตโนมัติแล้ว: ${lineOaUrl}`
                  : "หากยังไม่มีลิงก์ LINE OA ให้เชื่อมต่อก่อน แล้วค่อยเติมลิงก์"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>จุดเด่น & เมนู</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">จุดเด่น (ขึ้นบรรทัดใหม่ต่อรายการ)</label>
                <Textarea
                  value={toTextarea(config.highlights)}
                  onChange={(e) =>
                    setConfig({ ...config, highlights: toLines(e.target.value) })
                  }
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {activeCategory === "clinic" ? "บริการเด่น" : "เมนูแนะนำ"} (ขึ้นบรรทัดใหม่ต่อรายการ)
                </label>
                <Textarea
                  value={toTextarea(config.offerings)}
                  onChange={(e) =>
                    setConfig({ ...config, offerings: toLines(e.target.value) })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gallery (ใส่รูปหลายรูป)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  ใส่ URL รูป (ขึ้นบรรทัดใหม่ต่อรูป)
                </label>
                <Textarea
                  value={(config.gallery || []).join("\n")}
                  onChange={(e) =>
                    setConfig({ ...config, gallery: toLines(e.target.value) })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ติดต่อร้าน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">ที่อยู่</label>
                <Input
                  value={config.address || ""}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">เบอร์ติดต่อ</label>
                <Input
                  value={config.phone || ""}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <Button variant="outline" onClick={loadConfig} disabled={loading}>
              รีเฟรชข้อมูล
            </Button>
          </div>
          <SitePreview
            config={{ ...config, category: activeCategory }}
            businessNameFallback={store.name}
          />
        </div>
      </div>
    </div>
  );
}
