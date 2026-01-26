import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublishStatus = {
  published: boolean;
  publishedAt?: string | null;
};

type PublishPanelProps = {
  storeId?: string | null;
  request: (path: string, options?: RequestInit) => Promise<any>;
  beforePublish?: () => Promise<void>;
  title?: string;
};

export default function PublishPanel({
  storeId,
  request,
  beforePublish,
  title = "เผยแพร่เว็บไซต์ E-commerce",
}: PublishPanelProps) {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const publicBase = useMemo(() => {
    const base =
      import.meta.env.VITE_PUBLIC_SITE_BASE_URL || "https://lineoa.app/s";
    return base.replace(/\/+$/, "");
  }, []);

  const publicUrl = storeId ? `${publicBase}/${storeId}` : "";

  const loadStatus = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await request(
        `/sites/publish-status?storeId=${encodeURIComponent(storeId)}`
      );
      setStatus({
        published: !!res?.published,
        publishedAt: res?.publishedAt || null,
      });
    } catch (error: any) {
      toast.error(error?.message || "โหลดสถานะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handlePublish = async () => {
    if (!storeId || publishing) return;
    setPublishing(true);
    try {
      if (beforePublish) {
        await beforePublish();
      }
      const res = await request("/sites/publish", {
        method: "POST",
        body: JSON.stringify({ storeId }),
      });
      setStatus({
        published: true,
        publishedAt: res?.publishedAt || null,
      });
      toast.success("อัปเดตเรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error?.message || "เผยแพร่ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPublishing(false);
    }
  };

  if (!storeId) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          กรุณาเลือกร้านค้าก่อน
        </CardContent>
      </Card>
    );
  }

  const isPublished = status?.published;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        {loading ? (
          <div>กำลังโหลดสถานะ...</div>
        ) : isPublished ? (
          <>
            <div className="font-semibold text-emerald-700">
              เว็บไซต์พร้อมใช้งาน
            </div>
            <div className="text-gray-600">
              ลูกค้าสามารถเข้าชมและสั่งซื้อได้แล้ว
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold text-amber-700">
              เว็บไซต์ยังไม่เผยแพร่
            </div>
            <div className="text-gray-600">ลูกค้าจะยังไม่เห็นร้านของคุณ</div>
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handlePublish}
            disabled={publishing || loading}
          >
            {publishing
              ? "กำลังอัปเดต..."
              : isPublished
                ? "อัปเดตเผยแพร่"
                : "เผยแพร่เว็บไซต์"}
          </Button>

          {isPublished && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    toast.success("คัดลอกลิงก์เว็บไซต์แล้ว");
                  } catch (error) {
                    toast.error("คัดลอกไม่สำเร็จ");
                  }
                }}
              >
                คัดลอกลิงก์
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(publicUrl, "_blank")}
              >
                เปิดเว็บไซต์
              </Button>
            </>
          )}
        </div>

        {isPublished && (
          <div className="text-xs text-gray-500 break-all">
            {publicUrl}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
