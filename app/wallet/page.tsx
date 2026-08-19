'use client';

import { useEffect, useState, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { walletAdminAPI } from '@/lib/api';

type TransactionType = 'add_money' | 'withdraw' | 'transfer_in' | 'transfer_out';

interface WalletOverview {
  personalWallets: {
    totalBalance: number;
    totalInvestment: number;
    totalLending: number;
    totalBorrowed: number;
    walletCount: number;
  };
  poolLedger: {
    totalBalance: number;
    transactionCount: number;
  };
  transactionTypeBreakdown: { type: string; totalAmount: number; count: number }[];
}

interface AdminWalletTransaction {
  id: string;
  userId: string;
  userName: string | null;
  amount: number;
  type: TransactionType;
  bankAccountLast4: string | null;
  counterpartyUserId: string | null;
  counterpartyName: string | null;
  description: string | null;
  createdAt: string;
}

const PER_PAGE = 20;
const DEFAULT_MIN_AMOUNT = 10000;

const TYPE_OPTIONS: { label: string; value: TransactionType | '' }[] = [
  { label: 'All types', value: '' },
  { label: 'Add money', value: 'add_money' },
  { label: 'Withdraw', value: 'withdraw' },
  { label: 'Transfer in', value: 'transfer_in' },
  { label: 'Transfer out', value: 'transfer_out' },
];

const TYPE_COLORS: Record<TransactionType, string> = {
  add_money: 'bg-success/15 text-success',
  withdraw: 'bg-danger/15 text-danger',
  transfer_in: 'bg-info/15 text-info',
  transfer_out: 'bg-gold/15 text-gold',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    amount
  );
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function titleCase(snake: string) {
  return snake
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function StatCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="bg-surface border border-white/10 shadow rounded-lg p-4">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${muted ? 'text-white/60' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function WalletPage() {
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<AdminWalletTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [minAmount, setMinAmount] = useState(DEFAULT_MIN_AMOUNT);
  const [minAmountInput, setMinAmountInput] = useState(String(DEFAULT_MIN_AMOUNT));
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const response = await walletAdminAPI.getOverview();
      setOverview(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setOverviewError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch wallet overview');
      console.error('Error fetching wallet overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      setTxError(null);
      const response = await walletAdminAPI.getLargeTransactions({
        minAmount,
        type: typeFilter || undefined,
        page,
        perPage: PER_PAGE,
      });
      setTransactions(response.data?.data?.transactions || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setTxError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setTxLoading(false);
    }
  }, [minAmount, typeFilter, page]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const applyMinAmount = () => {
    const parsed = Number(minAmountInput);
    setMinAmount(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
    setPage(1);
  };

  const maxBreakdownAmount = overview?.transactionTypeBreakdown.reduce(
    (max, row) => Math.max(max, row.totalAmount),
    0
  ) || 0;

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Wallet &amp; Ledger</h1>
              <p className="mt-2 text-sm text-white/60">Platform-wide liquidity and large-transaction monitoring</p>
            </div>
            <button
              onClick={() => {
                fetchOverview();
                fetchTransactions();
              }}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Overview */}
          {overviewLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading wallet overview...</p>
            </div>
          ) : overviewError ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mb-6">
              <p className="text-danger">{overviewError}</p>
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Personal balance" value={formatCompact(overview.personalWallets.totalBalance)} />
                <StatCard label="Investment" value={formatCompact(overview.personalWallets.totalInvestment)} />
                <StatCard label="Lending" value={formatCompact(overview.personalWallets.totalLending)} />
                <StatCard label="Borrowed" value={formatCompact(overview.personalWallets.totalBorrowed)} />
                <StatCard label="Pool ledger balance" value={formatCompact(overview.poolLedger.totalBalance)} />
                <StatCard
                  label="Wallets"
                  value={overview.personalWallets.walletCount.toLocaleString()}
                  muted
                />
              </div>

              {/* Transaction type breakdown */}
              <div className="bg-surface border border-white/10 shadow rounded-lg p-5 mb-8">
                <h2 className="text-sm font-semibold text-white mb-4">
                  Pool ledger volume by transaction type
                </h2>
                {overview.transactionTypeBreakdown.length === 0 ? (
                  <p className="text-sm text-white/50">No ledger activity yet</p>
                ) : (
                  <div className="space-y-2">
                    {overview.transactionTypeBreakdown.map((row) => {
                      const widthPct = maxBreakdownAmount > 0 ? (row.totalAmount / maxBreakdownAmount) * 100 : 0;
                      return (
                        <div key={row.type} className="flex items-center gap-3">
                          <div className="w-40 shrink-0 text-xs text-white/60 text-right">
                            {titleCase(row.type)}
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-info h-6 rounded-full"
                                style={{ width: `${Math.max(widthPct, row.totalAmount > 0 ? 2 : 0)}%` }}
                              />
                            </div>
                            <div className="w-28 shrink-0 text-xs text-white/70 tabular-nums">
                              {formatCompact(row.totalAmount)}
                            </div>
                            <div className="w-16 shrink-0 text-xs text-white/40 tabular-nums">
                              {row.count.toLocaleString()}x
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Large transactions */}
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Minimum amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minAmountInput}
                  onChange={(e) => setMinAmountInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyMinAmount()}
                  className="w-32 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                  min={0}
                />
                <button
                  onClick={applyMinAmount}
                  className="px-3 py-1.5 text-sm rounded-md border border-white/10 hover:bg-white/5"
                >
                  Apply
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TransactionType | '');
                  setPage(1);
                }}
                className="rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {txLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading transactions...</p>
            </div>
          ) : txError ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{txError}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{tx.userName || 'Unknown user'}</p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${TYPE_COLORS[tx.type]}`}>
                              {titleCase(tx.type)}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            {formatDateTime(tx.createdAt)}
                            {tx.bankAccountLast4 ? ` • Bank ••${tx.bankAccountLast4}` : ''}
                            {tx.counterpartyName ? ` • With ${tx.counterpartyName}` : ''}
                            {tx.description ? ` • ${tx.description}` : ''}
                          </p>
                        </div>
                        <p className={`text-sm font-semibold ${tx.amount < 0 ? 'text-danger' : 'text-white'}`}>
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No transactions at or above this amount</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total transactions
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
