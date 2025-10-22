// Inference Constants
// Story 3.2: On-Device Disease Detection Model
// AC1: TensorFlow Lite model runs on-device for disease detection
// AC3: Processing completes within 5 seconds
// AC4: Confidence score displayed for top 3 predictions

/**
 * Model Configuration
 */
export const MODEL_CONFIG = {
  // Model file path
  MODEL_PATH: 'models/disease_detection_v1.tflite',
  MODEL_NAME: 'disease_detection',
  
  // Model input specifications
  INPUT_SIZE: 224, // 224x224 pixels (MobileNet standard)
  INPUT_CHANNELS: 3, // RGB
  INPUT_SHAPE: [1, 224, 224, 3], // [batch, height, width, channels]
  
  // Model output specifications
  NUM_CLASSES: 55, // 55 disease classes from DiseaseClasses.js
  OUTPUT_SHAPE: [1, 55], // [batch, classes]
  
  // Model version tracking
  CURRENT_VERSION: 'v1.0',
  MIN_SUPPORTED_VERSION: 'v1.0',
};

/**
 * Preprocessing Configuration
 * AC7: Image pre-processing (resize, normalize) automated
 */
export const PREPROCESSING_CONFIG = {
  // Resize configuration
  TARGET_SIZE: 224,
  INTERPOLATION: 'bilinear', // 'bilinear' or 'nearest'
  MAINTAIN_ASPECT_RATIO: false,
  
  // Normalization method
  NORMALIZATION: 'zero_one', // 'zero_one' [0,1] or 'neg_one_one' [-1,1]
  NORMALIZATION_MEAN: [0.485, 0.456, 0.406], // ImageNet means (if using)
  NORMALIZATION_STD: [0.229, 0.224, 0.225], // ImageNet stds (if using)
  
  // Data augmentation (if needed for future)
  AUGMENTATION_ENABLED: false,
};

/**
 * Inference Performance Thresholds
 * AC3: Processing completes within 5 seconds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Time limits (milliseconds)
  MAX_INFERENCE_TIME: 5000, // 5 seconds per image (AC3)
  TARGET_INFERENCE_TIME: 3000, // Target: 3 seconds
  MAX_PREPROCESSING_TIME: 1000, // 1 second for preprocessing
  MAX_POSTPROCESSING_TIME: 500, // 0.5 seconds for result parsing
  
  // Multi-image analysis
  MAX_MULTI_IMAGE_TIME: 15000, // 15 seconds for 3 images
  
  // Memory limits
  MAX_MEMORY_MB: 200, // 200MB RAM during inference
  
  // Batch processing
  BATCH_SIZE: 1, // Process one image at a time
  ENABLE_BATCH_INFERENCE: false, // Future optimization
};

/**
 * Confidence and Prediction Thresholds
 * AC4: Confidence score displayed for top 3 predictions
 */
export const PREDICTION_CONFIG = {
  // Top-K predictions to return
  TOP_K: 3, // Return top 3 predictions (AC4)
  
  // Confidence thresholds
  HIGH_CONFIDENCE_THRESHOLD: 0.7, // 70%+ = reliable prediction
  MEDIUM_CONFIDENCE_THRESHOLD: 0.5, // 50-70% = moderate confidence
  LOW_CONFIDENCE_THRESHOLD: 0.3, // 30-50% = low confidence
  MIN_CONFIDENCE_THRESHOLD: 0.1, // Below 10% = ignore
  
  // Cloud verification trigger
  CLOUD_VERIFICATION_THRESHOLD: 0.7, // Below 70% = suggest cloud analysis
  
  // Multi-image aggregation
  MIN_VOTE_WEIGHT: 0.3, // Minimum weight for vote counting
  CONSENSUS_THRESHOLD: 0.6, // 60% agreement across images
};

/**
 * Cache Configuration
 * Extends Story 1.3 inference cache
 */
export const CACHE_CONFIG = {
  ENABLE_CACHING: true,
  CACHE_TTL: 86400000, // 24 hours in milliseconds
  MAX_CACHE_ENTRIES: 100, // Maximum cached predictions
  
  // Image similarity for cache lookup
  SIMILARITY_THRESHOLD: 0.95, // 95% similar = cache hit
  PERCEPTUAL_HASH_ENABLED: false, // Future: perceptual hashing
};

/**
 * Model Optimization Settings
 */
export const OPTIMIZATION_CONFIG = {
  // GPU acceleration
  USE_GPU_DELEGATE: true, // Enable TFLite GPU delegate if available
  GPU_PRECISION: 'float16', // 'float32' or 'float16'
  
  // Model quantization
  QUANTIZED: true, // Model is INT8 quantized
  QUANTIZATION_TYPE: 'int8',
  
  // Model loading
  LAZY_LOAD: true, // Load model on first use, not app startup
  PRELOAD_ON_STARTUP: false, // Override for faster first inference
  WARMUP_ENABLED: true, // Run dummy inference to warm up model
  
  // Thread configuration
  NUM_THREADS: 4, // Number of CPU threads for inference
  
  // Memory optimization
  ALLOW_FP16_PRECISION: true, // Allow FP16 for compatible devices
};

/**
 * Error Handling Configuration
 */
export const ERROR_CONFIG = {
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000,
  
  // Fallback strategies
  FALLBACK_TO_CACHE: true, // Use cached result if inference fails
  FALLBACK_TO_CLOUD: true, // Queue for cloud analysis if on-device fails
  
  // Error types
  ERROR_TYPES: {
    MODEL_NOT_LOADED: 'model_not_loaded',
    INFERENCE_FAILED: 'inference_failed',
    PREPROCESSING_FAILED: 'preprocessing_failed',
    TIMEOUT: 'timeout',
    OUT_OF_MEMORY: 'out_of_memory',
    UNSUPPORTED_FORMAT: 'unsupported_format',
  },
};

/**
 * Logging and Monitoring
 */
export const MONITORING_CONFIG = {
  ENABLE_PERFORMANCE_LOGGING: true,
  ENABLE_PREDICTION_LOGGING: true,
  ENABLE_ERROR_LOGGING: true,
  
  // Metrics to track
  TRACK_METRICS: [
    'inference_time',
    'preprocessing_time',
    'model_load_time',
    'memory_usage',
    'confidence_scores',
    'cache_hit_rate',
  ],
  
  // Log levels
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
};

/**
 * Multi-Image Analysis Configuration
 */
export const MULTI_IMAGE_CONFIG = {
  // Voting strategy
  VOTING_METHOD: 'weighted_confidence', // 'weighted_confidence' or 'majority_vote'
  
  // Weight calculation
  TOP_PREDICTION_WEIGHT: 1.0,
  SECOND_PREDICTION_WEIGHT: 0.5,
  THIRD_PREDICTION_WEIGHT: 0.33,
  
  // Aggregation
  MIN_IMAGES_FOR_CONSENSUS: 2,
  MAX_IMAGES_TO_ANALYZE: 5, // From Story 3.1
  
  // Sequential vs parallel processing
  PROCESS_SEQUENTIALLY: true, // Process images one by one
  SHOW_PROGRESS: true, // Show progress indicator
};

/**
 * Get inference timeout based on number of images
 * @param {number} imageCount - Number of images to process
 * @returns {number} Timeout in milliseconds
 */
export function getInferenceTimeout(imageCount = 1) {
  if (imageCount === 1) {
    return PERFORMANCE_THRESHOLDS.MAX_INFERENCE_TIME;
  }
  return Math.min(
    imageCount * PERFORMANCE_THRESHOLDS.MAX_INFERENCE_TIME,
    PERFORMANCE_THRESHOLDS.MAX_MULTI_IMAGE_TIME
  );
}

/**
 * Determine if confidence is high enough for reliable prediction
 * @param {number} confidence - Confidence score (0-1)
 * @returns {boolean} True if confidence is high
 */
export function isHighConfidence(confidence) {
  return confidence >= PREDICTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD;
}

/**
 * Determine if cloud verification is needed
 * @param {number} topConfidence - Highest confidence score
 * @returns {boolean} True if cloud verification recommended
 */
export function needsCloudVerification(topConfidence) {
  return topConfidence < PREDICTION_CONFIG.CLOUD_VERIFICATION_THRESHOLD;
}

/**
 * Get confidence level label
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} Confidence level: 'high', 'medium', 'low', 'very_low'
 */
export function getConfidenceLevel(confidence) {
  if (confidence >= PREDICTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    return 'high';
  }
  if (confidence >= PREDICTION_CONFIG.MEDIUM_CONFIDENCE_THRESHOLD) {
    return 'medium';
  }
  if (confidence >= PREDICTION_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
    return 'low';
  }
  return 'very_low';
}

/**
 * Format inference time for display
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatInferenceTime(timeMs) {
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  }
  return `${(timeMs / 1000).toFixed(1)}s`;
}

/**
 * Check if inference time is acceptable
 * @param {number} timeMs - Inference time in milliseconds
 * @param {number} imageCount - Number of images processed
 * @returns {boolean} True if within acceptable limits
 */
export function isAcceptablePerformance(timeMs, imageCount = 1) {
  const timeout = getInferenceTimeout(imageCount);
  return timeMs <= timeout;
}

export default {
  MODEL_CONFIG,
  PREPROCESSING_CONFIG,
  PERFORMANCE_THRESHOLDS,
  PREDICTION_CONFIG,
  CACHE_CONFIG,
  OPTIMIZATION_CONFIG,
  ERROR_CONFIG,
  MONITORING_CONFIG,
  MULTI_IMAGE_CONFIG,
  getInferenceTimeout,
  isHighConfidence,
  needsCloudVerification,
  getConfidenceLevel,
  formatInferenceTime,
  isAcceptablePerformance,
};

