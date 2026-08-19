'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Siren,
  Waves,
  HandCoins,
  Wallet,
  Coins,
  Newspaper,
  ClipboardList,
  ShieldUser,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const menuItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'KYC', href: '/kyc', icon: ShieldCheck },
  { name: 'SOS', href: '/sos', icon: Siren },
  { name: 'Pools', href: '/pools', icon: Waves },
  { name: 'Loans', href: '/loans', icon: HandCoins },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Gold', href: '/gold', icon: Coins },
  { name: 'Blog', href: '/blog', icon: Newspaper },
  { name: 'Compliance', href: '/compliance', icon: ClipboardList },
  { name: 'Admins', href: '/admins', icon: ShieldUser },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  // startsWith (not exact match) so nested/dynamic routes like /pools/[id] and
  // /users/[id] still highlight their parent nav item.
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div
      className={`bg-surface border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed h-screen top-0 left-0 z-40 flex flex-col`}
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-gold">
            PALS Admin
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-white/10 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white/60" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="px-2 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-gold/10 text-gold'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-gold" />
                  )}
                  <Icon className="w-5 h-5 mr-3 shrink-0" strokeWidth={2} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
