import { Home, Send, BarChart3, Users, Settings, MessageSquare, X, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Globe } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', icon: Home, label: 'หน้าหลัก' },
  { path: '/broadcast', icon: Send, label: 'ส่งข้อความ' },
  { path: '/analytics', icon: BarChart3, label: 'รายงานสถิติ' },
  { path: "/website", icon: Globe, label: "Website" },
  { path: "/web-builder", icon: Globe, label: "Web Builder" },
  { path: "/ai-trainer", icon: MessageSquare, label: "AI Trainer" },
  { path: '/customers', icon: Users, label: 'ลูกค้า' },
  { path: '/orders', icon: ShoppingCart, label: 'คำสั่งซื้อ' },
  { path: '/inbox', icon: MessageSquare, label: 'กล่องข้อความ' },
  { path: '/settings', icon: Settings, label: 'ตั้งค่า' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useStore();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-68 bg-white/75 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/70 dark:border-gray-800/70 shadow-xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/80 dark:border-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-200/50 dark:ring-emerald-700/50 bg-white">
                <img
                  src="/image/logo_mia.jpg"
                  alt="Mia-Connect BoosteSME Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mia-Connect</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">BoosteSME</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <div className="px-6 py-4 border-b border-gray-200/80 dark:border-gray-800/80">
              <Badge
                variant={user.tier === 'enterprise' ? 'default' : user.tier === 'growth' ? 'secondary' : 'outline'}
                className="w-full justify-center text-base py-2 rounded-lg"
              >
                {user.tier === 'starter' && 'Starter'}
                {user.tier === 'growth' && 'Growth'}
                {user.tier === 'enterprise' && 'Enterprise'}
              </Badge>
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-all border border-transparent',
                    isActive
                      ? 'bg-gradient-to-r from-line to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 border-gray-200/80 dark:border-gray-800/80'
                  )}
                >
                  <span className={cn(
                    'inline-flex items-center justify-center w-10 h-10 rounded-lg',
                    isActive ? 'bg-white/15' : 'bg-gray-100/80 dark:bg-gray-800'
                  )}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-semibold tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-6 py-5 border-t border-gray-200/80 dark:border-gray-800/80">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              © 2025 Mia-Connect BoosteSME
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
