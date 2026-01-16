'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              PALS Admin
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/users"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/users')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Users
            </Link>
            <Link
              href="/kyc"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/kyc')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              KYC
            </Link>
            <Link
              href="/auth"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/auth')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Auth Testing
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

