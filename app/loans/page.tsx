'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { loanAdminAPI } from '@/lib/api';

type LoanStatus = 'requested' | 'approved' | 'rejected' | 'active' | 'repaid' | 'defaulted';

interface AdminLoan {
  id: string;
  poolId: string;
  poolName: string | null;
  borrowerId: string;
  borrowerName: string | null;
  principal: number;
  interestRate: number;
  durationMonths: number;
  totalAmountDue: number | null;
  amountRepaid: number;
  status: LoanStatus;
  votesRequired: number | null;
  votesApprove: number;
  votesReject: number;
  votingDeadline: string | null;
  dueDate: string | null;
  disbursedAt: string | null;
  defaultedAt: string | null;
  createdAt: string;
}

interface LoanVote {
  id: string;
  loanId: string;
  voterId: string;
  voterName: string | null;
  decision: 'approve' | 'reject';
  comment: string | null;
  votedAt: string;
}

interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  principalPortion: number | null;
  interestPortion: number | null;
  paidAt: string;
}

interface LoanDetail {
  loan: AdminLoan;
  borrowerName: string | null;
  poolName: string | null;
  votes: LoanVote[];
  repayments: LoanRepayment[];
}

const TABS: { label: string; status?: LoanStatus }[] = [
  { label: 'All' },
  { label: 'Pending', status: 'requested' },
  { label: 'Active', status: 'active' },
  { label: 'Repaid', status: 'repaid' },
  { label: 'Defaulted', status: 'defaulted' },
  { label: 'Rejected', status: 'rejected' },
];

const PER_PAGE = 20;

const STATUS_COLORS: Record<LoanStatus, string> = {
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

export default function LoansPage() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LoanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await loanAdminAPI.listLoans({
        status: activeTab.status,
        page,
        perPage: PER_PAGE,
      });
      setLoans(response.data?.data?.loans || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch loans');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const openDetail = async (loanId: string) => {
    setSelectedLoanId(loanId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await loanAdminAPI.getLoanDetail(loanId);
      setDetail(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setDetailError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch loan detail');
      console.error('Error fetching loan detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedLoanId(null);
    setDetail(null);
    setDetailError(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Loans</h1>
              <p className="mt-2 text-sm text-white/60">Loan requests and repayments across all pools</p>
            </div>
            <button
              onClick={fetchLoans}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-white/10">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
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

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading loans...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {loans.map((loan) => (
                    <li key={loan.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {loan.borrowerName || 'Unknown borrower'}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[loan.status]}`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <p className="text-sm text-white/50 truncate">Pool: {loan.poolName || 'Unknown pool'}</p>
                          <p className="text-xs text-white/40 mt-1">
                            Requested {formatDate(loan.createdAt)}
                            {loan.status === 'requested' && loan.votesRequired
                              ? ` • Votes: ${loan.votesApprove}/${loan.votesRequired} approve, ${loan.votesReject} reject`
                              : ''}
                            {loan.dueDate ? ` • Due ${formatDate(loan.dueDate)}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatCurrency(loan.principal)}</p>
                            <p className="text-xs text-white/50">
                              Repaid {formatCurrency(loan.amountRepaid)} of {formatCurrency(loan.totalAmountDue)}
                            </p>
                          </div>
                          <button
                            onClick={() => openDetail(loan.id)}
                            className="text-gold hover:text-gold-dark text-sm font-medium whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {loans.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No loans found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total loans
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

      {selectedLoanId && (
        <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border border-white/10 w-full max-w-2xl shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Loan Details</h3>
                <button onClick={closeDetail} className="text-white/40 hover:text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                </div>
              ) : detailError ? (
                <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
                  <p className="text-danger">{detailError}</p>
                </div>
              ) : detail ? (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-white/70">Borrower</label>
                      <p className="text-sm text-white">{detail.borrowerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Pool</label>
                      <p className="text-sm text-white">{detail.poolName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Status</label>
                      <p className="text-sm text-white">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[detail.loan.status]}`}
                        >
                          {detail.loan.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Principal</label>
                      <p className="text-sm text-white">{formatCurrency(detail.loan.principal)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Interest Rate</label>
                      <p className="text-sm text-white">{detail.loan.interestRate}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Duration</label>
                      <p className="text-sm text-white">{detail.loan.durationMonths} months</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Total Due</label>
                      <p className="text-sm text-white">{formatCurrency(detail.loan.totalAmountDue)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Amount Repaid</label>
                      <p className="text-sm text-white">{formatCurrency(detail.loan.amountRepaid)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Disbursed</label>
                      <p className="text-sm text-white">{formatDate(detail.loan.disbursedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Due Date</label>
                      <p className="text-sm text-white">{formatDate(detail.loan.dueDate)}</p>
                    </div>
                    {detail.loan.defaultedAt && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-danger">Defaulted</label>
                        <p className="text-sm text-danger">{formatDate(detail.loan.defaultedAt)}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Votes ({detail.votes.length}
                      {detail.loan.votesRequired ? ` / ${detail.loan.votesRequired} required` : ''})
                    </h4>
                    {detail.votes.length === 0 ? (
                      <p className="text-sm text-white/50">No votes yet</p>
                    ) : (
                      <ul className="divide-y divide-white/10 border border-white/10 rounded-md">
                        {detail.votes.map((vote) => (
                          <li key={vote.id} className="px-3 py-2 flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-white">{vote.voterName || vote.voterId}</span>
                              {vote.comment && <span className="text-white/50 ml-2">&ldquo;{vote.comment}&rdquo;</span>}
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                vote.decision === 'approve'
                                  ? 'bg-success/15 text-success'
                                  : 'bg-danger/15 text-danger'
                              }`}
                            >
                              {vote.decision}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Repayments ({detail.repayments.length})
                    </h4>
                    {detail.repayments.length === 0 ? (
                      <p className="text-sm text-white/50">No repayments yet</p>
                    ) : (
                      <ul className="divide-y divide-white/10 border border-white/10 rounded-md">
                        {detail.repayments.map((repayment) => (
                          <li key={repayment.id} className="px-3 py-2 flex items-center justify-between text-sm">
                            <span className="text-white/50">{formatDate(repayment.paidAt)}</span>
                            <span className="font-medium text-white">{formatCurrency(repayment.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetail}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
