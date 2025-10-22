// Database Constants for Zarai Dost
// Story 1.1: Local Data Storage Foundation
// Story 1.3: Offline AI Model Storage (added MODEL_METADATA, INFERENCE_CACHE)
// Story 1.4: Offline Image Processing Queue (added upload queue columns)
// Story 1.5: Offline Weather and Advisory Cache (added WEATHER_CACHE, ADVISORIES_CACHE, CACHE_METADATA)

export const DATABASE_NAME = 'zarai_dost.db';
export const DATABASE_VERSION = 4; // Updated for Story 1.5

// Table Names
export const TABLES = {
  FARMERS: 'farmers',
  FIELDS: 'fields',
  CROPS: 'crops',
  QUERIES: 'queries',
  IMAGES: 'images',
  MODEL_METADATA: 'model_metadata', // Story 1.3
  INFERENCE_CACHE: 'inference_cache', // Story 1.3
  WEATHER_CACHE: 'weather_cache', // Story 1.5
  ADVISORIES_CACHE: 'advisories_cache', // Story 1.5
  CACHE_METADATA: 'cache_metadata', // Story 1.5
};

// Sync Status
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  FAILED: 'failed',
};

// Query Types
export const QUERY_TYPES = {
  HEALTH: 'health',
  IRRIGATION: 'irrigation',
  MARKET: 'market',
  CLIMATE: 'climate',
  GENERAL: 'general',
};

// Crop Types
export const CROP_TYPES = {
  WHEAT: 'wheat',
  RICE: 'rice',
  COTTON: 'cotton',
  SUGARCANE: 'sugarcane',
  CORN: 'corn',
  MILLET: 'millet',
  VEGETABLES: 'vegetables',
  OTHER: 'other',
};

// Storage Limits (in MB)
export const STORAGE_LIMITS = {
  MAX_TOTAL_MB: 100,
  MAX_DATABASE_MB: 20,
  MAX_IMAGES: 50,
  QUERY_RETENTION_DAYS: 90,
};

// Soil Types
export const SOIL_TYPES = {
  CLAY: 'clay',
  LOAMY: 'loamy',
  SANDY: 'sandy',
  SILT: 'silt',
  MIXED: 'mixed',
  UNKNOWN: 'unknown',
};

// Crop Status
export const CROP_STATUS = {
  PLANTED: 'planted',
  GROWING: 'growing',
  MATURE: 'mature',
  HARVESTED: 'harvested',
  FAILED: 'failed',
};

