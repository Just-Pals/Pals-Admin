'use client';

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { adminAPI } from '@/lib/api';

interface PoolWithMembers {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  memberCount: number;
  creatorName: string | null;
  createdAt: string;
}

export default function PoolsPage() {
  const [pools, setPools] = useState<PoolWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllPools();
      setPools(response.data?.data?.pools || []);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to fetch pools');
      console.error('Error fetching pools:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pools</h1>
              <p className="mt-2 text-sm text-gray-600">
                All pools with member counts and creators
              </p>
            </div>
            <button
              onClick={fetchPools}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading pools...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {pools.map((pool) => (
                  <li key={pool.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                              {pool.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pool.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {pool.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Type: {pool.type} • Public: {pool.isPublic ? 'Yes' : 'No'} • Created: {formatDate(pool.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {pool.memberCount} {pool.memberCount === 1 ? 'member' : 'members'}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {pool.creatorName || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {pools.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pools found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
