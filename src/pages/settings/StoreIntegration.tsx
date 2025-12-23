// src/pages/settings/StoreIntegration.tsx

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { getLineCredentials, listStores, saveLineCredentials } from "@/lib/api";

export default function StoreIntegration() {
  const { user, store, setStore } = useStore();

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [lineUserId, setLineUserId] = useState("");

  const [connected, setConnected] = useState(false);

  // --------------------------------------------------------------
  // STEP 1 — โหลด stores ของ user (backend auto-create store ให้แล้ว)
  // --------------------------------------------------------------
  useEffect(() => {
    async function init() {
      if (!user) return;

      try {
        const res = await listStores();
        const list = res?.data?.stores || [];

        setStores(list);

        // set store แรกเป็น default
        if (list.length > 0) {
          const s = list[0];
          setStore(s);
          setSelectedStoreId(s.id);
          await loadCredentials(s.id);
        } else {
          setStore(null);
        }
      } catch (err) {
        console.error("load stores failed:", err);
        toast.error("โหลดรายการร้านไม่สำเร็จ");
      } finally {
        setInitializing(false);
      }
    }

    init();
  }, [user, setStore]);

  // --------------------------------------------------------------
  // STEP 2 — โหลด credential เดิมจาก backend
  // --------------------------------------------------------------
  async function loadCredentials(storeId: string) {
    try {
      const res = await getLineCredentials(storeId);

      const settings = res?.settings || {};

      const line = settings || {};

      setConnected(!!line.channelAccessToken);
      setChannelAccessToken(line.channelAccessToken || "");
      setChannelSecret(line.channelSecret || "");
      setDisplayName(line.displayName || "");
      setLineUserId(line.lineUserId || "");
    } catch (err) {
      console.warn("load credentials failed:", err);
      setConnected(false);
    }
  }

  // --------------------------------------------------------------
  // STEP 3 — บันทึก Token (create/update ตาม flow)
  // --------------------------------------------------------------
  async function handleSave() {
    if (!selectedStoreId) {
      toast.error("ไม่พบ Store");
      return;
    }
    if (!channelAccessToken.trim()) {
      toast.error("กรุณากรอก Channel Access Token");
      return;
    }

    setLoading(true);

    try {
      const res = await saveLineCredentials(selectedStoreId, {
        channelAccessToken,
        channelSecret,
        lineUserId,
        displayName,
      });

      if (res?.success === false) throw new Error(res.message);

      setConnected(true);

      // sync Zustand store
      setStore({
        ...store,
        id: selectedStoreId,
        name: displayName || store?.name,
      });

      toast.success("บันทึกโทเคน LINE สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  if (initializing) return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">การเชื่อมต่อ LINE OA</h1>

      <Card>
        <CardHeader>
          <CardTitle>LINE Messaging API</CardTitle>
          <CardDescription>ผูกบัญชี LINE OA เพื่อให้ระบบทำงานครบวงจร</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          <div>
            <label className="text-sm text-gray-600">เลือกร้าน</label>
            <select
              className="w-full mt-1 p-2 border rounded"
              value={selectedStoreId}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedStoreId(id);
                await loadCredentials(id);
              }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {connected ? (
            <Badge className="bg-green-600 text-white">เชื่อมต่อแล้ว</Badge>
          ) : (
            <Badge className="bg-red-600 text-white">ยังไม่เชื่อมต่อ</Badge>
          )}

          <div>
            <label className="text-sm">Channel Access Token</label>
            <Input
              value={channelAccessToken}
              onChange={(e) => setChannelAccessToken(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Channel Secret (optional)</label>
            <Input
              value={channelSecret}
              onChange={(e) => setChannelSecret(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">LINE OA ID (เช่น channelId)</label>
            <Input
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">ชื่อแสดงในระบบ</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full bg-black text-white">
            {loading ? "กำลังบันทึก..." : "บันทึกการเชื่อมต่อ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
