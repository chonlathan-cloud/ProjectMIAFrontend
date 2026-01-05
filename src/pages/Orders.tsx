import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrders, updateOrderStatus, type OrderRecord } from "@/lib/api";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  "awaiting_payment",
  "pending_review",
  "paid",
  "shipped",
  "refunded",
  "cancelled",
] as const;

const statusLabel = (status: string) => {
  switch (status) {
    case "awaiting_payment":
      return "รอโอน";
    case "pending_review":
      return "รอตรวจสอบ";
    case "paid":
      return "ชำระแล้ว";
    case "shipped":
      return "จัดส่งแล้ว";
    case "refunded":
      return "คืนเงิน";
    case "cancelled":
      return "ยกเลิก";
    default:
      return status;
  }
};

const statusTone = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "pending_review":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "awaiting_payment":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "shipped":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "refunded":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function Orders() {
  const { store } = useStore();
  const storeId = store?.id || "";
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res: any = await getOrders(storeId, statusFilter || undefined);
      const list = (res?.data?.orders || res?.orders || []) as OrderRecord[];
      setOrders(list);
    } catch (err: any) {
      toast.error(err?.message || "โหลดคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [storeId, statusFilter]);

  const totalSales = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total || 0), 0),
    [orders]
  );

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!storeId) return;
    try {
      await updateOrderStatus(storeId, orderId, status);
      toast.success("อัปเดตสถานะแล้ว");
      await loadOrders();
    } catch (err: any) {
      toast.error(err?.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  if (!storeId) {
    return <div className="p-8 text-center">กรุณาเลือกร้านค้า</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">คำสั่งซื้อ</h1>
          <p className="text-sm text-gray-500">ร้านค้า: {store?.name || storeId}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            {loading ? "กำลังโหลด..." : "รีเฟรช"}
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>ภาพรวม</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs text-gray-500">จำนวนคำสั่งซื้อ</div>
            <div className="text-2xl font-semibold">{orders.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs text-gray-500">ยอดรวม</div>
            <div className="text-2xl font-semibold">
              ฿{totalSales.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs text-gray-500">สถานะล่าสุด</div>
            <div className="text-sm text-gray-700">
              {orders[0]?.status ? statusLabel(orders[0].status) : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            ยังไม่มีคำสั่งซื้อ
          </div>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <div className="text-xs text-gray-500">
                  {order.customer?.name || "ไม่ระบุชื่อ"} · {order.customer?.phone || "-"}
                </div>
              </div>
              <Badge className={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={`${order.id}-${item.id}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      {item.name} × {item.qty}
                    </div>
                    <div>฿{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>ยอดรวม</span>
                <span>฿{(order.total || 0).toLocaleString()}</span>
              </div>
              {order.payment?.slipUrl && (
                <a
                  href={order.payment.slipUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 underline"
                >
                  ดูสลิปที่ลูกค้าอัปโหลด
                </a>
              )}
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={`${order.id}-${status}`}
                    variant={order.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus(order.id, status)}
                  >
                    {statusLabel(status)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
