import { get, set, del } from 'idb-keyval';

/**
 * Custom Async StateStorage adapter for Zustand persist middleware using IndexedDB (idb-keyval).
 * Includes automatic one-time migration from localStorage.
 */
export const idbStorage = {
  getItem: async (name) => {
    try {
      const idbVal = await get(name);
      if (idbVal !== undefined && idbVal !== null) {
        return idbVal;
      }

      // One-time fallback & migration from localStorage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        const localVal = window.localStorage.getItem(name);
        if (localVal) {
          await set(name, localVal);
          return localVal;
        }
      }
      return null;
    } catch (err) {
      console.warn('idbStorage getItem failed, falling back to localStorage:', err);
      return typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
    }
  },

  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch (err) {
      console.warn('idbStorage setItem failed, falling back to localStorage:', err);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      }
    }
  },

  removeItem: async (name) => {
    try {
      await del(name);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      }
    } catch (err) {
      console.warn('idbStorage removeItem failed:', err);
    }
  }
};
