'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { adminAPI, mediaAPI } from '@/lib/api';

type KycStatus = 'pending' | 'verified' | 'rejected';

interface KycQueueItem {
  id: string;
  userId: string;
  userName: string | null;
  email: string | null;
  phone: string | null;
  status: KycStatus;
  documentType: string | null;
  documentLast4: string | null;
  documentExpiry: string | null;
  documentFrontMediaId: string | null;
  documentBackMediaId: string | null;
  selfieMediaId: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
}

interface MediaPreview {
  frontUrl: string | null;
  backUrl: string | null;
  selfieUrl: string | null;
}

const TABS: { label: string; status?: KycStatus }[] = [
  { label: 'Pending', status: 'pending' },
  { label: 'All' },
  { label: 'Verified', status: 'verified' },
  { label: 'Rejected', status: 'rejected' },
];

const PER_PAGE = 20;

const STATUS_COLORS: Record<KycStatus, string> = {
  pending: 'bg-gold/15 text-gold',
  verified: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
};

function formatDate(dateString?: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function resolveMediaUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId) return null;
  try {
    const response = await mediaAPI.getMediaById(mediaId);
    return response.data?.data?.signedUrl || null;
  } catch (err) {
    console.error(`Failed to resolve media ${mediaId}:`, err);
    return null;
  }
}

export default function KYCPage() {
  const [items, setItems] = useState<KycQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<KycQueueItem | null>(null);
  const [media, setMedia] = useState<MediaPreview | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getKycQueue({ status: activeTab.status, page, perPage: PER_PAGE });
      setItems(response.data?.data?.items || []);
      setTotal(response.data?.data?.total || 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch KYC queue');
      console.error('Error fetching KYC queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const openDetail = async (item: KycQueueItem) => {
    setSelectedItem(item);
    setMedia(null);
    setActionError(null);
    setMediaLoading(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        resolveMediaUrl(item.documentFrontMediaId),
        resolveMediaUrl(item.documentBackMediaId),
        resolveMediaUrl(item.selfieMediaId),
      ]);
      setMedia({ frontUrl, backUrl, selfieUrl });
    } finally {
      setMediaLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setMedia(null);
    setActionError(null);
  };

  const handleUpdateStatus = async (status: 'verified' | 'rejected') => {
    if (!selectedItem) return;
    if (!confirm(`Are you sure you want to ${status === 'verified' ? 'approve' : 'reject'} this KYC?`)) return;

    try {
      setUpdatingStatus(true);
      setActionError(null);
      await adminAPI.updateKYCStatus({ userId: selectedItem.userId, status });
      closeDetail();
      await fetchQueue();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setActionError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to update KYC status');
      console.error('Error updating KYC status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">KYC Management</h1>
              <p className="mt-2 text-sm text-white/60">Review and manage KYC submissions</p>
            </div>
            <button
              onClick={fetchQueue}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Filter Tabs */}
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

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading KYC data...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-white/10">
                  {items.map((item) => (
                    <li key={item.id} className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold">
                            {(item.userName || item.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.userName || 'Unnamed'}</p>
                            <p className="text-sm text-white/50">{item.email || item.phone || 'No contact'}</p>
                            <p className="text-xs text-white/40 mt-1">
                              {item.documentType || 'N/A'} • Submitted: {formatDate(item.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.status]}`}
                          >
                            {item.status}
                          </span>
                          <button
                            onClick={() => openDetail(item)}
                            className="text-gold hover:text-gold-dark text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {items.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/50">No KYC submissions found</p>
                  </div>
                )}
              </div>

              {total > PER_PAGE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-white/60">
                    Page {page} of {totalPages} • {total} total submissions
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

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border border-white/10 w-full max-w-2xl shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">KYC Details</h3>
                <button onClick={closeDetail} className="text-white/40 hover:text-white/70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white/70">Name</label>
                    <p className="text-sm text-white">{selectedItem.userName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Status</label>
                    <p className="text-sm text-white">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[selectedItem.status]}`}
                      >
                        {selectedItem.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Email</label>
                    <p className="text-sm text-white">{selectedItem.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Phone</label>
                    <p className="text-sm text-white">{selectedItem.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">ID Type</label>
                    <p className="text-sm text-white">
                      {selectedItem.documentType || 'N/A'} {selectedItem.documentLast4 ? `••${selectedItem.documentLast4}` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Submitted</label>
                    <p className="text-sm text-white">{formatDate(selectedItem.submittedAt)}</p>
                  </div>
                  {selectedItem.rejectionReason && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-white/70">Rejection reason</label>
                      <p className="text-sm text-danger">{selectedItem.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">Documents</label>
                  {mediaLoading ? (
                    <div className="text-center py-6">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Selfie', url: media?.selfieUrl },
                        { label: 'ID Front', url: media?.frontUrl },
                        { label: 'ID Back', url: media?.backUrl },
                      ].map((doc) => (
                        <div key={doc.label}>
                          <p className="text-xs text-white/50 mb-1">{doc.label}</p>
                          {doc.url ? (
                            <Image
                              src={doc.url}
                              alt={doc.label}
                              width={200}
                              height={140}
                              unoptimized
                              className="h-28 w-full rounded-lg object-cover border border-white/10"
                            />
                          ) : (
                            <div className="h-28 w-full rounded-lg border border-dashed border-white/20 flex items-center justify-center text-xs text-white/40">
                              Not available
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {actionError && (
                  <div className="bg-danger/10 border border-danger/30 rounded-md p-3">
                    <p className="text-danger text-sm">{actionError}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                {selectedItem.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUpdateStatus('verified')}
                      disabled={updatingStatus}
                      className="bg-success hover:bg-success/80 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? 'Updating...' : 'Approve KYC'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={updatingStatus}
                      className="bg-danger/90 hover:bg-danger text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? 'Updating...' : 'Reject KYC'}
                    </button>
                  </div>
                )}
                <button
                  onClick={closeDetail}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md text-sm ml-auto"
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
