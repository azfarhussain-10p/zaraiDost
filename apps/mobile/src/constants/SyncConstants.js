// Sync Monitoring Constants
// Story 1.6: Network Status and Sync Monitoring

/**
 * Connection Status Types and Display Configuration
 */
export const CONNECTION_STATUS = {
  WIFI: {
    type: 'wifi',
    color: '#22c55e', // green-500
    icon: 'wifi',
    label: 'WiFi',
    canSync: true,
    quality: 'excellent',
  },
  CELLULAR_5G: {
    type: 'cellular',
    subtype: '5G',
    color: '#22c55e', // green-500
    icon: 'signal-cellular-5',
    label: '5G',
    canSync: true,
    quality: 'excellent',
  },
  CELLULAR_4G: {
    type: 'cellular',
    subtype: '4G',
    color: '#22c55e', // green-500
    icon: 'signal-cellular-4',
    label: '4G',
    canSync: true,
    quality: 'good',
  },
  CELLULAR_3G: {
    type: 'cellular',
    subtype: '3G',
    color: '#eab308', // yellow-500
    icon: 'signal-cellular-3',
    label: '3G',
    canSync: true,
    quality: 'moderate',
  },
  CELLULAR_2G: {
    type: 'cellular',
    subtype: '2G',
    color: '#f97316', // orange-500
    icon: 'signal-cellular-2',
    label: '2G (Slow)',
    canSync: true,
    quality: 'poor',
  },
  OFFLINE: {
    type: 'none',
    color: '#ef4444', // red-500
    icon: 'wifi-off',
    label: 'Offline',
    canSync: false,
    quality: 'none',
  },
  UNKNOWN: {
    type: 'unknown',
    color: '#9ca3af', // gray-400
    icon: 'help-circle',
    label: 'Unknown',
    canSync: false,
    quality: 'unknown',
  },
};

/**
 * Sync Status Types
 */
export const SYNC_STATE = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  PAUSED: 'paused',
};

/**
 * Sync Trigger Types
 */
export const SYNC_TRIGGER = {
  AUTOMATIC: 'automatic',
  MANUAL: 'manual',
  CONNECTIVITY_RESTORED: 'connectivity_restored',
  BACKGROUND: 'background',
  SCHEDULED: 'scheduled',
};

/**
 * Sync Operation Status
 */
export const SYNC_OPERATION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
};

/**
 * Entity Change Types
 */
export const CHANGE_TYPE = {
  NEW: 'new',
  UPDATED: 'updated',
  DELETED: 'deleted',
};

/**
 * Sync Frequency Options (in hours)
 */
export const SYNC_FREQUENCY = {
  MANUAL: -1,
  EVERY_6_HOURS: 6,
  EVERY_12_HOURS: 12,
  EVERY_24_HOURS: 24,
  EVERY_WEEK: 168,
};

/**
 * Sync History Limits
 */
export const SYNC_HISTORY_LIMITS = {
  MAX_ENTRIES: 30, // Keep last 30 sync operations
  AUTO_CLEANUP_DAYS: 30, // Delete history older than 30 days
  MAX_ERROR_MESSAGES: 10, // Store up to 10 error messages per sync
};

/**
 * Data Usage Thresholds (in MB)
 */
export const DATA_USAGE_THRESHOLDS = {
  WARNING: 50, // Warn user at 50MB
  LIMIT: 100, // Suggest WiFi-only at 100MB
  DAILY_TARGET: 10, // Target max 10MB per day on cellular
  WEEKLY_TARGET: 50, // Target max 50MB per week on cellular
};

/**
 * Sync Performance Thresholds (in milliseconds)
 */
export const SYNC_PERFORMANCE = {
  FAST: 5000, // < 5 seconds
  NORMAL: 30000, // < 30 seconds
  SLOW: 60000, // < 1 minute
  VERY_SLOW: 120000, // < 2 minutes
};

/**
 * Battery Level Thresholds (percentage)
 */
export const BATTERY_THRESHOLDS = {
  CRITICAL: 10, // Never sync below 10%
  LOW: 20, // Skip auto-sync below 20% (if setting enabled)
  SAFE: 50, // Safe to sync
};

/**
 * Network Quality Indicators
 */
export const NETWORK_QUALITY = {
  EXCELLENT: { min: 4, label: 'Excellent', color: '#22c55e' },
  GOOD: { min: 3, label: 'Good', color: '#84cc16' },
  MODERATE: { min: 2, label: 'Moderate', color: '#eab308' },
  POOR: { min: 1, label: 'Poor', color: '#f97316' },
  NONE: { min: 0, label: 'No Connection', color: '#ef4444' },
};

/**
 * Entity Types for Sync Tracking
 */
export const SYNC_ENTITIES = {
  FARMERS: 'farmers',
  FIELDS: 'fields',
  CROPS: 'crops',
  QUERIES: 'queries',
  IMAGES: 'images',
  AI_MODELS: 'ai_models',
  WEATHER_CACHE: 'weather_cache',
  ADVISORIES: 'advisories',
};

/**
 * Default Sync Preferences
 */
export const DEFAULT_SYNC_PREFERENCES = {
  wifiOnlyMode: false,
  backgroundSyncEnabled: true,
  syncFrequencyHours: SYNC_FREQUENCY.EVERY_6_HOURS,
  autoImageUpload: true,
  lowBatterySkipSync: true,
};

/**
 * Time Format Constants
 */
export const TIME_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  HUMAN_READABLE: 'relative', // "2 hours ago"
};

/**
 * Sync Progress Steps
 */
export const SYNC_PROGRESS_STEPS = {
  PREPARING: { order: 1, label: 'Preparing sync...', percentage: 0 },
  VALIDATING: { order: 2, label: 'Validating data...', percentage: 10 },
  UPLOADING_QUERIES: { order: 3, label: 'Uploading queries...', percentage: 20 },
  UPLOADING_IMAGES: { order: 4, label: 'Uploading images...', percentage: 40 },
  UPLOADING_DATA: { order: 5, label: 'Uploading changes...', percentage: 60 },
  DOWNLOADING: { order: 6, label: 'Downloading updates...', percentage: 80 },
  FINALIZING: { order: 7, label: 'Finalizing...', percentage: 90 },
  COMPLETE: { order: 8, label: 'Sync complete!', percentage: 100 },
};

/**
 * Error Categories
 */
export const SYNC_ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown',
};

/**
 * Connection Type Detection
 * Maps React Native NetInfo types to our CONNECTION_STATUS
 */
export const CONNECTION_TYPE_MAP = {
  wifi: CONNECTION_STATUS.WIFI,
  cellular: CONNECTION_STATUS.CELLULAR_4G, // Default to 4G if subtype unknown
  ethernet: CONNECTION_STATUS.WIFI, // Treat ethernet as WiFi
  wimax: CONNECTION_STATUS.CELLULAR_3G,
  vpn: CONNECTION_STATUS.WIFI, // VPN typically over WiFi
  other: CONNECTION_STATUS.UNKNOWN,
  none: CONNECTION_STATUS.OFFLINE,
  unknown: CONNECTION_STATUS.UNKNOWN,
};

/**
 * Cellular Subtype Mapping
 */
export const CELLULAR_SUBTYPE_MAP = {
  '5g': CONNECTION_STATUS.CELLULAR_5G,
  '4g': CONNECTION_STATUS.CELLULAR_4G,
  'lte': CONNECTION_STATUS.CELLULAR_4G,
  '3g': CONNECTION_STATUS.CELLULAR_3G,
  'hspa': CONNECTION_STATUS.CELLULAR_3G,
  'hsdpa': CONNECTION_STATUS.CELLULAR_3G,
  '2g': CONNECTION_STATUS.CELLULAR_2G,
  'edge': CONNECTION_STATUS.CELLULAR_2G,
  'gprs': CONNECTION_STATUS.CELLULAR_2G,
};

export default {
  CONNECTION_STATUS,
  SYNC_STATE,
  SYNC_TRIGGER,
  SYNC_OPERATION_STATUS,
  CHANGE_TYPE,
  SYNC_FREQUENCY,
  SYNC_HISTORY_LIMITS,
  DATA_USAGE_THRESHOLDS,
  SYNC_PERFORMANCE,
  BATTERY_THRESHOLDS,
  NETWORK_QUALITY,
  SYNC_ENTITIES,
  DEFAULT_SYNC_PREFERENCES,
  TIME_FORMATS,
  SYNC_PROGRESS_STEPS,
  SYNC_ERROR_CATEGORIES,
  CONNECTION_TYPE_MAP,
  CELLULAR_SUBTYPE_MAP,
};
