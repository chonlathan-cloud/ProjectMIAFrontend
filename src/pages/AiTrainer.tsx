import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authedJson } from "@/lib/api";

type QaItem = {
  question: string;
  answer: string;
  keywordsText: string;
};

type KnowledgeDoc = {
  title?: string;
  type?: string;
  items?: QaItem[];
  content?: string;
  updatedAt?: string;
};

const QA_DOC_ID = "qa";
const ABOUT_DOC_ID = "about";

function parseKeywords(value: string): string[] {
  return value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export default function AiTrainer() {
  const { store } = useStore();
  const storeId = store?.id || "";
  const [items, setItems] = useState<QaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aboutText, setAboutText] = useState("");
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);

  const loadQa = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res: any = await authedJson(`/knowledge/${storeId}/${QA_DOC_ID}`);
      const data = res?.data as KnowledgeDoc | null;
      const nextItems = (data?.items || []).map((item: any) => ({
        question: item.question || "",
        answer: item.answer || "",
        keywordsText: Array.isArray(item.keywords) ? item.keywords.join(", ") : "",
      }));
      setItems(nextItems);
    } catch (err: any) {
      toast.error(err?.message || "โหลด Q&A ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const saveQa = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      const payloadItems = items.map((item) => ({
        question: item.question,
        answer: item.answer,
        keywords: parseKeywords(item.keywordsText),
      }));

      await authedJson(`/knowledge/${storeId}/${QA_DOC_ID}`, {
        method: "POST",
        body: JSON.stringify({
          type: "qa",
          title: "Q&A",
          items: payloadItems,
        }),
      });
      toast.success("บันทึก Q&A แล้ว");
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const loadAbout = async () => {
    if (!storeId) return;
    setAboutLoading(true);
    try {
      const res: any = await authedJson(`/knowledge/${storeId}/${ABOUT_DOC_ID}`);
      const data = res?.data as KnowledgeDoc | null;
      setAboutText(data?.content || "");
    } catch (err: any) {
      toast.error(err?.message || "โหลด About Us ไม่สำเร็จ");
    } finally {
      setAboutLoading(false);
    }
  };

  const saveAbout = async () => {
    if (!storeId) return;
    setAboutSaving(true);
    try {
      await authedJson(`/knowledge/${storeId}/${ABOUT_DOC_ID}`, {
        method: "POST",
        body: JSON.stringify({
          type: "about",
          title: "About Us",
          content: aboutText,
        }),
      });
      toast.success("บันทึก About Us แล้ว");
    } catch (err: any) {
      toast.error(err?.message || "บันทึก About Us ไม่สำเร็จ");
    } finally {
      setAboutSaving(false);
    }
  };

  useEffect(() => {
    loadQa();
    loadAbout();
  }, [storeId]);

  if (!storeId) {
    return <div className="p-8 text-center">กรุณาเลือกร้านค้า</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Trainer (Q&A)</h1>
          <p className="text-sm text-gray-500">ร้านค้า: {store?.name || storeId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadQa} disabled={loading}>
            รีเฟรช
          </Button>
          <Button onClick={saveQa} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Us (ข้อมูลร้าน)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            ใส่ข้อมูลร้านแบบย่อเพื่อให้ AI เข้าใจธุรกิจและตอบลูกค้าได้ตรงขึ้น
          </p>
          <Textarea
            rows={5}
            placeholder="เช่น ร้านก่อตั้งเมื่อ..., จุดเด่น, บริการหลัก, เวลาเปิด-ปิด"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            disabled={aboutLoading}
          />
          <div className="flex justify-end">
            <Button onClick={saveAbout} disabled={aboutSaving}>
              {aboutSaving ? "กำลังบันทึก..." : "บันทึก About Us"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มคำถาม-คำตอบ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && (
            <div className="text-sm text-gray-500">ยังไม่มี Q&A</div>
          )}

          {items.map((item, idx) => (
            <div key={`qa-${idx}`} className="grid gap-3 rounded-xl border p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_0.8fr]">
                <div>
                  <label className="text-sm font-medium">คำถาม</label>
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], question: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">คำตอบ</label>
                  <Textarea
                    rows={2}
                    value={item.answer}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], answer: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">คำค้นหา</label>
                  <Input
                    value={item.keywordsText}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = {
                        ...next[idx],
                        keywordsText: e.target.value,
                      };
                      setItems(next);
                    }}
                    placeholder="เช่น เปิดกี่โมง, ราคา, เมนู"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  ลบรายการนี้
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() =>
              setItems([...items, { question: "", answer: "", keywordsText: "" }])
            }
          >
            เพิ่ม Q&A
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
