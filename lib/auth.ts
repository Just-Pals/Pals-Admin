// Admin authentication utilities

export const ADMIN_TOKEN_KEY = 'admin_token';

export const setAdminToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
};

export const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
};

export const removeAdminToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

