'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import { userAPI } from '@/lib/api';

interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  dateOfBirth?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getAllUsers();
      setUsers(response.data?.data?.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gold/15 text-gold',
      verified: 'bg-success/15 text-success',
      completed: 'bg-success/15 text-success',
      rejected: 'bg-danger/15 text-danger',
    };
    const displayStatus = status || 'pending';
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[displayStatus] || 'bg-white/10 text-white/70'
        }`}
      >
        {displayStatus}
      </span>
    );
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Users</h1>
              <p className="mt-2 text-sm text-white/60">
                Manage all registered users
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
              <p className="mt-4 text-white/60">Loading users...</p>
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <div className="bg-surface border border-white/10 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-white/10">
                {users.map((user) => (
                  <li key={user.id} className="px-6 py-4 hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gold/20 text-gold flex items-center justify-center font-semibold">
                              {(user.name || user.firstName || user.email || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user.name ||
                                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                                user.email ||
                                user.phone ||
                                'Unnamed User'}
                            </p>
                            <p className="text-sm text-white/50 truncate">
                              {user.email || user.phone || 'No contact info'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {user.isVerified ? (
                              <span className="text-success text-xs">✓ Verified</span>
                            ) : (
                              <span className="text-gold text-xs">⚠ Unverified</span>
                            )}
                            {getStatusBadge(user.kycStatus)}
                          </div>
                          <p className="text-xs text-white/50 mt-1">
                            {user.role} • {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={`/users/${user.id}`}
                          className="text-gold hover:text-gold-dark text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/50">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
