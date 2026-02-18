import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pals.money/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Check for access token
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (data: { login: string; password: string }) =>
    api.post('/auth/login', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),

  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dob?: string;
    address?: string;
    avatar?: string;
  }) => api.put('/user/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/user/change-password', data),

  getAllUsers: () => api.get('/user/all'),
};

// KYC APIs
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

// Admin APIs
export const adminAPI = {
  updateKYCStatus: (data: { userId: string; status: 'pending' | 'completed' | 'rejected' }) =>
    api.put('/admin/kyc/update-status', data),
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
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
  }) => api.post('/blogs', data),
  
  updateBlog: (id: string, data: {
    title?: string;
    summary?: string;
    content?: string;
    status?: 'draft' | 'published' | 'archived';
    tags?: string[];
  }) => api.put(`/blogs/${id}`, data),
  
  deleteBlog: (id: string) => api.delete(`/blogs/${id}`),
};

export default api;

