'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { adminAPI } from '@/lib/api';

interface PoolMember {
  userId: string;
  userName: string | null;
  email: string | null;
  role: 'admin' | 'member';
  joinedAt: string;
}

interface PoolDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  isActive: boolean;
  memberCount: number;
  totalBalance: number;
  goldGrams: number;
  goldValuation: number;
  activeLoans: number;
  pendingLoanRequests: number;
  creatorName: string | null;
  createdAt: string;
  members: PoolMember[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-white/10 shadow rounded-lg p-4">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function PoolDetailPage() {
  const params = useParams();
  const poolId = params?.id as string;

  const [detail, setDetail] = useState<PoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!poolId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPoolDetail(poolId);
      setDetail(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch pool detail');
      console.error('Error fetching pool detail:', err);
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <Link href="/pools" className="text-sm text-gold hover:text-gold-dark">
            ← Back to Pools
          </Link>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading pool...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mt-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : detail ? (
            <>
              <div className="mt-4 mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{detail.name}</h1>
                  <p className="mt-1 text-sm text-white/60">
                    {detail.description || 'No description'} • by {detail.creatorName || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!detail.isActive && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/70">
                      Inactive
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-violet/15 text-violet">
                    {detail.type}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/70">
                    {detail.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Members" value={detail.memberCount.toString()} />
                <StatCard label="Balance" value={formatCurrency(detail.totalBalance)} />
                <StatCard label="Gold" value={`${detail.goldGrams}g`} />
                <StatCard label="Gold value" value={formatCurrency(detail.goldValuation)} />
                <StatCard label="Active loans" value={detail.activeLoans.toString()} />
                <StatCard label="Pending requests" value={detail.pendingLoanRequests.toString()} />
              </div>

              <div className="bg-surface border border-white/10 shadow rounded-lg p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Members ({detail.members.length})</h2>
                {detail.members.length === 0 ? (
                  <p className="text-sm text-white/50">No active members</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {detail.members.map((member) => (
                      <li key={member.userId} className="py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{member.userName || member.userId}</span>
                          <span className="text-white/40">{member.email || 'No email'}</span>
                          {member.role === 'admin' && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-info/15 text-info">
                              admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white/40 text-xs">joined {formatDate(member.joinedAt)}</span>
                          <Link href={`/users/${member.userId}`} className="text-gold hover:text-gold-dark text-xs font-medium">
                            View user
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
