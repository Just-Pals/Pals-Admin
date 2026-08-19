'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { adminAPI } from '@/lib/api';

interface UserDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  role: string;
  isVerified: boolean;
  kycStatus: string;
  createdAt: string;
  kyc: {
    status: string;
    documentType: string | null;
    documentLast4: string | null;
    rejectionReason: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
  } | null;
  palsScore: {
    score: number;
    scoreLevel: string;
    contributionScore: number;
    repaymentScore: number;
    votingScore: number;
  } | null;
  wallet: {
    totalBalance: number;
    investmentAmount: number;
    lendingAmount: number;
    borrowedAmount: number;
    poolBalanceTotal: number;
  };
  pools: {
    poolId: string;
    poolName: string;
    poolType: string;
    role: string;
    joinedAt: string;
    balance: number;
  }[];
  loans: {
    id: string;
    poolId: string;
    principal: number;
    status: string;
    totalAmountDue: number | null;
    amountRepaid: number;
    createdAt: string;
  }[];
}

const KYC_COLORS: Record<string, string> = {
  pending: 'bg-gold/15 text-gold',
  verified: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
};

const LOAN_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-gold/15 text-gold',
  approved: 'bg-info/15 text-info',
  active: 'bg-info/15 text-info',
  repaid: 'bg-success/15 text-success',
  defaulted: 'bg-danger/15 text-danger',
  rejected: 'bg-white/10 text-white/70',
};

function formatCurrency(amount: number | null) {
  if (amount === null) return 'N/A';
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

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getUserDetail(userId);
      setDetail(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch user detail');
      console.error('Error fetching user detail:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <Link href="/users" className="text-sm text-gold hover:text-gold-dark">
            ← Back to Users
          </Link>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading user...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mt-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : detail ? (
            <>
              <div className="mt-4 mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {detail.firstName || detail.lastName
                      ? `${detail.firstName || ''} ${detail.lastName || ''}`.trim()
                      : detail.email || detail.phone || 'Unnamed user'}
                  </h1>
                  <p className="mt-1 text-sm text-white/60">
                    {detail.email || 'No email'} • {detail.phone || 'No phone'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${KYC_COLORS[detail.kycStatus] || 'bg-white/10 text-white/70'}`}
                  >
                    KYC: {detail.kycStatus}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/70">
                    {detail.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Personal balance" value={formatCurrency(detail.wallet.totalBalance)} />
                <StatCard label="Investment" value={formatCurrency(detail.wallet.investmentAmount)} />
                <StatCard label="Lending" value={formatCurrency(detail.wallet.lendingAmount)} />
                <StatCard label="Borrowed" value={formatCurrency(detail.wallet.borrowedAmount)} />
                <StatCard label="Pool balances" value={formatCurrency(detail.wallet.poolBalanceTotal)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Profile */}
                <div className="bg-surface border border-white/10 shadow rounded-lg p-5">
                  <h2 className="text-sm font-semibold text-white mb-3">Profile</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-white/50">Date of birth</dt>
                      <dd className="text-white">{formatDate(detail.dateOfBirth)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">Address</dt>
                      <dd className="text-white text-right">{detail.address || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">Verified</dt>
                      <dd className="text-white">{detail.isVerified ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/50">Joined</dt>
                      <dd className="text-white">{formatDate(detail.createdAt)}</dd>
                    </div>
                  </dl>
                </div>

                {/* KYC + Pals Score */}
                <div className="bg-surface border border-white/10 shadow rounded-lg p-5">
                  <h2 className="text-sm font-semibold text-white mb-3">KYC &amp; Pals Score</h2>
                  {detail.kyc ? (
                    <dl className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <dt className="text-white/50">Document</dt>
                        <dd className="text-white">
                          {detail.kyc.documentType || 'N/A'} {detail.kyc.documentLast4 ? `••${detail.kyc.documentLast4}` : ''}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">Submitted</dt>
                        <dd className="text-white">{formatDate(detail.kyc.submittedAt)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">Verified</dt>
                        <dd className="text-white">{formatDate(detail.kyc.verifiedAt)}</dd>
                      </div>
                      {detail.kyc.rejectionReason && (
                        <div className="flex justify-between">
                          <dt className="text-white/50">Rejection reason</dt>
                          <dd className="text-danger text-right">{detail.kyc.rejectionReason}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-sm text-white/50 mb-4">No KYC submission yet</p>
                  )}
                  {detail.palsScore ? (
                    <dl className="space-y-2 text-sm border-t border-white/10 pt-3">
                      <div className="flex justify-between">
                        <dt className="text-white/50">Pals Score</dt>
                        <dd className="text-white font-semibold">
                          {detail.palsScore.score} ({detail.palsScore.scoreLevel})
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-white/50">Contribution / Repayment / Voting</dt>
                        <dd className="text-white">
                          {detail.palsScore.contributionScore} / {detail.palsScore.repaymentScore} /{' '}
                          {detail.palsScore.votingScore}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-white/50 border-t border-white/10 pt-3">No Pals Score yet</p>
                  )}
                </div>
              </div>

              {/* Pools joined */}
              <div className="bg-surface border border-white/10 shadow rounded-lg p-5 mb-8">
                <h2 className="text-sm font-semibold text-white mb-3">Pools joined ({detail.pools.length})</h2>
                {detail.pools.length === 0 ? (
                  <p className="text-sm text-white/50">Not a member of any pool</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {detail.pools.map((pool) => (
                      <li key={pool.poolId} className="py-2 flex items-center justify-between text-sm">
                        <div>
                          <Link href={`/pools/${pool.poolId}`} className="font-medium text-gold hover:text-gold-dark">
                            {pool.poolName}
                          </Link>
                          <span className="text-white/40 ml-2">
                            {pool.poolType} • {pool.role} • joined {formatDate(pool.joinedAt)}
                          </span>
                        </div>
                        <span className="font-medium text-white">{formatCurrency(pool.balance)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Loan history */}
              <div className="bg-surface border border-white/10 shadow rounded-lg p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Loan history ({detail.loans.length})</h2>
                {detail.loans.length === 0 ? (
                  <p className="text-sm text-white/50">No loans</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {detail.loans.map((loan) => (
                      <li key={loan.id} className="py-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${LOAN_STATUS_COLORS[loan.status] || 'bg-white/10 text-white/70'}`}
                          >
                            {loan.status}
                          </span>
                          <span className="text-white/40">{formatDate(loan.createdAt)}</span>
                        </div>
                        <span className="text-white">
                          {formatCurrency(loan.amountRepaid)} / {formatCurrency(loan.totalAmountDue)}
                        </span>
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
