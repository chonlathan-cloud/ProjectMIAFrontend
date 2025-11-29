import { Home, Send, BarChart3, Users, Settings, TestTube2, MessageSquare, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/dashboard', icon: Home, label: 'หน้าหลัก' },
  { path: '/line-setup', icon: MessageSquare, label: 'ตั้งค่า Line OA' },
  { path: '/broadcast', icon: Send, label: 'ส่งข้อความ' },
  { path: '/analytics', icon: BarChart3, label: 'รายงานสถิติ' },
  { path: '/customers', icon: Users, label: 'ลูกค้า' },
  { path: '/ab-test', icon: TestTube2, label: 'A/B Testing' },
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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-line rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">LineBoost</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">SME Edition</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <Badge
                variant={user.tier === 'enterprise' ? 'default' : user.tier === 'growth' ? 'secondary' : 'outline'}
                className="w-full justify-center"
              >
                {user.tier === 'starter' && 'Starter'}
                {user.tier === 'growth' && 'Growth'}
                {user.tier === 'enterprise' && 'Enterprise'}
              </Badge>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-line text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2025 LineBoost SME
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
