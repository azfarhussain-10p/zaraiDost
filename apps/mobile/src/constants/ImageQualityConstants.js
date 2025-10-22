// Image Quality Constants
// Story 3.1: Image Capture and Upload Interface
// Defines validation thresholds for image quality checks

/**
 * Resolution Requirements
 * AC5: Image quality validation (minimum resolution, not blurry)
 */
export const RESOLUTION = {
  MIN_WIDTH: 640, // Minimum width in pixels
  MIN_HEIGHT: 640, // Minimum height in pixels
  RECOMMENDED_WIDTH: 1920, // Recommended width for best results
  RECOMMENDED_HEIGHT: 1080, // Recommended height
  MAX_WIDTH: 4096, // Maximum width (prevent excessive storage)
  MAX_HEIGHT: 4096, // Maximum height
};

/**
 * File Size Limits
 * Balance between quality and storage/upload constraints
 */
export const FILE_SIZE = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB per image
  MAX_SIZE_MB: 10,
  RECOMMENDED_SIZE_MB: 5, // Sweet spot for quality vs size
  MIN_SIZE_BYTES: 50 * 1024, // 50KB minimum (too small = likely corrupted)
};

/**
 * Blur Detection Thresholds
 * Using Laplacian variance algorithm
 * Lower variance = more blur
 */
export const BLUR_DETECTION = {
  THRESHOLD_SHARP: 100, // Above this = sharp image
  THRESHOLD_ACCEPTABLE: 50, // Between 50-100 = acceptable
  THRESHOLD_BLURRY: 50, // Below this = too blurry
  THRESHOLD_CRITICAL: 20, // Below this = unusable
};

/**
 * Quality Score Ranges
 * Overall image quality assessment (0-1 scale)
 */
export const QUALITY_SCORE = {
  EXCELLENT: 0.9, // 90-100%
  GOOD: 0.7, // 70-90%
  ACCEPTABLE: 0.5, // 50-70%
  POOR: 0.3, // 30-50%
  UNUSABLE: 0, // <30%
};

/**
 * Supported Image Formats
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];

/**
 * Image Capture Settings
 */
export const CAPTURE_SETTINGS = {
  QUALITY: 0.8, // 80% compression for camera captures
  EXIF: true, // Include EXIF metadata
  BASE64: false, // Don't include base64 (saves memory)
  SKIP_PROCESSING: false, // Allow processing
};

/**
 * Gallery Selection Settings
 * AC6: Multiple images uploadable for same crop issue (max 5)
 */
export const GALLERY_SETTINGS = {
  MAX_IMAGES_PER_HEALTH_CHECK: 5, // Maximum images per health check
  ALLOW_MULTIPLE: true,
  QUALITY: 0.8,
  EXIF: true,
};

/**
 * GPS/Location Settings
 * AC7: Location data (GPS) captured with image
 */
export const LOCATION_SETTINGS = {
  ACCURACY: 'balanced', // 'high', 'balanced', 'low', 'passive'
  TIMEOUT_MS: 5000, // 5 seconds to get GPS fix
  MAX_AGE_MS: 60000, // Reuse location if <1 minute old
  ENABLE_HIGH_ACCURACY: false, // Balance accuracy vs battery
};

/**
 * Health Check Status Values
 */
export const HEALTH_CHECK_STATUS = {
  PENDING: 'pending', // Images captured, awaiting analysis
  ANALYZING: 'analyzing', // Analysis in progress
  COMPLETED: 'completed', // Analysis done
  FAILED: 'failed', // Analysis failed
  PARTIAL: 'partial', // Some images analyzed, some failed
};

/**
 * Image Validation Error Codes
 */
export const VALIDATION_ERRORS = {
  RESOLUTION_TOO_LOW: 'resolution_too_low',
  RESOLUTION_TOO_HIGH: 'resolution_too_high',
  FILE_TOO_LARGE: 'file_too_large',
  FILE_TOO_SMALL: 'file_too_small',
  BLURRY_IMAGE: 'blurry_image',
  UNSUPPORTED_FORMAT: 'unsupported_format',
  CORRUPTED_FILE: 'corrupted_file',
  NO_GPS_DATA: 'no_gps_data', // Warning only
  MAX_IMAGES_EXCEEDED: 'max_images_exceeded',
};

/**
 * Error Messages (Multilingual)
 */
export const ERROR_MESSAGES = {
  resolution_too_low: {
    en: `Image resolution too low. Minimum ${RESOLUTION.MIN_WIDTH}x${RESOLUTION.MIN_HEIGHT} required.`,
    ur: `تصویر کی ریزولیوشن بہت کم ہے۔ کم از کم ${RESOLUTION.MIN_WIDTH}x${RESOLUTION.MIN_HEIGHT} درکار ہے۔`,
  },
  file_too_large: {
    en: `Image file too large. Maximum ${FILE_SIZE.MAX_SIZE_MB}MB per image.`,
    ur: `تصویر کی فائل بہت بڑی ہے۔ زیادہ سے زیادہ ${FILE_SIZE.MAX_SIZE_MB}MB فی تصویر۔`,
  },
  blurry_image: {
    en: 'Image appears blurry. Please retake for better results.',
    ur: 'تصویر دھندلی نظر آ رہی ہے۔ بہتر نتائج کے لیے دوبارہ لیں۔',
  },
  unsupported_format: {
    en: 'Image format not supported. Please use JPEG or PNG.',
    ur: 'تصویر کا فارمیٹ تعاون یافتہ نہیں ہے۔ براہ کرم JPEG یا PNG استعمال کریں۔',
  },
  max_images_exceeded: {
    en: `Maximum ${GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK} images per health check. Remove an image to add another.`,
    ur: `ہر ہیلتھ چیک کے لیے زیادہ سے زیادہ ${GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK} تصاویر۔ دوسری شامل کرنے کے لیے ایک تصویر ہٹائیں۔`,
  },
  no_gps_data: {
    en: 'Location unavailable. Continue without GPS?',
    ur: 'مقام دستیاب نہیں ہے۔ GPS کے بغیر جاری رکھیں؟',
  },
};

/**
 * Get validation error message
 * @param {string} errorCode - Error code from VALIDATION_ERRORS
 * @param {string} lang - Language ('en' or 'ur')
 * @returns {string} Localized error message
 */
export function getErrorMessage(errorCode, lang = 'ur') {
  const message = ERROR_MESSAGES[errorCode];
  if (!message) return 'Unknown error';
  return message[lang] || message.en;
}

/**
 * Determine overall quality assessment from scores
 * @param {Object} validationResult - Validation result object
 * @returns {string} Quality level: 'excellent', 'good', 'acceptable', 'poor', 'unusable'
 */
export function getQualityLevel(validationResult) {
  const { qualityScore } = validationResult;

  if (qualityScore >= QUALITY_SCORE.EXCELLENT) return 'excellent';
  if (qualityScore >= QUALITY_SCORE.GOOD) return 'good';
  if (qualityScore >= QUALITY_SCORE.ACCEPTABLE) return 'acceptable';
  if (qualityScore >= QUALITY_SCORE.POOR) return 'poor';
  return 'unusable';
}

export default {
  RESOLUTION,
  FILE_SIZE,
  BLUR_DETECTION,
  QUALITY_SCORE,
  SUPPORTED_FORMATS,
  SUPPORTED_EXTENSIONS,
  CAPTURE_SETTINGS,
  GALLERY_SETTINGS,
  LOCATION_SETTINGS,
  HEALTH_CHECK_STATUS,
  VALIDATION_ERRORS,
  ERROR_MESSAGES,
  getErrorMessage,
  getQualityLevel,
};

