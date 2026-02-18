'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeAuthTokens } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    removeAuthTokens();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b h-16 fixed top-0 right-0 left-0 z-30">
      <div className="h-full flex justify-end items-center px-4 sm:px-6 lg:px-8">
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

