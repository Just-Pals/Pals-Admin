'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { userAPI } from '@/lib/api';

interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  kycStatus: string;
  dob?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getAllUsers();
      setUsers(response.data.data?.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage all registered users
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {(user.name || user.firstName || user.email || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name ||
                                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                                user.email ||
                                user.phone ||
                                'Unnamed User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email || user.phone || 'No contact info'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {user.isVerified ? (
                              <span className="text-green-600 text-xs">✓ Verified</span>
                            ) : (
                              <span className="text-yellow-600 text-xs">⚠ Unverified</span>
                            )}
                            {getStatusBadge(user.kycStatus)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.role} • {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.name ||
                      `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Verified</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.isVerified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">KYC Status</label>
                  <p className="text-sm text-gray-900">{selectedUser.kycStatus}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedUser.dob)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900">{selectedUser.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

