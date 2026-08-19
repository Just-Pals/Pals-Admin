'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { healthAPI, adminAPI } from '@/lib/api';

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKyc: number;
  verifiedKyc: number;
  rejectedKyc: number;
  totalPools: number;
  activeLoans: number;
  pendingLoanRequests: number;
  defaultedLoans: number;
  activeSosAlerts: number;
  totalWalletBalance: number;
  goldReserveBalanced: boolean;
}

interface StatCardDef {
  title: string;
  value: string;
  icon: string;
  color: string;
  href?: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [serverStatus, setServerStatus] = useState('checking...');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      let status = 'Offline';
      try {
        const healthRes = await healthAPI.check();
        status = healthRes.data?.status === 'OK' ? 'Online' : 'Warning';
      } catch {
        status = 'Offline';
      }
      setServerStatus(status);

      try {
        const statsRes = await adminAPI.getStats();
        setStats(statsRes.data?.data || null);
      } catch (error: unknown) {
        console.error('Error fetching stats:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards: StatCardDef[] = stats
    ? [
        { title: 'Total Users', value: stats.totalUsers.toString(), icon: '👥', color: 'bg-info', href: '/users' },
        { title: 'Verified Users', value: stats.verifiedUsers.toString(), icon: '✅', color: 'bg-success', href: '/users' },
        { title: 'Pending KYC', value: stats.pendingKyc.toString(), icon: '⏳', color: 'bg-gold', href: '/kyc' },
        { title: 'Verified KYC', value: stats.verifiedKyc.toString(), icon: '🎉', color: 'bg-violet', href: '/kyc' },
        { title: 'Rejected KYC', value: stats.rejectedKyc.toString(), icon: '❌', color: 'bg-danger', href: '/kyc' },
        { title: 'Total Pools', value: stats.totalPools.toString(), icon: '🏊', color: 'bg-info', href: '/pools' },
        { title: 'Active Loans', value: stats.activeLoans.toString(), icon: '💰', color: 'bg-info', href: '/loans' },
        {
          title: 'Pending Loan Votes',
          value: stats.pendingLoanRequests.toString(),
          icon: '🗳️',
          color: 'bg-gold',
          href: '/loans',
        },
        {
          title: 'Defaulted Loans',
          value: stats.defaultedLoans.toString(),
          icon: '⚠️',
          color: stats.defaultedLoans > 0 ? 'bg-danger' : 'bg-white/20',
          href: '/loans',
        },
        {
          title: 'Active SOS Alerts',
          value: stats.activeSosAlerts.toString(),
          icon: '🆘',
          color: stats.activeSosAlerts > 0 ? 'bg-danger' : 'bg-white/20',
          href: '/sos',
        },
        {
          title: 'Platform Wallet Balance',
          value: formatCurrency(stats.totalWalletBalance),
          icon: '💳',
          color: 'bg-violet',
          href: '/wallet',
        },
        {
          title: 'Gold Reserve',
          value: stats.goldReserveBalanced ? 'Balanced' : 'Mismatch',
          icon: '🪙',
          color: stats.goldReserveBalanced ? 'bg-success' : 'bg-danger',
          href: '/gold',
        },
        { title: 'Server Status', value: serverStatus, icon: '🖥️', color: serverStatus === 'Online' ? 'bg-success' : 'bg-danger' },
      ]
    : [{ title: 'Server Status', value: serverStatus, icon: '🖥️', color: serverStatus === 'Online' ? 'bg-success' : 'bg-danger' }];

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-white/60">
              Overview across users, pools, loans, safety, wallet, and gold
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {statCards.map((card, index) => {
                const content = (
                  <>
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-3xl">{card.icon}</span>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-white/50 truncate">{card.title}</dt>
                            <dd className="text-lg font-medium text-white">{card.value}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className={`${card.color} px-5 py-3`}>
                      <div className="text-sm">
                        <span className={`font-medium ${card.color === 'bg-gold' ? 'text-black' : 'text-white'}`}>
                          {card.title}
                        </span>
                      </div>
                    </div>
                  </>
                );
                const className = 'bg-surface border border-white/10 overflow-hidden shadow rounded-lg';
                return card.href ? (
                  <Link key={index} href={card.href} className={`${className} hover:border-white/20 transition-colors`}>
                    {content}
                  </Link>
                ) : (
                  <div key={index} className={className}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={fetchStats}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
