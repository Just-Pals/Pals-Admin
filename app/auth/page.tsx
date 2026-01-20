'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import {
  authAPI,
  userAPI,
  kycAPI,
  healthAPI,
  adminAPI,
} from '@/lib/api';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'auth' | 'user' | 'kyc' | 'health' | 'admin'>('auth');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth form states
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    dob: '',
    address: '',
  });
  const [loginData, setLoginData] = useState({ email: '', phone: '', password: '' });
  const [otpData, setOtpData] = useState({ email: '', phone: '', otp: '' });
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: '', phone: '' });
  const [resetPasswordData, setResetPasswordData] = useState({
    email: '',
    phone: '',
    otp: '',
    newPassword: '',
  });

  // User form states
  const [updateProfileData, setUpdateProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
  });
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  // KYC form states
  const [kycData, setKycData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    governmentIdType: 'passport' as 'passport' | 'driving_license' | 'national_id' | 'other',
    address: '',
    email: '',
    phone: '',
  });

  // Admin form states
  const [adminLoginData, setAdminLoginData] = useState({ email: '', username: '', password: '' });
  const [adminRegisterData, setAdminRegisterData] = useState({ email: '', password: '' });

  const handleAPI = async (apiCall: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiCall();
      setResponse(res.data);
      if (res.data.data?.token) {
        // Check if it's an admin token (from admin login/register)
        if (res.data.data?.user?.role === 'admin') {
          localStorage.setItem('admin_token', res.data.data.token);
        } else {
          localStorage.setItem('token', res.data.data.token);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">API Testing</h1>
            <p className="mt-2 text-sm text-gray-600">
              Test all backend API endpoints
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {(['auth', 'user', 'kyc', 'health', 'admin'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      clearResponse();
                    }}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forms */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">{activeTab} APIs</h2>

              {activeTab === 'auth' && (
                <div className="space-y-6">
                  {/* Signup */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Signup</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={signupData.name}
                        onChange={(e) =>
                          setSignupData({ ...signupData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={signupData.phone}
                        onChange={(e) =>
                          setSignupData({ ...signupData, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({ ...signupData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() =>
                          handleAPI(() => authAPI.signup(signupData))
                        }
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Signup
                      </button>
                    </div>
                  </div>

                  {/* Login */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Login</h3>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleAPI(() => authAPI.login(loginData))}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Login
                      </button>
                    </div>
                  </div>

                  {/* Send OTP */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Send OTP</h3>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        value={otpData.email}
                        onChange={(e) =>
                          setOtpData({ ...otpData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() =>
                          handleAPI(() =>
                            authAPI.sendOTP({ email: otpData.email || undefined })
                          )
                        }
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send OTP
                      </button>
                    </div>
                  </div>

                  {/* Verify OTP */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Verify OTP</h3>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        value={otpData.email}
                        onChange={(e) =>
                          setOtpData({ ...otpData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="text"
                        placeholder="OTP"
                        value={otpData.otp}
                        onChange={(e) =>
                          setOtpData({ ...otpData, otp: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() =>
                          handleAPI(() =>
                            authAPI.verifyOTP({
                              email: otpData.email || undefined,
                              otp: otpData.otp,
                            })
                          )
                        }
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>

                  {/* Get Me */}
                  <div>
                    <h3 className="font-medium mb-3">Get Current User</h3>
                    <button
                      onClick={() => handleAPI(() => authAPI.getMe())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Get Me
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'user' && (
                <div className="space-y-6">
                  {/* Get Profile */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Get Profile</h3>
                    <button
                      onClick={() => handleAPI(() => userAPI.getProfile())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Get Profile
                    </button>
                  </div>

                  {/* Update Profile */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Update Profile</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={updateProfileData.name}
                        onChange={(e) =>
                          setUpdateProfileData({
                            ...updateProfileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={updateProfileData.email}
                        onChange={(e) =>
                          setUpdateProfileData({
                            ...updateProfileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() =>
                          handleAPI(() => userAPI.updateProfile(updateProfileData))
                        }
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Update Profile
                      </button>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Change Password</h3>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={changePasswordData.currentPassword}
                        onChange={(e) =>
                          setChangePasswordData({
                            ...changePasswordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={changePasswordData.newPassword}
                        onChange={(e) =>
                          setChangePasswordData({
                            ...changePasswordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() =>
                          handleAPI(() => userAPI.changePassword(changePasswordData))
                        }
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Get All Users */}
                  <div>
                    <h3 className="font-medium mb-3">Get All Users (Admin)</h3>
                    <button
                      onClick={() => handleAPI(() => userAPI.getAllUsers())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Get All Users
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'kyc' && (
                <div className="space-y-6">
                  {/* Submit KYC */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Submit KYC</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={kycData.firstName}
                        onChange={(e) =>
                          setKycData({ ...kycData, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={kycData.lastName}
                        onChange={(e) =>
                          setKycData({ ...kycData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="date"
                        placeholder="Date of Birth"
                        value={kycData.dob}
                        onChange={(e) =>
                          setKycData({ ...kycData, dob: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <select
                        value={kycData.governmentIdType}
                        onChange={(e) =>
                          setKycData({
                            ...kycData,
                            governmentIdType: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="national_id">National ID</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Address"
                        value={kycData.address}
                        onChange={(e) =>
                          setKycData({ ...kycData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleAPI(() => kycAPI.submitKYC(kycData))}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Submit KYC
                      </button>
                    </div>
                  </div>

                  {/* Get KYC Status */}
                  <div>
                    <h3 className="font-medium mb-3">Get KYC Status</h3>
                    <button
                      onClick={() => handleAPI(() => kycAPI.getKYCStatus())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Get KYC Status
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'health' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Health Check</h3>
                    <button
                      onClick={() => handleAPI(() => healthAPI.check())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Check Health
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Wake Up</h3>
                    <button
                      onClick={() => handleAPI(() => healthAPI.wake())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Wake Up
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-6">
                  {/* Admin Register */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Admin Register</h3>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        value={adminRegisterData.email}
                        onChange={(e) =>
                          setAdminRegisterData({ ...adminRegisterData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={adminRegisterData.password}
                        onChange={(e) =>
                          setAdminRegisterData({ ...adminRegisterData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleAPI(() => adminAPI.register(adminRegisterData))}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Register Admin
                      </button>
                    </div>
                  </div>

                  {/* Admin Login */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Admin Login</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Email or Username"
                        value={adminLoginData.email || adminLoginData.username}
                        onChange={(e) => {
                          const value = e.target.value;
                          const isEmail = value.includes('@');
                          setAdminLoginData({
                            ...adminLoginData,
                            email: isEmail ? value : '',
                            username: !isEmail ? value : '',
                          });
                        }}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={adminLoginData.password}
                        onChange={(e) =>
                          setAdminLoginData({ ...adminLoginData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleAPI(() => adminAPI.login(adminLoginData))}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Admin Login
                      </button>
                    </div>
                  </div>

                  {/* Get Admin Profile */}
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Get Admin Profile</h3>
                    <button
                      onClick={() => handleAPI(() => adminAPI.getMe())}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Get Admin Profile
                    </button>
                  </div>

                  {/* Generate Admin */}
                  <div>
                    <h3 className="font-medium mb-3">Generate Admin</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Use the Generate Admin page for this feature
                    </p>
                    <button
                      onClick={() => window.location.href = '/admin-generator'}
                      className="w-full bg-gray-600 text-white py-2 rounded-md text-sm hover:bg-gray-700"
                    >
                      Go to Generate Admin
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Response */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Response</h2>
                <button
                  onClick={clearResponse}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              {response && !loading && (
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
              {!response && !error && !loading && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No response yet. Make an API call to see the response.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


