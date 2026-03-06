'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { healthAPI, adminAPI } from '@/lib/api';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYC: number;
  verifiedKYC: number;
  rejectedKYC: number;
  totalPools: number;
  serverStatus: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYC: 0,
    verifiedKYC: 0,
    rejectedKYC: 0,
    totalPools: 0,
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
      let serverStatus = 'Offline';
      try {
        const healthRes = await healthAPI.check();
        serverStatus = healthRes.data?.status === 'OK' ? 'Online' : 'Warning';
      } catch {
        serverStatus = 'Offline';
      }

      // Get admin stats
      try {
        const statsRes = await adminAPI.getStats();
        const data = statsRes.data?.data;
        if (data) {
          setStats({
            totalUsers: data.totalUsers ?? 0,
            verifiedUsers: data.verifiedUsers ?? 0,
            pendingKYC: data.pendingKyc ?? 0,
            verifiedKYC: data.verifiedKyc ?? 0,
            rejectedKYC: data.rejectedKyc ?? 0,
            totalPools: data.totalPools ?? 0,
            serverStatus,
          });
        } else {
          setStats((prev) => ({ ...prev, serverStatus }));
        }
      } catch (error: unknown) {
        console.error('Error fetching stats:', error);
        setStats((prev) => ({ ...prev, serverStatus }));
      }
    } catch (error: unknown) {
      console.error('Error fetching stats:', error);
      setStats((prev) => ({ ...prev, serverStatus: 'Offline' }));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { title: 'Verified Users', value: stats.verifiedUsers, icon: '✅', color: 'bg-green-500' },
    { title: 'Pending KYC', value: stats.pendingKYC, icon: '⏳', color: 'bg-yellow-500' },
    { title: 'Verified KYC', value: stats.verifiedKYC, icon: '🎉', color: 'bg-purple-500' },
    { title: 'Rejected KYC', value: stats.rejectedKYC, icon: '❌', color: 'bg-red-500' },
    { title: 'Total Pools', value: stats.totalPools, icon: '🏊', color: 'bg-indigo-500' },
    { title: 'Server Status', value: stats.serverStatus, icon: '🖥️', color: stats.serverStatus === 'Online' ? 'bg-green-500' : 'bg-red-500' },
  ];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </div>
    </PageLayout>
  );
}


