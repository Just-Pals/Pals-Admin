import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pals-back.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (check admin token first, then regular token)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Check for admin token first (for admin panel)
    const adminToken = localStorage.getItem('admin_token');
    const regularToken = localStorage.getItem('token');
    const token = adminToken || regularToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (data: {
    name?: string;
    email?: string;
    phone?: string;
    password: string;
    dob?: string;
    address?: string;
  }) => api.post('/auth/signup', data),

  login: (data: { email?: string; phone?: string; password: string }) =>
    api.post('/auth/login', data),

  sendOTP: (data: { email?: string; phone?: string }) =>
    api.post('/auth/send-otp', data),

  verifyOTP: (data: { email?: string; phone?: string; otp: string }) =>
    api.post('/auth/verify-otp', data),

  forgotPassword: (data: { email?: string; phone?: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: {
    email?: string;
    phone?: string;
    otp: string;
    newPassword: string;
  }) => api.post('/auth/reset-password', data),

  getMe: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
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

// Admin APIs (separate from regular auth)
export const adminAPI = {
  login: (data: { email?: string; username?: string; password: string }) =>
    api.post('/admin/login', data),

  register: (data: { email: string; password: string }) =>
    api.post('/admin/register', data),

  getMe: () => api.get('/admin/me'),

  generateAdmin: (data: {
    email?: string;
    username?: string;
    customPassword?: string;
  }) => api.post('/admin/generate', data),

  updateKYCStatus: (data: { userId: string; status: 'pending' | 'completed' | 'rejected' }) =>
    api.put('/admin/kyc/update-status', data),
};

export default api;

