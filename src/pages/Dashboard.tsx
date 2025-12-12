// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { authedJson } from "@/lib/api";

// ============================================================================
// Dashboard — FINAL MVP VERSION
// Single Source of Truth = Backend (Prisma)
// Flow:
// 1) Login → backend ต้องมี store อย่างน้อย 1 ร้าน
// 2) ถ้า store ยังไม่ผูก LINE → ไปตั้งค่า LINE OA
// 3) ถ้าผูกแล้ว → Dashboard พร้อมใช้งาน
// ============================================================================

export function Dashboard() {
  const navigate = useNavigate();
  const { user, store, setStore } = useStore();
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // LOAD STORE (backend = source of truth)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadStore() {
      if (!user) return;

      try {
        setLoading(true);
        const res = await authedJson("/api/stores");

        if (res?.success && res.data?.stores?.length > 0) {
          setStore(res.data.stores[0]); // MVP: ใช้ร้านแรก
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
  }, [user, setStore]);

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
        <h1 className="text-3xl font-bold">ยินดีต้อนรับสู่ LineBoost 🎉</h1>
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
  // CHECK LINE OA CONNECTION
  // ---------------------------------------------------------------------------
  const isLineConnected = Boolean(
    (store as any)?.settings?.line?.channelAccessToken
  );

  if (!isLineConnected) {
    return (
      <div className="py-10">
        <Card className="border border-gray-200 rounded-3xl max-w-2xl mx-auto">
          <CardContent className="p-8 flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-semibold">
              เชื่อมต่อ Line OA ก่อนเริ่มต้น
            </h2>
            <p className="text-gray-600">
              เพื่อเริ่มตอบลูกค้าด้วย AI, broadcast และ analytics
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 text-white mx-auto"
              onClick={() => navigate("/settings/store")}
            >
              ตั้งค่า Line OA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // READY — DASHBOARD MAIN
  // ---------------------------------------------------------------------------
  return <DashboardMainUI storeName={store.name || "ร้านของฉัน"} />;
}

// ============================================================================
// MAIN DASHBOARD UI (MVP PLACEHOLDER)
// ============================================================================
function DashboardMainUI({ storeName }: { storeName: string }) {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">{storeName}</h2>

      <Card className="p-4">
        <p className="text-gray-700">Dashboard พร้อมใช้งาน</p>
      </Card>
    </div>
  );
}
