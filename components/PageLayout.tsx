'use client';

import { useSidebar } from './SidebarContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Navbar />
        <main className="px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
