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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import {
  getLineCredentials,
  listStores,
  createStore,
  saveLineCredentials,
  resetStore,
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
  const [resettingStore, setResettingStore] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

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
      navigate("/web-builder");
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

  async function handleResetStore() {
    if (!store?.id) return;
    if (resetConfirmText.trim() !== "RESET") {
      toast.error("กรุณาพิมพ์ RESET เพื่อยืนยัน");
      return;
    }

    setResettingStore(true);
    try {
      await resetStore(store.id);
      setStores([]);
      setStore(null);
      setSelectedStoreId("");
      setChannelAccessToken("");
      setChannelSecret("");
      setDisplayName("");
      setLineUserId("");
      setConnected(false);
      setResetOpen(false);
      setResetConfirmText("");
      toast.success("รีเซ็ตร้านเรียบร้อย");
    } catch (err: any) {
      toast.error(err?.message || "รีเซ็ตร้านไม่สำเร็จ");
    } finally {
      setResettingStore(false);
    }
  }

  async function handleResetAndCreate() {
    if (!newStoreName.trim()) {
      toast.error("กรุณากรอกชื่อร้าน");
      return;
    }
    if (!store?.id) {
      await handleCreateStore();
      setCreateOpen(false);
      return;
    }

    setCreatingStore(true);
    try {
      await resetStore(store.id);
      const res: any = await createStore(newStoreName.trim());
      const created = res?.data?.store || res?.store;
      if (!created?.id) throw new Error("สร้างร้านไม่สำเร็จ");
      setStores([created]);
      setStore(created);
      setSelectedStoreId(created.id);
      setNewStoreName("");
      await loadCredentials(created.id);
      setCreateOpen(false);
      toast.success("รีเซ็ตและสร้างร้านใหม่สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message || "สร้างร้านใหม่ไม่สำเร็จ");
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
                placeholder="เช่น Mia-Connect Cafe"
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
      <p className="text-sm text-gray-500">MVP นี้รองรับ 1 user ต่อ 1 ร้านเท่านั้น</p>

      <Card>
        <CardHeader>
          <CardTitle>LINE Messaging API</CardTitle>
          <CardDescription>
            ผูกบัญชี LINE OA เพื่อให้ระบบทำงานครบวงจร
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">ร้านที่ใช้งานอยู่</label>
            <div className="mt-1 rounded border px-3 py-2 text-sm text-gray-700">
              {store?.name || "ร้านของฉัน"}
            </div>
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
              readOnly={connected}
              disabled={connected}
            />
          </div>

          <div>
            <label className="text-sm">Channel Secret</label>
            <Input
              value={channelSecret}
              onChange={(e) => setChannelSecret(e.target.value)}
              readOnly={connected}
              disabled={connected}
            />
          </div>

          <div>
            <label className="text-sm">LINE OA ID</label>
            <Input
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              readOnly={connected}
              disabled={connected}
            />
          </div>

          <div>
            <label className="text-sm">ชื่อแสดงในระบบ</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              readOnly={connected}
              disabled={connected}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || connected}
            className="w-full bg-black text-white"
          >
            {connected ? "เชื่อมต่อแล้ว" : loading ? "กำลังบันทึก..." : "บันทึกการเชื่อมต่อ"}
          </Button>

          <div className="grid grid-cols-1 gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600"
              onClick={() => setResetOpen(true)}
            >
              รีเซ็ตร้าน / ลบร้านเดิม
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCreateOpen(true)}
            >
              สร้างร้านใหม่
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตร้าน (ลบข้อมูลถาวร)</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-600">
            <p>ระบบจะลบข้อมูลทั้งหมดของร้านนี้ รวมถึง LINE OA, ลูกค้า, พฤติกรรม, เว็บไซต์, และความรู้ทั้งหมด</p>
            <p className="text-red-600 font-semibold">พิมพ์คำว่า RESET เพื่อยืนยัน</p>
            <Input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-red-600 text-white"
              disabled={resettingStore}
              onClick={handleResetStore}
            >
              {resettingStore ? "กำลังรีเซ็ต..." : "ยืนยันรีเซ็ต"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างร้านใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-600">
            <p>หากมีร้านเดิม ระบบจะรีเซ็ตข้อมูลทั้งหมดก่อนสร้างร้านใหม่</p>
            <Input
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="เช่น Mia-Connect Cafe"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleResetAndCreate} disabled={creatingStore}>
              {creatingStore ? "กำลังสร้าง..." : "สร้างร้านใหม่"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
