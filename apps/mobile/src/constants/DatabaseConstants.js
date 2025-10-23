// Database Constants for Zarai Dost
// Story 1.1: Local Data Storage Foundation
// Story 1.3: Offline AI Model Storage (added MODEL_METADATA, INFERENCE_CACHE)
// Story 1.4: Offline Image Processing Queue (added upload queue columns)
// Story 1.5: Offline Weather and Advisory Cache (added WEATHER_CACHE, ADVISORIES_CACHE, CACHE_METADATA)
// Story 1.6: Network Status and Sync Monitoring (added SYNC_HISTORY, DATA_USAGE, SYNC_PREFERENCES, SYNC_STATE_METADATA)
// Story 3.1: Image Capture and Upload Interface (added HEALTH_CHECKS, extended IMAGES)
// Story 3.2: On-Device Disease Detection Model (added DISEASES, extended HEALTH_CHECKS/IMAGES)
// Story 3.3: Cloud-Based Enhanced Analysis (added CLOUD_ANALYSIS_QUEUE, extended HEALTH_CHECKS)
// Story 3.5: Local Supplier Integration (added SUPPLIERS, SUPPLIER_PRODUCTS, FARMER_FAVORITE_SUPPLIERS, PRODUCT_ALTERNATIVES, FARMER_CONTRIBUTIONS, SUPPLIER_CONTACT_ATTEMPTS)

export const DATABASE_NAME = 'zarai_dost.db';
export const DATABASE_VERSION = 9; // Updated for Story 3.5

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
  SYNC_HISTORY: 'sync_history', // Story 1.6
  DATA_USAGE: 'data_usage', // Story 1.6
  SYNC_PREFERENCES: 'sync_preferences', // Story 1.6
  SYNC_STATE_METADATA: 'sync_state_metadata', // Story 1.6
  HEALTH_CHECKS: 'health_checks', // Story 3.1
  DISEASES: 'diseases', // Story 3.2
  CLOUD_ANALYSIS_QUEUE: 'cloud_analysis_queue', // Story 3.3
  SUPPLIERS: 'suppliers', // Story 3.5
  SUPPLIER_PRODUCTS: 'supplier_products', // Story 3.5
  FARMER_FAVORITE_SUPPLIERS: 'farmer_favorite_suppliers', // Story 3.5
  PRODUCT_ALTERNATIVES: 'product_alternatives', // Story 3.5
  FARMER_CONTRIBUTIONS: 'farmer_contributions', // Story 3.5
  SUPPLIER_CONTACT_ATTEMPTS: 'supplier_contact_attempts', // Story 3.5
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

