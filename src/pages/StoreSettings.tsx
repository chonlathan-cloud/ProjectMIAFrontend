// src/pages/StoreSettings.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { getLineCredentials, saveLineCredentials } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

/* =======================
   Page
======================= */

export default function StoreSettings() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const {
    store,
    setActiveStoreById,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* -----------------------
     form state
  ----------------------- */
  const [formData, setFormData] = useState({
    channelAccessToken: "",
    channelSecret: "",
    lineUserId: "",
    displayName: "",
  });

  /* -----------------------
     guard: ต้องมี storeId
  ----------------------- */
  if (!storeId) {
    return <Navigate to="/dashboard" replace />;
  }

  /* -----------------------
     sync URL storeId -> state
  ----------------------- */
  useEffect(() => {
    if (storeId && store?.id !== storeId) {
      setActiveStoreById(storeId);
    }
  }, [storeId, store?.id, setActiveStoreById]);

  /* -----------------------
     load existing settings
  ----------------------- */
useEffect(() => {
  if (!storeId) return; // guard ตั้งแต่ต้น

  async function load() {
    try {
      setLoading(true);
      const res: any = await getLineCredentials(storeId as string);
      if (res?.settings) {
        setFormData((prev) => ({
          ...prev,
          ...res.settings,
        }));
      }
    } catch (err) {
      console.warn("Load LINE credentials failed", err);
      toast.error("โหลดข้อมูล LINE OA ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  load();
}, [storeId]);


  /* -----------------------
     save & next
  ----------------------- */
  const handleSaveAndNext = async () => {
    if (!formData.channelAccessToken) {
      alert("กรุณากรอก Channel Access Token");
      return;
    }

    setSaving(true);
    try {
      const res: any = await saveLineCredentials(storeId, formData);
      if (res?.success) {
        // 👉 ไป step ถัดไปของร้านเดียวกัน
        navigate(`/t/${storeId}/website`);
      }
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบ Token");
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------
     render
  ----------------------- */

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      {/* --- Wizard Progress --- */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Step 1: สมัครสมาชิก</span>
          <span className="text-black font-bold">
            Step 2: เชื่อมต่อ LINE OA
          </span>
          <span>Step 3: สร้างเว็บไซต์</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="w-1/3 bg-emerald-500 h-full" />
          <div className="w-1/3 bg-emerald-500 h-full animate-pulse" />
          <div className="w-1/3 bg-gray-200 h-full" />
        </div>
      </div>

      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-emerald-500">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
              <ShieldCheck size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">
                เชื่อมต่อ LINE Official Account
              </CardTitle>
              <CardDescription>
                ร้าน:{" "}
                <span className="font-medium text-black">
                  {store?.name || storeId}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Token */}
          <div className="space-y-2">
            <Label>Channel Access Token (Long-lived)</Label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-emerald-500 outline-none"
              placeholder="วาง Access Token ที่นี่..."
              value={formData.channelAccessToken}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  channelAccessToken: e.target.value,
                })
              }
            />
            <p className="text-xs text-gray-400">
              * จาก LINE Developers Console &gt; Messaging API
            </p>
          </div>

          {/* Secret */}
          <div className="space-y-2">
            <Label>Channel Secret</Label>
            <Input
              type="password"
              placeholder="Channel Secret"
              value={formData.channelSecret}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  channelSecret: e.target.value,
                })
              }
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex items-center justify-between">
            <button
              className="text-sm text-gray-500 hover:underline"
              onClick={() =>
                window.open("https://developers.line.biz", "_blank")
              }
            >
              วิธีหา Token?
            </button>

            <Button
              size="lg"
              className="bg-black hover:bg-gray-800 text-white gap-2 px-8"
              onClick={handleSaveAndNext}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  บันทึก & ไปต่อ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-gray-400 max-w-md">
        ระบบจะตรวจสอบ Token และผูก LINE OA กับร้านนี้โดยเฉพาะ
        <br />
        ร้านอื่นจะไม่กระทบกัน
      </p>
    </div>
  );
}
