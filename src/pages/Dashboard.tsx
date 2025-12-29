// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // เพิ่ม Badge
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { getStoreStats, listStores } from "@/lib/api";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, store, setStore } = useStore();
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // LOAD STORE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadStore() {
      if (!user) return;

      try {
        setLoading(true);
        const res = await listStores();

        // เช็ค structure response ให้ดี (เผื่อ backend ส่งมาเป็น res.stores หรือ res.data.stores)
        const list = res?.data?.stores || res?.stores || [];

        if (list.length > 0) {
          const currentId = store?.id;
          const matched = currentId
            ? list.find((s: any) => s.id === currentId)
            : null;

          // เลือกร้านที่เชื่อม LINE (มี lineAccountId/botUserId) เป็นค่า default
          const connected = list.find((s: any) => s.lineAccountId);

          // ถ้ามีร้านปัจจุบันแต่ยังไม่เชื่อม ให้สลับไปตัวที่เชื่อมอัตโนมัติ
          const target =
            (matched && matched.lineAccountId ? matched : null) ||
            connected ||
            matched ||
            list[0];

          if (!store || store.id !== target.id) {
            setStore(target);
          }
        } else {
          setStore(null);
        }
      } catch (err) {
        console.error("load store failed:", err);
        setStore(null);
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [user, store?.id, setStore]);

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        กำลังโหลดข้อมูลร้าน…
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NO STORE (user ใหม่)
  // ---------------------------------------------------------------------------
  if (!store) {
    return (
      <div className="p-10 space-y-6 text-center">
        <h1 className="text-3xl font-bold">ยินดีต้อนรับสู่ Mia-Connect BoosteSME 🎉</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          กรุณาตั้งค่า Line OA เพื่อเริ่มใช้งานระบบ
        </p>

        <Button
          size="lg"
          className="bg-emerald-600 text-white"
          onClick={() => navigate("/settings/store")}
        >
          ไปตั้งค่า Line OA
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CHECK LINE OA CONNECTION (🔥 จุดที่แก้)
  // ---------------------------------------------------------------------------
  // Backend Firestore จะส่งมาใน field 'lineConfig'
  // เราเช็คทั้งแบบใหม่ (lineConfig) และแบบเก่า (settings.line) เพื่อความชัวร์
  const isLineConnected = Boolean(
    (store as any)?.lineConfig?.channelAccessToken ||      // ✅ แบบใหม่ (Firestore)
    (store as any)?.settings?.line?.channelAccessToken ||  // ⚠️ แบบเก่า (เผื่อไว้)
    (store as any)?.lineAccountId                          // ✅ หรือเช็ค ID บอท
  );

  if (!isLineConnected) {
    return (
      <div className="py-10">
        <Card className="border border-gray-200 rounded-3xl max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              เชื่อมต่อ Line OA ก่อนเริ่มต้น
            </h2>
            <p className="text-gray-600 mb-6">
              ระบบยังไม่พบการเชื่อมต่อ LINE OA ของร้าน "{store.name}" <br/>
              กรุณาตั้งค่า Token เพื่อเริ่มใช้งาน
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 text-white mx-auto"
              onClick={() => navigate("/settings/store")}
            >
              ตั้งค่า Line OA
            </Button>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // READY — DASHBOARD MAIN
  // ---------------------------------------------------------------------------
  // ส่ง storeId เข้าไปเพื่อดึง Stats
  return <DashboardMainUI storeId={store.id} storeName={store.name || "ร้านของฉัน"} />;
}

// ============================================================================
// MAIN DASHBOARD UI (Fetching Real Stats)
// ============================================================================
function DashboardMainUI({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [stats, setStats] = useState({ customers: 0, messages: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // ---------------------------------------------------------------------------
  // FETCH STATS ACTION
  // ---------------------------------------------------------------------------
  async function fetchStats() {
    try {
      setLoadingStats(true);
      // เรียก API ที่เราเพิ่งสร้างใน storeController
      const res = await getStoreStats(storeId);
      
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Fetch stats failed", error);
    } finally {
      setLoadingStats(false);
    }
  }

  // โหลดข้อมูลเมื่อ Component ถูกสร้าง
  useEffect(() => {
    fetchStats();
  }, [storeId]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{storeName}</h2>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loadingStats}>
          {loadingStats ? "กำลังอัปเดต..." : "รีเฟรชข้อมูล"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: สถานะระบบ */}
        <Card className="p-6 bg-blue-50 border-blue-100 flex flex-col justify-center">
           <div className="flex justify-between items-start">
             <h3 className="font-semibold text-blue-700">สถานะระบบ</h3>
             <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
           </div>
           <p className="text-sm text-blue-600/80 mt-2">
             เชื่อมต่อกับ LINE OA เรียบร้อยพร้อมทำงาน
           </p>
        </Card>

        {/* Card 2: ลูกค้าทั้งหมด (Real Data) */}
        <Card className="p-6">
           <h3 className="font-semibold text-gray-500">ลูกค้าทั้งหมด</h3>
           <div className="mt-2 flex items-baseline gap-2">
             <span className="text-4xl font-bold text-gray-900">
               {loadingStats ? "..." : stats.customers.toLocaleString()}
             </span>
             <span className="text-gray-500">คน</span>
           </div>
        </Card>

        {/* Card 3: ข้อความวันนี้ (Real Data) */}
        <Card className="p-6">
           <h3 className="font-semibold text-gray-500">ข้อความวันนี้</h3>
           <div className="mt-2 flex items-baseline gap-2">
             <span className="text-4xl font-bold text-gray-900">
               {loadingStats ? "..." : stats.messages.toLocaleString()}
             </span>
             <span className="text-gray-500">ครั้ง</span>
           </div>
        </Card>

      </div>
    </div>
  );
}
