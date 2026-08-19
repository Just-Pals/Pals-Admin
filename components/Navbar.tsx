'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { removeAuthTokens, getUser } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
};

export default function Navbar() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    removeAuthTokens();
    router.push('/login');
  };

  return (
    <nav className="bg-surface border-b border-white/10 h-16 sticky top-0 z-30">
      <div className="h-full flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div className="text-sm text-white/60">
          {user && (
            <>
              <span className="text-white">{user.email || user.phone || 'Admin'}</span>
              {user.role && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-gold/10 text-gold">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
