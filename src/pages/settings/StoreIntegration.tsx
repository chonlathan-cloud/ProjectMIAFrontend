// src/pages/settings/StoreIntegration.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import {
  getLineCredentials,
  listStores,
  createStore,
  saveLineCredentials,
} from "@/lib/api";

export default function StoreIntegration() {
  const {
    user,
    store,
    setStore,
    authReady,
  } = useStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);

  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [lineUserId, setLineUserId] = useState("");

  const [connected, setConnected] = useState(false);

  // --------------------------------------------------------------
  // STEP 1 — โหลด stores (รอ authReady ก่อน)
  // --------------------------------------------------------------
  useEffect(() => {
    if (!authReady || !user) return; // ✅ guard สำคัญที่สุด

    async function init() {
      try {
        const res = await listStores();
        const list = res?.data?.stores || [];

        setStores(list);

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
  }, [authReady, user, setStore]);

  // --------------------------------------------------------------
  // STEP 2 — โหลด credential เดิม
  // --------------------------------------------------------------
  async function loadCredentials(storeId: string) {
    try {
      const res = await getLineCredentials(storeId);
      const line = res?.settings || {};

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
  // STEP 3 — บันทึก Token
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
      setStore({
        ...store,
        id: selectedStoreId,
        name: displayName || store?.name,
      });

      toast.success("บันทึกโทเคน LINE สำเร็จ");
      navigate("/broadcast");
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStore() {
    if (!newStoreName.trim()) {
      toast.error("กรุณากรอกชื่อร้าน");
      return;
    }

    setCreatingStore(true);
    try {
      const res: any = await createStore(newStoreName.trim());
      const created = res?.data?.store || res?.store;
      if (!created?.id) throw new Error("สร้างร้านไม่สำเร็จ");

      const nextStores = [created, ...stores];
      setStores(nextStores);
      setStore(created);
      setSelectedStoreId(created.id);
      setNewStoreName("");
      await loadCredentials(created.id);
      toast.success("สร้างร้านสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message || "สร้างร้านไม่สำเร็จ");
    } finally {
      setCreatingStore(false);
    }
  }

  if (initializing) {
    return <p className="p-4">กำลังโหลดข้อมูลร้าน...</p>;
  }

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">การเชื่อมต่อ LINE OA</h1>
        <Card>
          <CardHeader>
            <CardTitle>สร้างร้านแรกของคุณ</CardTitle>
            <CardDescription>ยังไม่มีร้านในระบบ กรุณาสร้างก่อน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm">ชื่อร้าน</label>
              <Input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="เช่น LineBoost Cafe"
              />
            </div>
            <Button onClick={handleCreateStore} disabled={creatingStore} className="w-full bg-black text-white">
              {creatingStore ? "กำลังสร้าง..." : "สร้างร้าน"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">การเชื่อมต่อ LINE OA</h1>

      <Card>
        <CardHeader>
          <CardTitle>LINE Messaging API</CardTitle>
          <CardDescription>
            ผูกบัญชี LINE OA เพื่อให้ระบบทำงานครบวงจร
          </CardDescription>
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
            <label className="text-sm">Channel Secret</label>
            <Input
              value={channelSecret}
              onChange={(e) => setChannelSecret(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">LINE OA ID</label>
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

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-black text-white"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกการเชื่อมต่อ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
