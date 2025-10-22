// Sync Constants
// Story 1.2: Background Synchronization Service
// Defines sync intervals, retry config, and sync settings

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  FAILED: 'failed',
};

export const SYNC_PRIORITY = {
  HIGH: 'high',      // User-initiated sync
  NORMAL: 'normal',  // Auto-sync on connection
  LOW: 'low',        // Background sync
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 6,
  INITIAL_DELAY: 1000,      // 1 second
  MAX_DELAY: 60000,         // 60 seconds
  BACKOFF_MULTIPLIER: 2,
};

export const BACKGROUND_SYNC_CONFIG = {
  MIN_INTERVAL: 15 * 60,    // 15 minutes (platform minimum)
  BATTERY_THRESHOLD: 20,     // Skip sync if battery < 20%
  WIFI_ONLY: false,         // Default: sync on any connection
};

export const SYNC_BATCH_SIZE = {
  FARMERS: 50,
  FIELDS: 50,
  CROPS: 50,
  QUERIES: 100,
  IMAGES: 20,  // Images are larger
};

export const SYNC_EVENTS = {
  SYNC_STARTED: 'sync_started',
  SYNC_PROGRESS: 'sync_progress',
  SYNC_SUCCESS: 'sync_success',
  SYNC_FAILED: 'sync_failed',
  SYNC_CONFLICT: 'sync_conflict',
  NETWORK_CHANGED: 'network_changed',
};

export const CONNECTION_TYPES = {
  WIFI: 'wifi',
  CELLULAR: 'cellular',
  NONE: 'none',
  UNKNOWN: 'unknown',
};
