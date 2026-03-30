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

// Redirect to login on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  getAllUsers: () => api.get('/users'),
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
  getAllPools: () => api.get('/admin/pools'),
  updateKYCStatus: (data: {
    userId: string;
    status: 'pending' | 'verified' | 'rejected';
    rejectionReason?: string | null;
  }) => api.put('/admin/kyc/update-status', data),
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

