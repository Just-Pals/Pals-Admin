'use client';

import { useEffect, useState, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { goldAdminAPI } from '@/lib/api';

type WithdrawalStatus = 'pending' | 'completed' | 'cancelled';

interface GoldReserve {
  totalReserveGrams: number;
  totalHoldingsGrams: number;
  varianceGrams: number;
  isBalanced: boolean;
  pricePerGram: number;
  reserveValue: number;
  holdingsValue: number;
  poolsWithHoldings: number;
  reserves: { provider: string; totalGrams: number; updatedAt: string }[];
}

interface GoldPriceHistoryEntry {
  pricePerGram: number;
  currency: string;
  recordedAt: string;
}

interface GoldPrice {
  latestPrice: number;
  currency: string;
  recordedAt: string | null;
  history: GoldPriceHistoryEntry[];
}

interface GoldWithdrawal {
  id: string;
  poolId: string;
  poolName: string | null;
  userId: string;
  userName: string | null;
  goldGrams: number;
  priceAtWithdrawal: number | null;
  cashEquivalent: number | null;
  status: WithdrawalStatus;
  requestedAt: string;
  completedAt: string | null;
}

const TABS: { label: string; status?: WithdrawalStatus }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'All' },
  { label: 'Completed', status: 'completed' },
  { label: 'Cancelled', status: 'cancelled' },
];

const PER_PAGE = 20;

const STATUS_COLORS: Record<WithdrawalStatus, string> = {
  pending: 'bg-gold/15 text-gold',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-white/10 text-white/70',
};

function formatGrams(grams: number) {
  return `${grams.toLocaleString(undefined, { maximumFractionDigits: 2 })}g`;
}

function formatCurrency(amount: number | null) {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="bg-surface border border-white/10 shadow rounded-lg p-4">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-danger' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Minimal inline SVG sparkline: 2px line, filled end-dot, one hue, no external chart library. */
function PriceSparkline({ history }: { history: GoldPriceHistoryEntry[] }) {
  if (history.length < 2) {
    return <p className="text-sm text-white/50">Not enough price history yet</p>;
  }
  // history is newest-first from the API; plot oldest-to-newest left-to-right.
  const points = [...history].reverse();
  const width = 600;
  const height = 120;
  const padding = 8;
  const prices = points.map((p) => p.pricePerGram);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.pricePerGram - min) / range) * (height - padding * 2);
    return { x, y, price: p.pricePerGram, recordedAt: p.recordedAt };
  });

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <path d={path} fill="none" stroke="#F7CE45" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last.x} cy={last.y} r={4} fill="#F7CE45" stroke="#141416" strokeWidth={2} />
      </svg>
      <div className="flex justify-between text-xs text-white/40 mt-1">
        <span>{formatDate(coords[0].recordedAt)}</span>
        <span>
          Latest: {formatCurrency(last.price)}/g on {formatDate(last.recordedAt)}
        </span>
      </div>
    </div>
  );
}

export default function GoldPage() {
  const [reserve, setReserve] = useState<GoldReserve | null>(null);
  const [reserveLoading, setReserveLoading] = useState(true);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const [price, setPrice] = useState<GoldPrice | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState<GoldWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [wdLoading, setWdLoading] = useState(true);
  const [wdError, setWdError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchReserve = useCallback(async () => {
    try {
      setReserveLoading(true);
      setReserveError(null);
      const response = await goldAdminAPI.getReserve();
      setReserve(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setReserveError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch gold reserve');
      console.error('Error fetching gold reserve:', err);
    } finally {
      setReserveLoading(false);
    }
  }, []);

  const fetchPrice = useCallback(async () => {
    try {
      setPriceLoading(true);
      const response = await goldAdminAPI.getPrice();
      setPrice(response.data?.data || null);
    } catch (err) {
      console.error('Error fetching gold price:', err);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setWdLoading(true);
      setWdError(null);
      const response = await goldAdminAPI.listWithdrawals({ status: activeTab.status, page, perPage: PER_PAGE });
      setWithdrawals(response.data?.data?.withdrawals || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setWdError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch withdrawals');
      console.error('Error fetching gold withdrawals:', err);
    } finally {
      setWdLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchReserve();
    fetchPrice();
  }, [fetchReserve, fetchPrice]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleAction = async (id: string, action: 'complete' | 'cancel') => {
    const verb = action === 'complete' ? 'mark as paid out' : 'cancel';
    if (!confirm(`Are you sure you want to ${verb} this redemption?`)) return;
    try {
      setActingOn(id);
      if (action === 'complete') {
        await goldAdminAPI.completeWithdrawal(id);
      } else {
        await goldAdminAPI.cancelWithdrawal(id);
      }
      await Promise.all([fetchWithdrawals(), fetchReserve()]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      alert(axiosErr.response?.data?.error?.message || axiosErr.message || `Failed to ${verb} redemption`);
      console.error(`Error trying to ${action} withdrawal:`, err);
    } finally {
      setActingOn(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Gold</h1>
              <p className="mt-2 text-sm text-white/60">Reserve reconciliation, price history, and redemptions</p>
            </div>
            <button
              onClick={() => {
                fetchReserve();
                fetchPrice();
                fetchWithdrawals();
              }}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Reserve reconciliation */}
          {reserveLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
          ) : reserveError ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mb-6">
              <p className="text-danger">{reserveError}</p>
            </div>
          ) : reserve ? (
            <>
              {!reserve.isBalanced && (
                <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mb-4">
                  <p className="text-danger text-sm font-medium">
                    ⚠ Reserve mismatch: {formatGrams(Math.abs(reserve.varianceGrams))}{' '}
                    {reserve.varianceGrams > 0 ? 'unallocated in reserve' : 'over-allocated to pools'}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Total reserve" value={formatGrams(reserve.totalReserveGrams)} />
                <StatCard label="Member holdings" value={formatGrams(reserve.totalHoldingsGrams)} />
                <StatCard
                  label="Variance"
                  value={formatGrams(reserve.varianceGrams)}
                  tone={reserve.isBalanced ? 'good' : 'bad'}
                />
                <StatCard label="Reserve value" value={formatCurrency(reserve.reserveValue)} />
                <StatCard label="Holdings value" value={formatCurrency(reserve.holdingsValue)} />
                <StatCard label="Pools holding gold" value={reserve.poolsWithHoldings.toString()} />
              </div>
              {reserve.reserves.length > 0 && (
                <div className="bg-surface border border-white/10 shadow rounded-lg p-5 mb-8">
                  <h2 className="text-sm font-semibold text-white mb-3">Reserve providers</h2>
                  <ul className="divide-y divide-white/10">
                    {reserve.reserves.map((r) => (
                      <li key={r.provider} className="py-2 flex items-center justify-between text-sm">
                        <span className="text-white">{r.provider}</span>
                        <span className="text-white/50">
                          {formatGrams(r.totalGrams)} • updated {formatDate(r.updatedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}

          {/* Price history */}
          <div className="bg-surface border border-white/10 shadow rounded-lg p-5 mb-8">
            <h2 className="text-sm font-semibold text-white mb-3">Price history (7 days)</h2>
            {priceLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
              </div>
            ) : price ? (
              <PriceSparkline history={price.history} />
            ) : (
              <p className="text-sm text-white/50">Price data unavailable</p>
            )}
          </div>

          {/* Redemption queue */}
          <div className="mb-6">
            <div className="border-b border-white/10">
              <nav className="-mb-px flex space-x-8">
                {TABS.map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setActiveTab(tab);
                      setPage(1);
                    }}
                    className={`${
                      activeTab.label === tab.label
                        ? 'border-gold text-gold'
                        : 'border-transparent text-white/50 hover:text-white/70 hover:border-white/20'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {wdLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading redemptions...</p>
            </div>
          ) : wdError ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{wdError}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {withdrawals.map((wd) => (
                    <li key={wd.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{wd.userName || 'Unknown user'}</p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[wd.status]}`}>
                              {wd.status}
                            </span>
                          </div>
                          <p className="text-sm text-white/50">Pool: {wd.poolName || 'Unknown pool'}</p>
                          <p className="text-xs text-white/40 mt-1">
                            Requested {formatDateTime(wd.requestedAt)}
                            {wd.completedAt ? ` • Completed ${formatDateTime(wd.completedAt)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatGrams(wd.goldGrams)}</p>
                            <p className="text-xs text-white/50">{formatCurrency(wd.cashEquivalent)}</p>
                          </div>
                          {wd.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(wd.id, 'complete')}
                                disabled={actingOn === wd.id}
                                className="bg-success hover:bg-success/80 text-white font-medium py-1.5 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleAction(wd.id, 'cancel')}
                                disabled={actingOn === wd.id}
                                className="bg-danger/90 hover:bg-danger text-white font-medium py-1.5 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {withdrawals.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No redemptions found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total redemptions
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
