/**
 * Client authentication and cloud sync service for Anchor.
 * Manages JWT tokens, remote API communication, and offline-first fallback.
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

  register: async (email, password, name, role = 'Athlete') => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  fetchMe: async () => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const res = await fetch('/api/sync/delta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lastSyncedAt, mutations })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Delta sync failed, local offline fallback active:', err);
      return { success: false, error: err.message };
    }
  },

  syncToCloud: async (clientPayload) => {
    const token = authService.getToken();
    if (!token) return { success: false, reason: 'unauthenticated' };

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ data: clientPayload })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Sync to cloud failed, will retry later:', err);
      return { success: false, error: err.message };
    }
  },

  fetchFromCloud: async () => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/user/sync', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Fetch from cloud failed:', err);
      return null;
    }
  }
};

