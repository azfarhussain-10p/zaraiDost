// ImageConstants.js
// Story 1.4: Offline Image Processing Queue
// Comprehensive configuration for image capture, processing, upload, and storage

/**
 * Image quality and compression settings
 */
export const IMAGE_QUALITY = {
  CAPTURE: 0.9, // High quality for initial capture (90%)
  STORAGE: 0.8, // Compressed for storage (80%)
  THUMBNAIL: 0.6, // Lower quality for thumbnails (60%)
};

export const IMAGE_DIMENSIONS = {
  MAX_WIDTH: 2048, // Maximum width before compression
  MAX_HEIGHT: 2048, // Maximum height before compression
  THUMBNAIL_SIZE: 200, // Thumbnail dimensions (200x200)
};

/**
 * Upload queue configuration
 */
export const UPLOAD_QUEUE = {
  MAX_QUEUE_SIZE: 50, // AC6: Maximum 50 images in queue
  MAX_RETRY_ATTEMPTS: 3, // Failed uploads retry up to 3 times
  RETRY_DELAY_MS: 2000, // Initial retry delay (2 seconds)
  BATCH_SIZE_WIFI: 10, // Upload 10 images in parallel on WiFi
  BATCH_SIZE_CELLULAR: 3, // Upload 3 images in parallel on cellular
  PRESIGNED_URL_EXPIRE_MINUTES: 15, // Pre-signed URLs expire in 15 minutes
};

/**
 * Storage management settings
 */
export const STORAGE = {
  MAX_LOCAL_IMAGES: 50, // Maximum images stored locally
  MAX_IMAGE_SIZE_MB: 5, // Maximum single image size (5MB)
  MAX_TOTAL_SIZE_MB: 250, // Maximum total image storage (250MB)
  DELETE_AFTER_UPLOAD: false, // Keep local copy after upload (set true to delete)
  KEEP_THUMBNAIL: true, // Always keep thumbnail even if full image deleted
};

/**
 * Processing pipeline configuration
 */
export const PROCESSING = {
  MAX_PROCESSING_TIME_MS: 5000, // AC2: <5 second requirement
  INFERENCE_TIMEOUT_MS: 4000, // TensorFlow inference timeout (4s)
  PREPROCESSING_TIMEOUT_MS: 1000, // Image preprocessing timeout (1s)
};

/**
 * Image sync status values
 */
export const SYNC_STATUS = {
  PENDING: 'pending', // Not yet uploaded
  UPLOADING: 'uploading', // Currently uploading
  SYNCED: 'synced', // Successfully uploaded
  FAILED: 'failed', // Upload failed, will retry
  PROCESSING: 'processing', // AI processing in progress
};

/**
 * Upload priority levels
 */
export const UPLOAD_PRIORITY = {
  HIGH: 'high', // Recent images, critical diseases
  NORMAL: 'normal', // Standard uploads
  LOW: 'low', // Older images, low confidence
};

/**
 * Image file naming convention
 */
export const FILE_NAMING = {
  PREFIX: 'crop_image_', // File name prefix
  THUMBNAIL_SUFFIX: '_thumb', // Thumbnail suffix
  EXTENSION: '.jpg', // File extension
  // Format: crop_image_{timestamp}_{uuid}.jpg
};

/**
 * S3 upload configuration
 */
export const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'zarai-dost-images',
  REGION: process.env.S3_REGION || 'us-east-1',
  MULTIPART_THRESHOLD_MB: 5, // Use multipart upload for images >5MB
  API_ENDPOINT: process.env.API_URL || 'https://api.zaraidost.com',
  PRESIGNED_URL_PATH: '/api/v1/images/presigned-url',
};

/**
 * GPS and metadata settings
 */
export const METADATA = {
  ENABLE_GPS: true, // Capture GPS coordinates by default
  GPS_TIMEOUT_MS: 5000, // GPS acquisition timeout (5 seconds)
  GPS_MAX_AGE_MS: 60000, // Use cached GPS if <1 minute old
  GPS_HIGH_ACCURACY: true, // Request high accuracy GPS
  REQUIRED_FIELDS: [
    'timestamp',
    'local_file_path',
    'sync_status',
  ],
  OPTIONAL_FIELDS: [
    'location_gps',
    'crop_type',
    'crop_id',
    'file_size_bytes',
  ],
};

/**
 * Camera settings
 */
export const CAMERA = {
  PHOTO_QUALITY: 0.9, // Capture quality (90%)
  ALLOW_EDITING: true, // Allow crop/edit after capture
  CAMERA_TYPE: 'back', // Use back camera by default
  SAVE_TO_PHOTOS: false, // Don't save to device photo library
  EXIF: true, // Capture EXIF metadata
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to capture images',
  GPS_PERMISSION_DENIED: 'Location permission is required for accurate field mapping',
  STORAGE_FULL: 'Storage limit reached. Please sync or delete old images',
  PROCESSING_TIMEOUT: 'Image processing took too long. Please try again',
  UPLOAD_FAILED: 'Failed to upload image. Will retry when connection improves',
  NETWORK_REQUIRED: 'Network connection required for upload',
  QUEUE_FULL: 'Upload queue is full. Please wait for pending uploads to complete',
  IMAGE_TOO_LARGE: 'Image is too large. Maximum size is 5MB',
  INVALID_IMAGE: 'Invalid image format. Please capture a new image',
};

/**
 * Analytics event names
 */
export const ANALYTICS_EVENTS = {
  IMAGE_CAPTURED: 'image_captured',
  IMAGE_PROCESSED: 'image_processed',
  IMAGE_UPLOADED: 'image_uploaded',
  UPLOAD_FAILED: 'upload_failed',
  QUEUE_FULL: 'queue_full',
  STORAGE_CLEANUP: 'storage_cleanup',
  PROCESSING_TIMEOUT: 'processing_timeout',
};

/**
 * Mock mode settings for development
 */
export const MOCK_MODE = {
  ENABLED: true, // Set to false when backend is ready
  MOCK_CAMERA: false, // Use real camera even in mock mode
  MOCK_GPS: true, // Use fake GPS coordinates
  MOCK_S3_UPLOAD: true, // Simulate S3 uploads without actual upload
  MOCK_PROCESSING_DELAY_MS: 2000, // Simulate 2s processing time
  DEFAULT_GPS: {
    latitude: 31.5204, // Lahore, Pakistan
    longitude: 74.3587,
    accuracy: 10,
  },
};

/**
 * Crop types for categorization
 */
export const CROP_TYPES = {
  WHEAT: 'wheat',
  RICE: 'rice',
  COTTON: 'cotton',
  SUGARCANE: 'sugarcane',
  CORN: 'corn',
  UNKNOWN: 'unknown',
};

/**
 * Image analysis confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8, // High confidence: >80%
  MEDIUM: 0.5, // Medium confidence: 50-80%
  LOW: 0.3, // Low confidence: 30-50%
  MIN_DISPLAY: 0.3, // Don't show predictions below 30%
};

/**
 * Queue prioritization rules
 */
export const PRIORITIZATION = {
  // Recent images get higher priority
  RECENT_HOURS_THRESHOLD: 24, // Images from last 24 hours are "recent"

  // High confidence critical diseases prioritized
  CRITICAL_CONFIDENCE_THRESHOLD: 0.8,

  // Failed uploads with fewer retries prioritized
  MAX_RETRY_PRIORITY: 2, // Retry attempts <2 get higher priority

  // Priority scores
  SCORE_RECENT_IMAGE: 10,
  SCORE_HIGH_CONFIDENCE: 5,
  SCORE_LOW_RETRY_COUNT: 3,
  SCORE_FAILED_STATUS: 2,
};

/**
 * Background upload settings
 */
export const BACKGROUND_UPLOAD = {
  ENABLE: true, // Enable background uploads
  MIN_BATTERY_LEVEL: 0.2, // Only upload if battery >20%
  WIFI_ONLY: true, // Default to WiFi-only uploads
  INTERVAL_MINUTES: 15, // Check for uploads every 15 minutes
};

/**
 * Upload statistics tracking
 */
export const STATISTICS = {
  TRACK_UPLOAD_TIME: true, // Track average upload time
  TRACK_PROCESSING_TIME: true, // Track average processing time
  TRACK_SUCCESS_RATE: true, // Track upload success rate
  TRACK_QUEUE_SIZE: true, // Track queue size over time
  RETENTION_DAYS: 30, // Keep statistics for 30 days
};

export default {
  IMAGE_QUALITY,
  IMAGE_DIMENSIONS,
  UPLOAD_QUEUE,
  STORAGE,
  PROCESSING,
  SYNC_STATUS,
  UPLOAD_PRIORITY,
  FILE_NAMING,
  S3_CONFIG,
  METADATA,
  CAMERA,
  ERROR_MESSAGES,
  ANALYTICS_EVENTS,
  MOCK_MODE,
  CROP_TYPES,
  CONFIDENCE_THRESHOLDS,
  PRIORITIZATION,
  BACKGROUND_UPLOAD,
  STATISTICS,
};
