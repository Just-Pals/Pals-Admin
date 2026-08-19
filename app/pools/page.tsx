'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { adminAPI } from '@/lib/api';

interface PoolWithStats {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  memberCount: number;
  totalBalance: number;
  goldGrams: number;
  activeLoans: number;
  pendingLoanRequests: number;
  creatorName: string | null;
  createdAt: string;
}

const PER_PAGE = 20;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllPools({ page, perPage: PER_PAGE });
      setPools(response.data?.data?.pools || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch pools');
      console.error('Error fetching pools:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Pools</h1>
              <p className="mt-2 text-sm text-white/60">
                All pools with balance, gold, and loan activity
              </p>
            </div>
            <button
              onClick={fetchPools}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading pools...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {pools.map((pool) => (
                    <li key={pool.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-violet/20 text-violet flex items-center justify-center font-semibold text-sm">
                                {pool.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {pool.name}
                              </p>
                              <p className="text-sm text-white/50 truncate">
                                {pool.description || 'No description'}
                              </p>
                              <p className="text-xs text-white/40 mt-1">
                                Type: {pool.type} • Public: {pool.isPublic ? 'Yes' : 'No'} • Created:{' '}
                                {formatDate(pool.createdAt)}
                                {pool.activeLoans > 0 ? ` • ${pool.activeLoans} active loans` : ''}
                                {pool.pendingLoanRequests > 0 ? ` • ${pool.pendingLoanRequests} pending` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatCurrency(pool.totalBalance)}</p>
                            <p className="text-xs text-white/50">
                              {pool.memberCount} {pool.memberCount === 1 ? 'member' : 'members'} • by{' '}
                              {pool.creatorName || 'Unknown'}
                            </p>
                          </div>
                          <Link
                            href={`/pools/${pool.id}`}
                            className="text-gold hover:text-gold-dark text-sm font-medium whitespace-nowrap"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {pools.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No pools found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total pools
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-sm rounded-md border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 text-sm rounded-md border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
