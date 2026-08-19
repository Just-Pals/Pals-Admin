'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { sosAdminAPI } from '@/lib/api';

type SosStatus = 'active' | 'resolved' | 'cancelled';

interface AdminSosAlert {
  id: string;
  senderId: string;
  senderName: string | null;
  type: string;
  message: string;
  audienceMode: 'allPals' | 'allExcept' | 'onlyThese';
  status: SosStatus;
  responseCount: number;
  createdAt: string;
  resolvedAt: string | null;
  expiresAt: string;
}

interface SosResponseDetail {
  id: string;
  responderId: string;
  responderName: string | null;
  action: string;
  note: string | null;
  createdAt: string;
}

interface SosDetail {
  id: string;
  senderId: string;
  senderName: string | null;
  type: string;
  message: string;
  audienceMode: 'allPals' | 'allExcept' | 'onlyThese';
  status: SosStatus;
  recipientCount: number;
  responses: SosResponseDetail[];
  createdAt: string;
  resolvedAt: string | null;
  expiresAt: string;
}

const TABS: { label: string; status?: SosStatus }[] = [
  { label: 'Active', status: 'active' },
  { label: 'All' },
  { label: 'Resolved', status: 'resolved' },
  { label: 'Cancelled', status: 'cancelled' },
];

const PER_PAGE = 20;
const POLL_INTERVAL_MS = 30000;

const STATUS_COLORS: Record<SosStatus, string> = {
  active: 'bg-danger/15 text-danger',
  resolved: 'bg-success/15 text-success',
  cancelled: 'bg-white/10 text-white/70',
};

const AUDIENCE_LABELS: Record<AdminSosAlert['audienceMode'], string> = {
  allPals: 'All pals',
  allExcept: 'All pals except some',
  onlyThese: 'Selected pals only',
};

const ACTION_LABELS: Record<string, string> = {
  on_it: "I'm on it",
  calling: 'Calling',
  transfer: 'Transferring money',
  custom: 'Custom',
};

function formatDateTime(dateString?: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatElapsed(dateString: string) {
  const ms = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SosPage() {
  const [alerts, setAlerts] = useState<AdminSosAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSosId, setSelectedSosId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SosDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const response = await sosAdminAPI.listSos({
        status: activeTab.status,
        page,
        perPage: PER_PAGE,
      });
      setAlerts(response.data?.data?.alerts || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch SOS alerts');
      console.error('Error fetching SOS alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Poll for new alerts on the Active tab so this behaves like a live monitor
  useEffect(() => {
    if (activeTab.status !== 'active') return;
    const interval = setInterval(() => {
      if (activeTabRef.current.status === 'active') {
        fetchAlerts(true);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeTab, fetchAlerts]);

  const openDetail = async (sosId: string) => {
    setSelectedSosId(sosId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await sosAdminAPI.getSosDetail(sosId);
      setDetail(response.data?.data || null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setDetailError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch SOS detail');
      console.error('Error fetching SOS detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedSosId(null);
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
              <h1 className="text-3xl font-bold text-white">SOS Monitor</h1>
              <p className="mt-2 text-sm text-white/60">
                Emergency alerts sent between pals. Active alerts refresh automatically.
              </p>
            </div>
            <button
              onClick={() => fetchAlerts()}
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
              <p className="mt-4 text-white/60">Loading SOS alerts...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {alert.senderName || 'Unknown sender'}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[alert.status]}`}
                            >
                              {alert.status}
                            </span>
                            <span className="text-xs text-white/40">{alert.type}</span>
                          </div>
                          <p className="text-sm text-white/50 truncate">{alert.message || 'No message'}</p>
                          <p className="text-xs text-white/40 mt-1">
                            {formatElapsed(alert.createdAt)} • {AUDIENCE_LABELS[alert.audienceMode]}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              {alert.responseCount} {alert.responseCount === 1 ? 'response' : 'responses'}
                            </p>
                          </div>
                          <button
                            onClick={() => openDetail(alert.id)}
                            className="text-gold hover:text-gold-dark text-sm font-medium whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {alerts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No SOS alerts found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total alerts
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

      {selectedSosId && (
        <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border border-white/10 w-full max-w-2xl shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">SOS Alert Details</h3>
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
                      <label className="text-sm font-medium text-white/70">Sender</label>
                      <p className="text-sm text-white">{detail.senderName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Status</label>
                      <p className="text-sm text-white">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[detail.status]}`}
                        >
                          {detail.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Type</label>
                      <p className="text-sm text-white">{detail.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Audience</label>
                      <p className="text-sm text-white">
                        {AUDIENCE_LABELS[detail.audienceMode]} ({detail.recipientCount} recipients)
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-white/70">Message</label>
                      <p className="text-sm text-white">{detail.message || 'No message'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">Sent</label>
                      <p className="text-sm text-white">{formatDateTime(detail.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/70">
                        {detail.status === 'resolved' ? 'Resolved' : 'Expires'}
                      </label>
                      <p className="text-sm text-white">
                        {detail.status === 'resolved'
                          ? formatDateTime(detail.resolvedAt)
                          : formatDateTime(detail.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      Responses ({detail.responses.length} of {detail.recipientCount} recipients)
                    </h4>
                    {detail.responses.length === 0 ? (
                      <p className="text-sm text-white/50">No responses yet</p>
                    ) : (
                      <ul className="divide-y divide-white/10 border border-white/10 rounded-md">
                        {detail.responses.map((response) => (
                          <li key={response.id} className="px-3 py-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">
                                {response.responderName || response.responderId}
                              </span>
                              <span className="text-xs text-white/40">{formatDateTime(response.createdAt)}</span>
                            </div>
                            <p className="text-white/60">
                              {ACTION_LABELS[response.action] || response.action}
                              {response.note ? ` — ${response.note}` : ''}
                            </p>
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
