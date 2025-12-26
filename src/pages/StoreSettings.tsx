// src/pages/StoreSettings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { getLineCredentials, saveLineCredentials, listStores } from "@/lib/api";

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

import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function StoreSettings() {
  const navigate = useNavigate();
  const { store, setStore } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    channelAccessToken: "",
    channelSecret: "",
    lineUserId: "",
    displayName: "",
  });

  // --------------------------------------------------
  // โหลด store + LINE credential
  // --------------------------------------------------
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // 1) โหลด store ของ user
        const res = await listStores();
        const stores = res?.data?.stores || [];

        if (!stores.length) {
          toast.error("ไม่พบร้านในระบบ");
          return;
        }

        const activeStore = stores[0];
        setStore(activeStore);

        // 2) โหลด LINE credential ของ store
        const cred = await getLineCredentials(activeStore.id);
        if (cred?.settings) {
          setFormData((prev) => ({
            ...prev,
            ...cred.settings,
          }));
        }
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลร้านไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [setStore]);

  // --------------------------------------------------
  // Save
  // --------------------------------------------------
  const handleSave = async () => {
    if (!store?.id) {
      toast.error("ไม่พบ Store");
      return;
    }

    if (!formData.channelAccessToken.trim()) {
      toast.error("กรุณากรอก Channel Access Token");
      return;
    }

    setSaving(true);
    try {
      await saveLineCredentials(store.id, formData);
      toast.success("บันทึกการเชื่อมต่อ LINE สำเร็จ");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
              <ShieldCheck size={24} />
            </div>
            <div>
              <CardTitle>เชื่อมต่อ LINE Official Account</CardTitle>
              <CardDescription>
                ร้าน: <b>{store?.name}</b>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Channel Access Token</Label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
              value={formData.channelAccessToken}
              onChange={(e) =>
                setFormData({ ...formData, channelAccessToken: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Channel Secret</Label>
            <Input
              value={formData.channelSecret}
              onChange={(e) =>
                setFormData({ ...formData, channelSecret: e.target.value })
              }
            />
          </div>

          <div>
            <Label>LINE User ID</Label>
            <Input
              value={formData.lineUserId}
              onChange={(e) =>
                setFormData({ ...formData, lineUserId: e.target.value })
              }
            />
          </div>

          <div>
            <Label>ชื่อแสดงในระบบ</Label>
            <Input
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
