/**
 * Client authentication and cloud sync service for Anchor.
 * Manages JWT tokens, automatic refresh rotation, remote API communication, and offline-first fallback.
 */

const TOKEN_KEY = 'anchor_jwt_token';
const USER_KEY = 'anchor_auth_user';

export const authService = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Could not store token:', e);
    }
  },

  getStoredUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser: (user) => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Could not store user:', e);
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Could not clear auth:', e);
    }
  },

  /**
   * Authenticated fetch helper with automatic token refresh on 401 response.
   */
  fetchWithAuth: async (url, options = {}) => {
    let token = authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    let res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // If unauthorized, attempt silent refresh once
    if (res.status === 401 && !url.includes('/api/auth/refresh')) {
      const refreshed = await authService.refreshToken();
      if (refreshed && refreshed.token) {
        headers.Authorization = `Bearer ${refreshed.token}`;
        res = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      } else {
        authService.clearAuth();
      }
    }

    return res;
  },

  register: async (email, password, name, role = 'Athlete', guestData = null) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, role, guestData })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  login: async (email, password, guestData = null) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, guestData })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  loginWithGoogle: async ({ credential, email, name, googleId, avatar, guestData }) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential, email, name, googleId, avatar, guestData })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate with Google');
    }

    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  refreshToken: async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        authService.clearAuth();
        return null;
      }

      const data = await res.json();
      if (data.token) {
        authService.setToken(data.token);
        if (data.user) authService.setStoredUser(data.user);
      }
      return data;
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      authService.clearAuth();
    }
  },

  logoutAll: async () => {
    try {
      await authService.fetchWithAuth('/api/auth/logout-all', { method: 'POST' });
    } catch (e) {
      console.warn('Logout all request failed:', e);
    } finally {
      authService.clearAuth();
    }
  },

  deleteAccount: async () => {
    const res = await authService.fetchWithAuth('/api/auth/account', { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    authService.clearAuth();
    return data;
  },

  exportData: async () => {
    const res = await authService.fetchWithAuth('/api/auth/export');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to export athlete data');
    return data;
  },

  fetchMe: async () => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await authService.fetchWithAuth('/api/auth/me');
      if (!res.ok) {
        authService.clearAuth();
        return null;
      }
      const data = await res.json();
      authService.setStoredUser(data.user);
      return data.user;
    } catch {
      return authService.getStoredUser();
    }
  },

  syncDelta: async (lastSyncedAt = 0, mutations = {}) => {
    const token = authService.getToken();
    if (!token) return { success: false, reason: 'unauthenticated' };

    try {
      const res = await authService.fetchWithAuth('/api/sync/delta', {
        method: 'POST',
        body: JSON.stringify({ lastSyncedAt, mutations })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Delta sync failed, local offline fallback active:', err);
      return { success: false, error: err.message };
    }
  }
};
