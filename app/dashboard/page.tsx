'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { healthAPI, userAPI } from '@/lib/api';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYC: number;
  completedKYC: number;
  serverStatus: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYC: 0,
    completedKYC: 0,
    serverStatus: 'checking...',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Check server health
      const healthRes = await healthAPI.check();
      const serverStatus = healthRes.data.status === 'OK' ? 'Online' : 'Warning';

      // Get all users
      try {
        const usersRes = await userAPI.getAllUsers();
        const users = usersRes.data.data?.users || [];
        
        const totalUsers = users.length;
        const verifiedUsers = users.filter((u: any) => u.isVerified).length;
        const pendingKYC = users.filter((u: any) => u.kycStatus === 'pending').length;
        const completedKYC = users.filter((u: any) => u.kycStatus === 'completed').length;

        setStats({
          totalUsers,
          verifiedUsers,
          pendingKYC,
          completedKYC,
          serverStatus,
        });
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setStats((prev) => ({ ...prev, serverStatus }));
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStats((prev) => ({ ...prev, serverStatus: 'Offline' }));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Verified Users',
      value: stats.verifiedUsers,
      icon: '✅',
      color: 'bg-green-500',
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKYC,
      icon: '⏳',
      color: 'bg-yellow-500',
    },
    {
      title: 'Completed KYC',
      value: stats.completedKYC,
      icon: '🎉',
      color: 'bg-purple-500',
    },
    {
      title: 'Server Status',
      value: stats.serverStatus,
      icon: '🖥️',
      color: stats.serverStatus === 'Online' ? 'bg-green-500' : 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Overview of your PALS application
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {statCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-3xl">{card.icon}</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {card.title}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {card.value}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className={`${card.color} px-5 py-3`}>
                    <div className="text-sm">
                      <span className="font-medium text-white">
                        {card.title}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={fetchStats}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

