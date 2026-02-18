// Authentication utilities

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  kycStatus: string;
  role: string;
}

export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }
};

export const setUser = (user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};

export const getUser = (): AuthUser | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const removeAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAccessToken();
  const user = getUser();
  // Check if user has admin role
  return !!token && (user?.role === 'admin' || user?.role === 'super_admin');
};

// Legacy support
export const setAdminToken = (token: string) => {
  setAuthTokens(token);
};

export const getAdminToken = (): string | null => {
  return getAccessToken();
};

export const removeAdminToken = () => {
  removeAuthTokens();
};


