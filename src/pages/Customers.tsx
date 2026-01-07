import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { getInboxCustomers, updateCustomerAdmin } from '@/lib/api';
import { RefreshCw, Users } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

export function Customers() {
  const { store } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminUpdating, setAdminUpdating] = useState<Record<string, boolean>>({});

  const loadCustomers = async () => {
    if (!store?.id) return;
    setLoading(true);
    setError('');
    try {
      const res: any = await getInboxCustomers(store.id);
      const normalized = (res?.customers || []).map((c: any) => ({
        id: c.userId || c.id,
        userId: c.userId || c.id,
        displayName: c.displayName || 'ลูกค้าใหม่',
        pictureUrl: c.pictureUrl || undefined,
        lastMessage: c.lastMessage || '',
        lastTime: c.lastTime || c.lastActivity || null,
        pdpaConsentAccepted: !!c.pdpaConsentAccepted,
        isAdmin: !!c.isAdmin,
        lastEventType: c.lastEventType || null,
        hasMessaged: !!c.hasMessaged,
      }));
      setCustomers(normalized);
    } catch (err: any) {
      console.error('Load customers failed', err);
      setError(err?.message || 'โหลดรายชื่อลูกค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [store?.id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => {
      const haystack = [
        customer.displayName,
        customer.userId,
        customer.lastMessage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [customers, query]);

  const handleToggleAdmin = async (customer: Customer, next: boolean) => {
    if (!store?.id) return;
    setAdminUpdating((prev) => ({ ...prev, [customer.id]: true }));
    try {
      await updateCustomerAdmin(store.id, customer.id, next);
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id ? { ...item, isAdmin: next } : item
        )
      );
      toast.success(next ? 'เปิดสิทธิ์ admin แล้ว' : 'ปิดสิทธิ์ admin แล้ว');
    } catch (err: any) {
      toast.error(err?.message || 'อัปเดตสิทธิ์ไม่สำเร็จ');
    } finally {
      setAdminUpdating((prev) => ({ ...prev, [customer.id]: false }));
    }
  };

  if (!store) return <div className="p-10 text-center">กรุณาเลือกร้านค้า</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ลูกค้า</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            รายชื่อลูกค้าจาก Inbox เพื่อใช้ติดตามและสื่อสารแบบเจาะจง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อ, LINE ID, หรือข้อความล่าสุด"
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={loadCustomers} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>รายชื่อลูกค้า</CardTitle>
              <CardDescription>ดึงข้อมูลล่าสุดจาก /api/inbox/customers</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Badge variant="outline">ทั้งหมด {customers.length}</Badge>
              <Badge variant="outline">
                PDPA OK {customers.filter((c) => c.pdpaConsentAccepted).length}
              </Badge>
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl p-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-line/10 text-line flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">กำลังโหลดรายชื่อลูกค้า...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl p-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-line/10 text-line flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-base text-gray-700 font-semibold">ยังไม่มีข้อมูลลูกค้า</p>
              <p className="text-sm text-gray-500 text-center">
                หากมีลูกค้าทักผ่าน LINE ข้อมูลจะเข้ามาในหน้านี้อัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                <div className="col-span-4">ลูกค้า</div>
                <div className="col-span-2">สถานะ</div>
                <div className="col-span-3">ข้อความล่าสุด</div>
                <div className="col-span-1">ล่าสุด</div>
                <div className="col-span-1 text-right">PDPA</div>
                <div className="col-span-1 text-right">Admin</div>
              </div>
              <ScrollArea className="max-h-[520px]">
                {filtered.map((customer) => (
                  <div
                    key={customer.id}
                    className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b last:border-b-0"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={customer.pictureUrl} />
                        <AvatarFallback>{customer.displayName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {customer.displayName || 'ลูกค้าใหม่'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{customer.userId}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {customer.hasMessaged ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          ทักแล้ว
                        </Badge>
                      ) : customer.lastEventType === 'follow' ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          ติดตามแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline">ยังไม่ทัก</Badge>
                      )}
                    </div>
                    <div className="col-span-3 text-sm text-gray-600 truncate">
                      {customer.lastMessage || '-'}
                    </div>
                    <div className="col-span-1 text-xs text-gray-500">
                      {formatTimestamp(customer.lastTime)}
                    </div>
                    <div className="col-span-1 text-right">
                      {customer.pdpaConsentAccepted ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Switch
                        checked={!!customer.isAdmin}
                        onCheckedChange={(next) => handleToggleAdmin(customer, next)}
                        disabled={!!adminUpdating[customer.id]}
                      />
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type Customer = {
  id: string;
  userId: string;
  displayName: string;
  pictureUrl?: string;
  lastMessage?: string;
  lastTime?: any;
  pdpaConsentAccepted?: boolean;
  isAdmin?: boolean;
  lastEventType?: string | null;
  hasMessaged?: boolean;
};

function formatTimestamp(ts: any) {
  if (!ts) return '-';
  const date = new Date(ts?._seconds ? ts._seconds * 1000 : ts);
  if (isNaN(date.getTime())) return '-';
  return format(date, 'dd MMM HH:mm', { locale: th });
}
