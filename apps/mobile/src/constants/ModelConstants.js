// AI Model Constants for Zarai Dost
// Story 1.3: Offline AI Model Storage
// Implements: Task 1.4 (Model configuration and settings)

/**
 * Model Names
 */
export const MODEL_NAMES = {
  DISEASE_DETECTION: 'disease_detection',
  PEST_DETECTION: 'pest_detection', // Future
  NUTRIENT_DEFICIENCY: 'nutrient_deficiency', // Future
};

/**
 * Model Versions
 * Update these when deploying new model versions
 */
export const MODEL_VERSIONS = {
  DISEASE_DETECTION: 'v1.0.0',
  // Future versions will increment: v1.1.0, v1.2.0, etc.
};

/**
 * Model File Paths (relative to app document directory)
 */
export const MODEL_PATHS = {
  BASE_DIR: 'models',
  DISEASE_DETECTION: 'models/disease_detection.tflite',
};

/**
 * Model Download URLs
 * These should point to your backend/CDN where models are hosted
 */
export const MODEL_DOWNLOAD_URLS = {
  // Replace with actual URLs when backend is ready
  DISEASE_DETECTION: 'https://api.zaraidost.com/models/disease_detection_v1.0.0.tflite',
  // For development, we'll use a mock/test model
  DISEASE_DETECTION_TEST: 'https://storage.googleapis.com/download.tensorflow.org/models/mobilenet_v1_1.0_224_quant.tflite',
};

/**
 * Model Status
 */
export const MODEL_STATUS = {
  NOT_DOWNLOADED: 'not_downloaded',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UPDATE_AVAILABLE: 'update_available',
};

/**
 * Model Storage Limits
 * AC2: Models compressed to fit within 100MB app size limit
 */
export const MODEL_STORAGE_LIMITS = {
  MAX_TOTAL_SIZE_MB: 50, // Target max for all models
  MAX_SINGLE_MODEL_MB: 30, // Max size per model
  DISEASE_DETECTION_TARGET_MB: 25, // Target size for disease detection model
};

/**
 * Model Input Specifications
 * Based on MobileNet architecture (standard for disease detection)
 */
export const MODEL_INPUT_SPECS = {
  DISEASE_DETECTION: {
    width: 224,
    height: 224,
    channels: 3,
    format: 'RGB',
    normalize: true, // Normalize to [0, 1] or [-1, 1]
    normalizationRange: [0, 1], // [min, max] for normalization
  },
};

/**
 * Model Output Specifications
 */
export const MODEL_OUTPUT_SPECS = {
  DISEASE_DETECTION: {
    numClasses: 50, // 50+ diseases for Pakistani crops
    confidenceThreshold: 0.5, // Minimum confidence to show prediction
    topKResults: 5, // Show top 5 predictions
  },
};

/**
 * Disease Classes
 * These should match the model training labels
 * Covers Pakistani crops: wheat, rice, cotton, sugarcane, corn
 */
export const DISEASE_CLASSES = {
  // Wheat diseases
  WHEAT_LEAF_RUST: 'wheat_leaf_rust',
  WHEAT_YELLOW_RUST: 'wheat_yellow_rust',
  WHEAT_STEM_RUST: 'wheat_stem_rust',
  WHEAT_POWDERY_MILDEW: 'wheat_powdery_mildew',
  WHEAT_SEPTORIA: 'wheat_septoria',
  WHEAT_FUSARIUM: 'wheat_fusarium',

  // Rice diseases
  RICE_BLAST: 'rice_blast',
  RICE_BROWN_SPOT: 'rice_brown_spot',
  RICE_BACTERIAL_BLIGHT: 'rice_bacterial_blight',
  RICE_SHEATH_BLIGHT: 'rice_sheath_blight',
  RICE_TUNGRO: 'rice_tungro',

  // Cotton diseases
  COTTON_LEAF_CURL: 'cotton_leaf_curl',
  COTTON_BACTERIAL_BLIGHT: 'cotton_bacterial_blight',
  COTTON_FUSARIUM_WILT: 'cotton_fusarium_wilt',
  COTTON_ROOT_ROT: 'cotton_root_rot',

  // Sugarcane diseases
  SUGARCANE_RED_ROT: 'sugarcane_red_rot',
  SUGARCANE_SMUT: 'sugarcane_smut',
  SUGARCANE_RUST: 'sugarcane_rust',

  // Corn diseases
  CORN_NORTHERN_LEAF_BLIGHT: 'corn_northern_leaf_blight',
  CORN_COMMON_RUST: 'corn_common_rust',
  CORN_GRAY_LEAF_SPOT: 'corn_gray_leaf_spot',

  // Pests
  APHIDS: 'aphids',
  WHITEFLY: 'whitefly',
  BOLLWORM: 'bollworm',

  // Nutrient deficiencies
  NITROGEN_DEFICIENCY: 'nitrogen_deficiency',
  PHOSPHORUS_DEFICIENCY: 'phosphorus_deficiency',
  POTASSIUM_DEFICIENCY: 'potassium_deficiency',
  IRON_DEFICIENCY: 'iron_deficiency',

  // Healthy
  HEALTHY: 'healthy',
  UNKNOWN: 'unknown',
};

/**
 * Inference Cache Settings
 * Implements: Task 5 (Result caching fallback)
 */
export const CACHE_SETTINGS = {
  MAX_CACHE_SIZE: 1000, // Maximum cached predictions
  CACHE_EXPIRY_DAYS: 30, // Expire cache after 30 days
  PERCEPTUAL_HASH_SIZE: 8, // 8x8 hash for image similarity
  SIMILARITY_THRESHOLD: 0.9, // 90% similarity to match cached result
};

/**
 * Model Download Settings
 * Implements: Task 2 (Model download and caching)
 */
export const DOWNLOAD_SETTINGS = {
  CHUNK_SIZE_KB: 1024, // 1MB chunks for progress tracking
  TIMEOUT_MS: 300000, // 5 minute timeout for downloads
  RETRY_ATTEMPTS: 3, // Retry failed downloads 3 times
  RETRY_DELAY_MS: 2000, // 2 second delay between retries
  WIFI_ONLY_DEFAULT: true, // Only download on WiFi by default
};

/**
 * Performance Requirements
 * AC3: On-device inference works without network calls
 * Source: architecture/non-functional-specifications.md
 */
export const PERFORMANCE_REQUIREMENTS = {
  MAX_INFERENCE_TIME_MS: 5000, // <5 seconds per inference
  MAX_MODEL_LOAD_TIME_MS: 3000, // <3 seconds to load model
  MAX_MEMORY_MB: 200, // Target max memory usage
};

/**
 * Model Update Settings
 * Implements: Task 3 (Model versioning system)
 */
export const UPDATE_SETTINGS = {
  CHECK_INTERVAL_HOURS: 24, // Check for updates daily
  AUTO_UPDATE_WIFI_ONLY: true,
  NOTIFY_USER_ON_UPDATE: true,
  KEEP_OLD_VERSIONS: 1, // Keep 1 old version for rollback
};

/**
 * Mock Mode Settings
 * For development when backend is not ready
 */
export const MOCK_MODE = {
  ENABLED: true, // Set to false when backend is ready
  USE_TEST_MODEL: true, // Use small MobileNet test model
  SIMULATE_DOWNLOAD_DELAY_MS: 2000, // Simulate network delay
  MOCK_PREDICTIONS: true, // Return mock predictions
};

/**
 * Checksum Algorithm
 * For model integrity verification
 */
export const CHECKSUM_ALGORITHM = 'SHA256';

export default {
  MODEL_NAMES,
  MODEL_VERSIONS,
  MODEL_PATHS,
  MODEL_DOWNLOAD_URLS,
  MODEL_STATUS,
  MODEL_STORAGE_LIMITS,
  MODEL_INPUT_SPECS,
  MODEL_OUTPUT_SPECS,
  DISEASE_CLASSES,
  CACHE_SETTINGS,
  DOWNLOAD_SETTINGS,
  PERFORMANCE_REQUIREMENTS,
  UPDATE_SETTINGS,
  MOCK_MODE,
  CHECKSUM_ALGORITHM,
};
