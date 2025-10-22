// Cache Constants for Weather and Advisory Cache
// Story 1.5: Offline Weather and Advisory Cache

/**
 * Cache Size Limits
 */
export const CACHE_SIZE = {
  MAX_TOTAL_MB: 10, // Total cache budget (AC6)
  MAX_WEATHER_MB: 3, // Weather data allocation
  MAX_ADVISORY_MB: 6, // Advisory data allocation
  MAX_METADATA_MB: 1, // Metadata and overhead
};

/**
 * Data Retention Policies
 */
export const RETENTION = {
  WEATHER_DAYS: 7, // Keep last 7 days of weather (AC1)
  ADVISORIES_PER_TYPE: 5, // Keep 5 advisories per type (AC2)
  CRITICAL_ADVISORIES: 10, // Keep up to 10 critical advisories regardless of type
};

/**
 * Cache Refresh Configuration
 */
export const REFRESH = {
  AUTO_INTERVAL_HOURS: 6, // Auto-refresh every 6 hours when online (AC3)
  RETRY_ATTEMPTS: 3, // Number of retry attempts on failure
  RETRY_DELAY_MS: 5000, // Initial retry delay (5 seconds)
  BACKOFF_MULTIPLIER: 2, // Exponential backoff multiplier
  MAX_RETRY_DELAY_MS: 60000, // Maximum retry delay (1 minute)
};

/**
 * Staleness Thresholds (in hours) - AC4, AC5
 */
export const STALENESS = {
  FRESH: 0, // <6 hours old
  ACCEPTABLE: 6, // 6-24 hours old
  STALE: 24, // 24-72 hours old (1-3 days)
  VERY_STALE: 72, // 72-120 hours old (3-5 days)
  CRITICAL: 120, // >5 days old (critical warning)
};

/**
 * Staleness Color Coding for UI
 */
export const STALENESS_COLORS = {
  FRESH: '#10B981', // green-500
  ACCEPTABLE: '#10B981', // green-500
  STALE: '#F59E0B', // amber-500
  VERY_STALE: '#F97316', // orange-500
  CRITICAL: '#EF4444', // red-500
};

/**
 * Staleness Labels for UI
 */
export const STALENESS_LABELS = {
  FRESH: 'Live',
  ACCEPTABLE: 'Recent',
  STALE: 'Outdated',
  VERY_STALE: 'Very Old',
  CRITICAL: 'Critical',
};

/**
 * Advisory Types
 */
export const ADVISORY_TYPES = {
  IRRIGATION: 'irrigation',
  MARKET: 'market',
  CLIMATE: 'climate',
};

/**
 * Advisory Priorities
 */
export const ADVISORY_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
};

/**
 * Weather Forecast Types
 */
export const FORECAST_TYPE = {
  DAILY: 'daily',
  HOURLY: 'hourly',
};

/**
 * Weather Conditions
 */
export const WEATHER_CONDITIONS = {
  SUNNY: 'Sunny',
  PARTLY_CLOUDY: 'Partly Cloudy',
  CLOUDY: 'Cloudy',
  RAINY: 'Rainy',
  STORMY: 'Stormy',
  FOGGY: 'Foggy',
  WINDY: 'Windy',
};

/**
 * Cache Types for metadata tracking
 */
export const CACHE_TYPES = {
  WEATHER: 'weather',
  ADVISORY: 'advisory',
};

/**
 * Refresh Priority Order (highest to lowest)
 */
export const REFRESH_PRIORITY = {
  WEATHER: 1, // Weather forecast (most critical for daily planning)
  CLIMATE: 2, // Climate alerts (urgent notifications)
  MARKET: 3, // Market prices (time-sensitive)
  IRRIGATION: 4, // Irrigation advisories (less time-sensitive)
};

/**
 * Location Scope for Advisories
 */
export const LOCATION_SCOPE = {
  NATIONAL: 'national',
  PROVINCE: 'province',
  DISTRICT: 'district',
  LOCAL: 'local',
};

/**
 * Data Sources
 */
export const DATA_SOURCES = {
  IBM_WEATHER: 'IBM Weather API',
  ZARAI_DOST_AI: 'Zarai Dost AI',
  GOVERNMENT: 'Government Advisory',
  EXPERT_SYSTEM: 'Expert System',
};

/**
 * Convert staleness in hours to appropriate category
 */
export const getStalenessCategory = (hoursOld) => {
  if (hoursOld < STALENESS.ACCEPTABLE) return 'FRESH';
  if (hoursOld < STALENESS.STALE) return 'ACCEPTABLE';
  if (hoursOld < STALENESS.VERY_STALE) return 'STALE';
  if (hoursOld < STALENESS.CRITICAL) return 'VERY_STALE';
  return 'CRITICAL';
};

/**
 * Get color for staleness category
 */
export const getStalenessColor = (category) => {
  return STALENESS_COLORS[category] || STALENESS_COLORS.CRITICAL;
};

/**
 * Get label for staleness category
 */
export const getStalenessLabel = (category) => {
  return STALENESS_LABELS[category] || STALENESS_LABELS.CRITICAL;
};

/**
 * Calculate hours since last update
 */
export const calculateHoursSinceUpdate = (lastUpdated) => {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMs = now - updated;
  return diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
};

/**
 * Check if data needs refresh based on age
 */
export const needsRefresh = (lastUpdated) => {
  const hoursOld = calculateHoursSinceUpdate(lastUpdated);
  return hoursOld >= STALENESS.ACCEPTABLE;
};

/**
 * Check if data is critically stale
 */
export const isCriticallyStale = (lastUpdated) => {
  const hoursOld = calculateHoursSinceUpdate(lastUpdated);
  return hoursOld >= STALENESS.CRITICAL;
};
