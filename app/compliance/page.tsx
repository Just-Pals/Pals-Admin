'use client';

import { useEffect, useState, useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import { adminAPI } from '@/lib/api';

interface ComplianceLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const PER_PAGE = 30;

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function CompliancePage() {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getComplianceLogs({
        action: actionFilter || undefined,
        page,
        perPage: PER_PAGE,
      });
      setLogs(response.data?.data?.logs || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch compliance logs');
      console.error('Error fetching compliance logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyActionFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFilter(actionInput.trim());
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Compliance Log</h1>
              <p className="mt-2 text-sm text-white/60">Audit trail of sensitive actions across the platform</p>
            </div>
            <button
              onClick={fetchLogs}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          <form onSubmit={applyActionFilter} className="flex gap-2 mb-6">
            <input
              type="text"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder="Filter by action (e.g. login, kyc_update)"
              className="w-72 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
            />
            <button type="submit" className="px-3 py-1.5 text-sm rounded-md border border-white/10 hover:bg-white/5">
              Filter
            </button>
            {actionFilter && (
              <button
                type="button"
                onClick={() => {
                  setActionInput('');
                  setActionFilter('');
                  setPage(1);
                }}
                className="px-3 py-1.5 text-sm text-white/50 hover:text-white/70"
              >
                Clear
              </button>
            )}
          </form>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading compliance logs...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">Timestamp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">User</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">Action</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">IP address</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/50 uppercase">User agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-sm text-white/50 whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-2 text-sm text-white whitespace-nowrap">
                            {log.userName || log.userId || 'System'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/10 text-white/70">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-white/50 whitespace-nowrap">
                            {log.ipAddress || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-white/50 max-w-xs truncate" title={log.userAgent || ''}>
                            {log.userAgent || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No compliance log entries found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total entries
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
