import { useEffect, useMemo, useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { getOrders, type OrderRecord } from '@/lib/api';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, store, logout } = useStore();
  const navigate = useNavigate();
  const [orderAlerts, setOrderAlerts] = useState<OrderRecord[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const storeId = store?.id;
    if (!storeId) return;
    let mounted = true;
    const loadOrders = async () => {
      setOrderLoading(true);
      try {
        const res: any = await getOrders(storeId);
        const list = (res?.data?.orders || res?.orders || []) as OrderRecord[];
        if (!mounted) return;
        setOrderAlerts(
          list.filter((order) =>
            ['awaiting_payment', 'pending_review'].includes(order.status || '')
          )
        );
      } catch {
        if (mounted) setOrderAlerts([]);
      } finally {
        if (mounted) setOrderLoading(false);
      }
    };
    loadOrders();
    return () => {
      mounted = false;
    };
  }, [store?.id]);

  const orderCount = orderAlerts.length;
  const recentOrders = useMemo(() => orderAlerts.slice(0, 5), [orderAlerts]);

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'รอโอน';
      case 'pending_review':
        return 'รอตรวจสอบ';
      case 'paid':
        return 'ชำระแล้ว';
      default:
        return status || '-';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm text-gray-500">แดชบอร์ดธุรกิจ</p>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {user?.name ? `ยินดีต้อนรับ, ${user.name}` : 'Mia-Connect BoosteSME'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {orderCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center px-1">
                    {orderCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>แจ้งเตือนคำสั่งซื้อ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orderLoading && (
                <DropdownMenuItem disabled>กำลังโหลดคำสั่งซื้อ...</DropdownMenuItem>
              )}
              {!orderLoading && recentOrders.length === 0 && (
                <DropdownMenuItem disabled>ยังไม่มีออเดอร์ใหม่</DropdownMenuItem>
              )}
              {!orderLoading &&
                recentOrders.map((order) => (
                  <DropdownMenuItem
                    key={order.id}
                    onClick={() => navigate('/orders')}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {statusLabel(order.status)} · ฿{(order.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                ดูคำสั่งซื้อทั้งหมด
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-line text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  ตั้งค่าบัญชี
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  แพ็คเกจของฉัน
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
