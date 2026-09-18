/**
 * Offline-First Bidirectional Delta Synchronization Engine for Anchor.
 * Manages debounced mutation queuing, IndexedDB offline persistence,
 * server reconciliation (Last-Write-Wins), and cross-tab communication.
 */

import { authService } from './authService.js';
import { get, set, del } from 'idb-keyval';

const OFFLINE_QUEUE_KEY = 'anchor_offline_queue';
const LAST_SYNCED_KEY = 'anchor_last_synced_at';
const DEBOUNCE_DELAY_MS = 2000;

class SyncEngine {
  constructor() {
    this.queue = [];
    this.debounceTimer = null;
    this.isSyncing = false;
    this.storeCallback = null;
    this.broadcastChannel = null;

    // Cross-Tab Synchronization Channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('anchor_internal_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_REFRESH') {
            this.notifyStoreRefresh(event.data.payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not initialized:', err);
      }
    }

    // Auto-flush when returning online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncEngine] Network connectivity restored. Draining offline mutation queue...');
        this.flush();
      });

      // Load any previously persisted offline queue
      this.loadOfflineQueue();
    }
  }

  /**
   * Registers a store updater callback so SyncEngine can reconcile incoming server deltas.
   */
  registerStoreCallback(callback) {
    this.storeCallback = callback;
  }

  notifyStoreRefresh(payload) {
    if (this.storeCallback && typeof this.storeCallback === 'function') {
      this.storeCallback(payload);
    }
  }

  getLastSyncedAt() {
    try {
      const val = localStorage.getItem(LAST_SYNCED_KEY);
      return val ? Number(val) : 0;
    } catch {
      return 0;
    }
  }

  setLastSyncedAt(timestamp) {
    try {
      localStorage.setItem(LAST_SYNCED_KEY, String(timestamp));
    } catch (e) {
      console.warn('Could not store lastSyncedAt:', e);
    }
  }

  async loadOfflineQueue() {
    try {
      const persisted = await get(OFFLINE_QUEUE_KEY);
      if (Array.isArray(persisted) && persisted.length > 0) {
        this.queue = [...persisted, ...this.queue];
        // Trigger sync if online
        if (typeof navigator !== 'undefined' && navigator.onLine && authService.getToken()) {
          this.scheduleFlush(1000);
        }
      }
    } catch (err) {
      console.warn('Failed to load offline queue from IndexedDB:', err);
    }
  }

  async persistOfflineQueue() {
    try {
      if (this.queue.length > 0) {
        await set(OFFLINE_QUEUE_KEY, this.queue);
      } else {
        await del(OFFLINE_QUEUE_KEY);
      }
    } catch (err) {
      console.warn('Failed to persist offline queue to IndexedDB:', err);
    }
  }

  /**
   * Enqueues a mutation from the client (e.g. workout completed, food logged, plan updated).
   * @param {'workout' | 'nutrition' | 'routine' | 'plan' | 'bodyweight'} type 
   * @param {object} payload 
   */
  queueMutation(type, payload) {
    if (!payload) return;

    // Deduplicate/replace mutation with same ID if already pending
    const entityId = payload.id;
    if (entityId) {
      this.queue = this.queue.filter(item => !(item.type === type && item.payload?.id === entityId));
    } else if (type === 'plan') {
      // Training plan is a singleton
      this.queue = this.queue.filter(item => item.type !== 'plan');
    }

    this.queue.push({
      type,
      payload: { ...payload, updatedAt: payload.updatedAt || Date.now() },
      enqueuedAt: Date.now()
    });

    this.persistOfflineQueue();
    this.scheduleFlush(DEBOUNCE_DELAY_MS);
  }

  scheduleFlush(delayMs = DEBOUNCE_DELAY_MS) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, delayMs);
  }

  /**
   * Drains the mutation queue and performs bidirectional delta synchronization with the server.
   */
  async flush() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    const token = authService.getToken();
    if (!token) return { success: false, reason: 'unauthenticated' };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SyncEngine] Device is offline. Mutations queued in IndexedDB.');
      return { success: false, reason: 'offline' };
    }

    if (this.isSyncing) {
      // Re-schedule if a sync is actively in flight
      this.scheduleFlush(1500);
      return { success: false, reason: 'in_flight' };
    }

    this.isSyncing = true;
    const batchToSync = [...this.queue];
    const lastSyncedAt = this.getLastSyncedAt();

    // Organize mutations into categorized payload
    const mutations = {
      workouts: [],
      nutrition: [],
      routines: [],
      plan: null,
      bodyweight: []
    };

    for (const item of batchToSync) {
      if (item.type === 'workout') mutations.workouts.push(item.payload);
      else if (item.type === 'nutrition') mutations.nutrition.push(item.payload);
      else if (item.type === 'routine') mutations.routines.push(item.payload);
      else if (item.type === 'plan') mutations.plan = item.payload;
      else if (item.type === 'bodyweight') mutations.bodyweight.push(item.payload);
    }

    try {
      const res = await authService.syncDelta(lastSyncedAt, mutations);

      if (res && res.success) {
        // Remove successfully transmitted items from the queue
        const batchTimestamps = new Set(batchToSync.map(b => b.enqueuedAt));
        this.queue = this.queue.filter(item => !batchTimestamps.has(item.enqueuedAt));
        await this.persistOfflineQueue();

        if (res.serverTime) {
          this.setLastSyncedAt(res.serverTime);
        }

        // Reconcile server delta into client store if any updates returned
        if (res.delta) {
          this.notifyStoreRefresh(res.delta);

          // Broadcast to other open tabs
          if (this.broadcastChannel) {
            try {
              this.broadcastChannel.postMessage({ type: 'SYNC_REFRESH', payload: res.delta });
            } catch (e) {
              // Ignore broadcast errors
            }
          }
        }

        return { success: true, delta: res.delta };
      } else {
        console.warn('[SyncEngine] Delta sync response unsuccessful:', res);
        return { success: false, error: res?.error };
      }
    } catch (err) {
      console.warn('[SyncEngine] Flush network error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls all changes from the server since the given timestamp (default 0 for full rehydration).
   */
  async fullSync(sinceTimestamp = 0) {
    const token = authService.getToken();
    if (!token) return null;

    try {
      const res = await authService.syncDelta(sinceTimestamp, {});
      if (res && res.success) {
        if (res.serverTime) {
          this.setLastSyncedAt(res.serverTime);
        }
        if (res.delta) {
          this.notifyStoreRefresh(res.delta);
        }
        return res.delta;
      }
      return null;
    } catch (err) {
      console.warn('[SyncEngine] Full sync failed:', err);
      return null;
    }
  }
}

export const syncEngine = new SyncEngine();
