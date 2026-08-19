'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { adminAPI, userAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

type PlatformRole = 'user' | 'admin' | 'super_admin';

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: PlatformRole;
  createdAt: string;
}

interface SearchResultUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string;
  role: PlatformRole;
}

const ROLE_COLORS: Record<PlatformRole, string> = {
  user: 'bg-white/10 text-white/70',
  admin: 'bg-info/15 text-info',
  super_admin: 'bg-violet/15 text-violet',
};

function displayName(u: { firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null }) {
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return name || u.email || u.phone || 'Unnamed user';
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminsPage() {
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.listAdmins();
      setAdmins(response.data?.data?.admins || []);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to fetch admins');
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const changeRole = async (userId: string, role: PlatformRole) => {
    if (!confirm(`Change this user's role to "${role}"?`)) return;
    try {
      setActingOn(userId);
      await adminAPI.updateUserRole(userId, role);
      await fetchAdmins();
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      alert(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to update role');
      console.error('Error updating role:', err);
    } finally {
      setActingOn(null);
    }
  };

  const openPasswordReset = (admin: AdminUser) => {
    setPasswordTarget(admin);
    setNewPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const closePasswordReset = () => {
    setPasswordTarget(null);
    setNewPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const submitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    try {
      setResettingPassword(true);
      setPasswordError(null);
      await adminAPI.resetUserPassword(passwordTarget.id, newPassword);
      setPasswordSuccess('Password updated.');
      setNewPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setPasswordError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Failed to reset password');
      console.error('Error resetting password:', err);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setSearchError(null);
      const response = await userAPI.getAllUsers({ q: searchQuery.trim() });
      setSearchResults(response.data?.data?.users || []);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setSearchError(axiosErr.response?.data?.error?.message || axiosErr.message || 'Search failed');
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Admin Management</h1>
            <p className="mt-2 text-sm text-white/60">
              {isSuperAdmin
                ? 'Promote or demote platform admins.'
                : 'Only super admins can change roles. You can view the current admin list.'}
            </p>
          </div>

          {/* Current admins */}
          <div className="bg-surface border border-white/10 shadow rounded-lg p-5 mb-8">
            <h2 className="text-sm font-semibold text-white mb-3">Current admins ({admins.length})</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
              </div>
            ) : error ? (
              <div className="bg-danger/10 border border-danger/30 rounded-md p-4">
                <p className="text-danger">{error}</p>
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-white/50">No admins found</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {admins.map((admin) => (
                  <li key={admin.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{displayName(admin)}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ROLE_COLORS[admin.role]}`}>
                          {admin.role}
                        </span>
                        {admin.id === currentUser?.id && (
                          <span className="text-xs text-white/40">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        {admin.email || admin.phone || 'No contact'} • admin since {formatDate(admin.createdAt)}
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openPasswordReset(admin)}
                          className="px-3 py-1.5 text-xs rounded-md border border-white/10 text-white/70 hover:bg-white/5"
                        >
                          Reset Password
                        </button>
                        {admin.id !== currentUser?.id && (
                          <>
                            {admin.role === 'admin' && (
                              <button
                                onClick={() => changeRole(admin.id, 'super_admin')}
                                disabled={actingOn === admin.id}
                                className="px-3 py-1.5 text-xs rounded-md border border-violet/30 text-violet hover:bg-violet/10 disabled:opacity-50"
                              >
                                Promote to Super Admin
                              </button>
                            )}
                            {admin.role === 'super_admin' && (
                              <button
                                onClick={() => changeRole(admin.id, 'admin')}
                                disabled={actingOn === admin.id}
                                className="px-3 py-1.5 text-xs rounded-md border border-info/30 text-info hover:bg-info/10 disabled:opacity-50"
                              >
                                Demote to Admin
                              </button>
                            )}
                            <button
                              onClick={() => changeRole(admin.id, 'user')}
                              disabled={actingOn === admin.id}
                              className="px-3 py-1.5 text-xs rounded-md border border-danger/30 text-danger hover:bg-danger/10 disabled:opacity-50"
                            >
                              Revoke admin
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Promote a user */}
          {isSuperAdmin && (
            <div className="bg-surface border border-white/10 shadow rounded-lg p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Promote a user</h2>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="flex-1 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {searchError && (
                <div className="bg-danger/10 border border-danger/30 rounded-md p-3 mb-4">
                  <p className="text-danger text-sm">{searchError}</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <ul className="divide-y divide-white/10 border border-white/10 rounded-md">
                  {searchResults.map((u) => (
                    <li key={u.id} className="px-3 py-2 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-white">{displayName(u)}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${ROLE_COLORS[u.role]}`}>
                          {u.role}
                        </span>
                      </div>
                      {u.role === 'user' ? (
                        <button
                          onClick={() => changeRole(u.id, 'admin')}
                          disabled={actingOn === u.id}
                          className="px-3 py-1.5 text-xs rounded-md border border-info/30 text-info hover:bg-info/10 disabled:opacity-50"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <span className="text-xs text-white/40">Already {u.role}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {passwordTarget && (
        <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-96 shadow-lg rounded-md bg-surface">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Reset Password</h3>
              <button onClick={closePasswordReset} className="text-white/40 hover:text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Set a new password for <span className="font-medium text-white">{displayName(passwordTarget)}</span>. They will
              need to use it on their next login.
            </p>
            <form onSubmit={submitPasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">New password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  autoFocus
                  className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                  placeholder="At least 8 characters"
                />
              </div>
              {passwordError && (
                <div className="bg-danger/10 border border-danger/30 rounded-md p-3">
                  <p className="text-danger text-sm">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-success/10 border border-success/30 rounded-md p-3">
                  <p className="text-success text-sm">{passwordSuccess}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closePasswordReset}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="bg-gold hover:bg-gold-dark text-black font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50"
                >
                  {resettingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
