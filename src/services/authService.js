/**
 * Client authentication and cloud sync service for Anchor.
 * Manages JWT tokens, automatic refresh rotation, remote API communication, and offline-first fallback.
 */

export const BACKEND_OFFLINE_MSG = "Backend server (:5001) is not running. Start the backend or continue in 100% Offline Local Mode.";

/**
 * Safely parse HTTP response text to JSON, avoiding "Unexpected end of JSON input".
 * Surfaces friendly offline error when proxy returns 502/504 or unparseable HTML.
 */
export async function safeParseResponse(res) {
  if (res.status === 502 || res.status === 504) {
    throw new Error(BACKEND_OFFLINE_MSG);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(BACKEND_OFFLINE_MSG);
    }
    data = {};
  }

  if (!res.ok) {
    const errorMsg = data.error || (res.status >= 500 ? BACKEND_OFFLINE_MSG : (data.message || `Request failed with status ${res.status}`));
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Robust fetch wrapper that handles network disconnects and TypeError: Failed to fetch.
 */
export async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (res.status === 502 || res.status === 504) {
      throw new Error(BACKEND_OFFLINE_MSG);
    }
    return res;
  } catch (err) {
    if (err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('network')) {
      throw new Error(BACKEND_OFFLINE_MSG);
    }
    throw err;
  }
}

const TOKEN_KEY = 'anchor_jwt_token';
const USER_KEY = 'anchor_auth_user';
let refreshPromise = null;

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

    let res = await safeFetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // If unauthorized, attempt silent refresh once
    if (res.status === 401 && !url.includes('/api/auth/refresh')) {
      const refreshed = await authService.refreshToken();
      if (refreshed && refreshed.token) {
        headers.Authorization = `Bearer ${refreshed.token}`;
        res = await safeFetch(url, {
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
    const res = await safeFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, role, guestData })
    });

    const data = await safeParseResponse(res);
    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  login: async (email, password, guestData = null) => {
    const res = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, guestData })
    });

    const data = await safeParseResponse(res);
    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  loginWithGoogle: async ({ credential, token, access_token, email, name, googleId, avatar, guestData }) => {
    const res = await safeFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential, token, access_token, email, name, googleId, avatar, guestData })
    });

    const data = await safeParseResponse(res);
    authService.setToken(data.token);
    authService.setStoredUser(data.user);
    return data;
  },

  refreshToken: async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const res = await safeFetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!res.ok) {
          authService.clearAuth();
          return null;
        }

        const data = await safeParseResponse(res);
        if (data.token) {
          authService.setToken(data.token);
          if (data.user) authService.setStoredUser(data.user);
        }
        return data;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  logout: async () => {
    try {
      await safeFetch('/api/auth/logout', {
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
    const data = await safeParseResponse(res);
    authService.clearAuth();
    return data;
  },

  exportData: async () => {
    const res = await authService.fetchWithAuth('/api/auth/export');
    const data = await safeParseResponse(res);
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
      const data = await safeParseResponse(res);
      if (data.user) {
        authService.setStoredUser(data.user);
        return data.user;
      }
      return null;
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
      const data = await safeParseResponse(res);
      return data;
    } catch (err) {
      console.warn('Delta sync failed, local offline fallback active:', err);
      return { success: false, error: err.message };
    }
  }
};
