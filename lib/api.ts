import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pals.money/api/';
/** Base origin for building media URLs (e.g. preview via /api/media/public/:id) */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  // For FormData uploads, let browser set Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Redirect to login on 401 (expired/invalid token) — but NOT for a failed login
// attempt itself. A wrong-password 401 on /auth/login is a normal form error,
// not an expired session; without this check the redirect fired immediately,
// wiping the login form (including whatever the user had typed) before the
// error message could ever render.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const hadToken = !!localStorage.getItem('accessToken');
      const isLoginRequest = typeof error.config?.url === 'string' && error.config.url.includes('/auth/login');
      if (hadToken && !isLoginRequest) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data: { login: string; password: string }) =>
    api.post('/auth/login', data),
};

// User APIs (admin: /users requires admin role)
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  getAllUsers: (params?: { q?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    const query = queryParams.toString();
    return api.get(`/users${query ? `?${query}` : ''}`);
  },
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    address?: string;
    avatar?: string;
  }) => api.put('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
};

// KYC APIs (user-facing)
export const kycAPI = {
  submitKYC: (data: {
    firstName: string;
    lastName: string;
    dob: string;
    profilePhoto?: string;
    governmentIdType: 'passport' | 'driving_license' | 'national_id' | 'other';
    governmentIdFront?: string;
    governmentIdBack?: string;
    address: string;
    email?: string;
    phone?: string;
    additionalKycData?: Record<string, string>;
  }) => api.post('/kyc/submit', data),

  getKYCStatus: () => api.get('/kyc/status'),
};

// Health Check
export const healthAPI = {
  check: () => api.get('/health'),
  wake: () => api.get('/wake'),
};

// Admin APIs (require admin role)
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getKycQueue: (params?: { status?: 'pending' | 'verified' | 'rejected'; page?: number; perPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/kyc/queue${query ? `?${query}` : ''}`);
  },
  getAllPools: (params?: { page?: number; perPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/pools${query ? `?${query}` : ''}`);
  },
  getPoolDetail: (id: string) => api.get(`/admin/pools/${id}`),
  getUserDetail: (id: string) => api.get(`/admin/users/${id}`),
  listAdmins: () => api.get('/admin/admins'),
  updateUserRole: (id: string, role: 'user' | 'admin' | 'super_admin') =>
    api.put(`/admin/users/${id}/role`, { role }),
  resetUserPassword: (id: string, newPassword: string) =>
    api.put(`/admin/users/${id}/reset-password`, { newPassword }),
  getComplianceLogs: (params?: { userId?: string; action?: string; page?: number; perPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/compliance-logs${query ? `?${query}` : ''}`);
  },
  updateKYCStatus: (data: {
    userId: string;
    status: 'pending' | 'verified' | 'rejected';
    rejectionReason?: string | null;
  }) => api.put('/admin/kyc/update-status', data),
};

// Loan APIs (admin: require admin role)
export const loanAdminAPI = {
  listLoans: (params?: {
    status?: 'requested' | 'approved' | 'rejected' | 'active' | 'repaid' | 'defaulted';
    page?: number;
    perPage?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/loans${query ? `?${query}` : ''}`);
  },
  getLoanDetail: (id: string) => api.get(`/admin/loans/${id}`),
};

// SOS APIs (admin: require admin role)
export const sosAdminAPI = {
  listSos: (params?: { status?: 'active' | 'resolved' | 'cancelled'; page?: number; perPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/sos${query ? `?${query}` : ''}`);
  },
  getSosDetail: (id: string) => api.get(`/admin/sos/${id}`),
};

// Wallet APIs (admin: require admin role)
export const walletAdminAPI = {
  getOverview: () => api.get('/admin/wallet/overview'),
  getLargeTransactions: (params?: {
    minAmount?: number;
    type?: 'add_money' | 'withdraw' | 'transfer_in' | 'transfer_out';
    page?: number;
    perPage?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.minAmount !== undefined) queryParams.append('minAmount', params.minAmount.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/wallet/transactions${query ? `?${query}` : ''}`);
  },
};

// Gold APIs (admin: require admin role, except getPrice which is any authenticated user)
export const goldAdminAPI = {
  getPrice: () => api.get('/gold/price'),
  getReserve: () => api.get('/admin/gold/reserves'),
  listWithdrawals: (params?: { status?: 'pending' | 'completed' | 'cancelled'; page?: number; perPage?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    const query = queryParams.toString();
    return api.get(`/admin/gold/withdrawals${query ? `?${query}` : ''}`);
  },
  completeWithdrawal: (id: string) => api.put(`/admin/gold/withdrawals/${id}/complete`),
  cancelWithdrawal: (id: string) => api.put(`/admin/gold/withdrawals/${id}/cancel`),
};

// Media APIs (upload, get by ID)
export const mediaAPI = {
  uploadMedia: (file: File, type: string, entityType?: string, entityId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);
    return api.post('/media/upload', formData);
  },
  getMediaById: (id: string) => api.get(`/media/${id}`),
};

// Blog APIs
export const blogAPI = {
  getAllBlogs: (params?: { page?: number; perPage?: number; status?: 'draft' | 'published' | 'archived' }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return api.get(`/blogs${query ? `?${query}` : ''}`);
  },
  
  getBlogById: (id: string) => api.get(`/blogs/${id}`),
  
  getBlogBySlug: (slug: string) => api.get(`/blogs/slug/${slug}`),
  
  createBlog: (data: {
    title: string;
    summary?: string;
    content: string;
    coverMediaId?: string | null;
    coverImageUrl?: string | null;
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
  }) => api.post('/blogs', data),

  updateBlog: (id: string, data: {
    title?: string;
    summary?: string;
    content?: string;
    coverMediaId?: string | null;
    coverImageUrl?: string | null;
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
  }) => api.put(`/blogs/${id}`, data),
  
  deleteBlog: (id: string) => api.delete(`/blogs/${id}`),
};

export default api;

