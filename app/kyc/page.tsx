'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { userAPI, adminAPI } from '@/lib/api';

interface User {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  kycStatus?: string;
  profilePhoto?: string;
  governmentIdType?: string;
  governmentIdFront?: string;
  governmentIdBack?: string;
  address?: string;
  dob?: string;
  createdAt: string;
}

export default function KYCPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getAllUsers();
      const allUsers = response.data.data?.users || [];
      // Filter users who have submitted KYC (have firstName or lastName)
      const kycUsers = allUsers.filter(
        (u: User) => u.firstName || u.lastName || u.kycStatus !== 'pending'
      );
      setUsers(kycUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch KYC data');
      console.error('Error fetching KYC data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    return (user.kycStatus || 'pending') === filter;
  });

  const getStatusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const displayStatus = status || 'pending';
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[displayStatus] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {displayStatus}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const statusCounts = {
    all: users.length,
    pending: users.filter((u) => (u.kycStatus || 'pending') === 'pending').length,
    completed: users.filter((u) => u.kycStatus === 'completed').length,
    rejected: users.filter((u) => u.kycStatus === 'rejected').length,
  };

  const handleUpdateKYCStatus = async (userId: string, status: 'completed' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status === 'completed' ? 'approve' : 'reject'} this KYC?`)) {
      return;
    }

    try {
      setUpdatingStatus(userId);
      await adminAPI.updateKYCStatus({ userId, status });
      // Refresh the users list
      await fetchUsers();
      // Update selected user if it's the one being updated
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, kycStatus: status });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update KYC status');
      console.error('Error updating KYC status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Review and manage KYC submissions
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {(['all', 'pending', 'completed', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`${
                      filter === status
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                  >
                    {status} ({statusCounts[status]})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading KYC data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <li key={user._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {user.profilePhoto ? (
                          <Image
                            src={user.profilePhoto}
                            alt="Profile"
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.name || user.email || 'Unnamed'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.email || user.phone || 'No contact'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            ID Type: {user.governmentIdType || 'N/A'} • Submitted:{' '}
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(user.kycStatus)}
                        {(user.kycStatus === 'pending' || !user.kycStatus) && (
                          <>
                            <button
                              onClick={() => handleUpdateKYCStatus(user._id, 'completed')}
                              disabled={updatingStatus === user._id}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus === user._id ? 'Updating...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleUpdateKYCStatus(user._id, 'rejected')}
                              disabled={updatingStatus === user._id}
                              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-3 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingStatus === user._id ? 'Updating...' : 'Reject'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
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
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No KYC submissions found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">KYC Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.name || 'N/A'}
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
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.dob)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ID Type</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.governmentIdType || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedUser.kycStatus || 'pending'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm text-gray-900">{selectedUser.address || 'N/A'}</p>
                </div>
                {selectedUser.profilePhoto && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">Profile Photo</label>
                    <div className="mt-2">
                      <Image
                        src={selectedUser.profilePhoto}
                        alt="Profile"
                        width={128}
                        height={128}
                        unoptimized
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                    </div>
                  </div>
                )}
                {selectedUser.governmentIdFront && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID Front</label>
                    <div className="mt-2">
                      <Image
                        src={selectedUser.governmentIdFront}
                        alt="ID Front"
                        width={400}
                        height={128}
                        unoptimized
                        className="h-32 w-full rounded-lg object-cover border"
                      />
                    </div>
                  </div>
                )}
                {selectedUser.governmentIdBack && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID Back</label>
                    <div className="mt-2">
                      <Image
                        src={selectedUser.governmentIdBack}
                        alt="ID Back"
                        width={400}
                        height={128}
                        unoptimized
                        className="h-32 w-full rounded-lg object-cover border"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-between">
                {(selectedUser.kycStatus === 'pending' || !selectedUser.kycStatus) && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleUpdateKYCStatus(selectedUser._id, 'completed');
                        setShowDetailsModal(false);
                      }}
                      disabled={updatingStatus === selectedUser._id}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus === selectedUser._id ? 'Updating...' : 'Approve KYC'}
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateKYCStatus(selectedUser._id, 'rejected');
                        setShowDetailsModal(false);
                      }}
                      disabled={updatingStatus === selectedUser._id}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus === selectedUser._id ? 'Updating...' : 'Reject KYC'}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md text-sm ml-auto"
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


