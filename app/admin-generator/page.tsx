'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { adminAPI } from '@/lib/api';

interface GeneratedAdmin {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Credentials {
  username: string;
  email: string;
  password: string;
}

export default function AdminGeneratorPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAdmin, setGeneratedAdmin] = useState<GeneratedAdmin | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setGeneratedAdmin(null);
    setCredentials(null);

    try {
      const response = await adminAPI.generateAdmin({
        email: email || undefined,
        username: username || undefined,
        customPassword: useCustomPassword ? customPassword : undefined,
      });

      if (response.data.success) {
        setGeneratedAdmin(response.data.data.admin);
        setCredentials(response.data.data.credentials);
        // Clear form
        setEmail('');
        setUsername('');
        setCustomPassword('');
        setUseCustomPassword(false);
      } else {
        setError(response.data.message || 'Failed to generate admin');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to generate admin user'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Generate Admin User</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create a new admin user with auto-generated credentials
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Details</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If not provided, email will be optional
                  </p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username (Optional)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave empty for auto-generated"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If not provided, a random username will be generated (e.g., admin1234)
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={useCustomPassword}
                      onChange={(e) => setUseCustomPassword(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use custom password
                    </span>
                  </label>
                </div>

                {useCustomPassword && (
                  <div>
                    <label htmlFor="customPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Password
                    </label>
                    <input
                      id="customPassword"
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Admin User'
                  )}
                </button>
              </form>
            </div>

            {/* Results */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Credentials</h2>

              {credentials ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Save these credentials now! They will not be shown again.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Username
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono">
                          {credentials.username}
                        </code>
                        <button
                          onClick={() => copyToClipboard(credentials.username)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {credentials.email !== 'N/A' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Email
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono">
                            {credentials.email}
                          </code>
                          <button
                            onClick={() => copyToClipboard(credentials.email)}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Password
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md text-sm font-mono">
                          {showPassword ? credentials.password : '••••••••••••'}
                        </code>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(credentials.password)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Info</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>ID: {generatedAdmin?.id}</p>
                      <p>Role: {generatedAdmin?.role}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="mt-4 text-sm">Generated credentials will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


