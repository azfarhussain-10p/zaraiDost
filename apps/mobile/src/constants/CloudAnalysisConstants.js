// Cloud Analysis Constants
// Story 3.3: Cloud-Based Enhanced Analysis
// Configuration for cloud vision AI providers and analysis

/**
 * Cloud Vision Providers
 */
export const CLOUD_PROVIDERS = {
  GPT4_VISION: 'gpt4-vision',
  GEMINI_VISION: 'gemini-vision',
  CLAUDE_VISION: 'claude-vision', // Future
};

/**
 * Cloud Analysis Status
 */
export const CLOUD_ANALYSIS_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
};

/**
 * Performance Thresholds
 * AC5: Cloud analysis completes within 10 seconds
 */
export const PERFORMANCE_CONFIG = {
  CLOUD_TIMEOUT_MS: 10000, // 10 seconds (AC5)
  UPLOAD_TIMEOUT_MS: 30000, // 30 seconds for image upload
  RETRY_DELAY_MS: 5000, // 5 seconds between retries
  MAX_RETRY_ATTEMPTS: 3,
  QUEUE_EXPIRY_DAYS: 7, // Expire queue items after 7 days
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  DEFAULT_PROVIDER: CLOUD_PROVIDERS.GPT4_VISION,
  FALLBACK_PROVIDER: CLOUD_PROVIDERS.GEMINI_VISION,
  MAX_CONCURRENT_REQUESTS: 3,
  RATE_LIMIT_PER_MINUTE: 10,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGES_PER_REQUEST: 5,
};

/**
 * Comparison Thresholds
 * AC4: Results compare on-device vs cloud predictions
 */
export const COMPARISON_CONFIG = {
  SIGNIFICANT_CONFIDENCE_DELTA: 0.2, // 20% difference is significant
  HIGH_AGREEMENT_THRESHOLD: 80, // Agreement score > 80% = high agreement
  MEDIUM_AGREEMENT_THRESHOLD: 50, // Agreement score 50-80% = medium
  LOW_AGREEMENT_THRESHOLD: 50, // Agreement score < 50% = low
  NOTIFY_USER_THRESHOLD: 70, // Notify if agreement < 70%
};

/**
 * Result Agreement Levels
 */
export const AGREEMENT_LEVELS = {
  HIGH: 'high', // Strong agreement between on-device and cloud
  MEDIUM: 'medium', // Moderate agreement
  LOW: 'low', // Low agreement - conflicting diagnoses
  NONE: 'none', // No on-device result to compare
};

/**
 * Cloud Analysis Priority
 */
export const ANALYSIS_PRIORITY = {
  HIGH: 'high', // User-requested or low on-device confidence
  NORMAL: 'normal', // Automatic background analysis
  LOW: 'low', // Batch processing
};

/**
 * Urgency Levels (from cloud AI)
 */
export const URGENCY_LEVELS = {
  LOW: 'low', // No immediate action needed
  MEDIUM: 'medium', // Action needed within days
  HIGH: 'high', // Immediate action recommended
  CRITICAL: 'critical', // Urgent intervention required
};

/**
 * Error Codes
 */
export const ERROR_CODES = {
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  IMAGE_NOT_FOUND: 'IMAGE_NOT_FOUND',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  AUTH_FAILED: 'AUTH_FAILED',
};

/**
 * Queue Configuration
 */
export const QUEUE_CONFIG = {
  MAX_QUEUE_SIZE: 100,
  PROCESS_BATCH_SIZE: 5,
  PROCESS_INTERVAL_MS: 60000, // Check queue every 60 seconds
  CLEANUP_INTERVAL_MS: 3600000, // Clean up old items every hour
};

/**
 * Notification Configuration
 * AC7: User notified when cloud provides different diagnosis
 */
export const NOTIFICATION_CONFIG = {
  ENABLED: true,
  SHOW_FOR_HIGH_CONFIDENCE_IMPROVEMENT: true, // Notify if cloud confidence > on-device + 20%
  SHOW_FOR_DIFFERENT_DISEASE: true, // Notify if different disease detected
  SHOW_FOR_CRITICAL_URGENCY: true, // Always notify for critical urgency
  BADGE_DURATION_MS: 5000, // Show badge for 5 seconds
};

/**
 * Model Prompt Templates
 */
export const PROMPT_TEMPLATES = {
  SINGLE_IMAGE: `You are an expert agricultural pathologist specializing in Pakistani crop diseases.

Analyze this crop image and identify any diseases, pests, or nutrient deficiencies.

Context:
- Crop Type: {cropType}
- Location: {location}
- Farmer Description: {description}
- On-device Prediction: {onDevicePrediction}

Provide a comprehensive diagnosis including:
1. Primary diagnosis with confidence level (0-100%)
2. Top 3 possible diseases/issues with confidence scores
3. Severity assessment (mild/moderate/severe/critical)
4. Key visual indicators observed
5. Detailed reasoning for diagnosis
6. Urgency level (low/medium/high/critical)

Format response as JSON.`,

  MULTI_IMAGE: `You are an expert agricultural pathologist specializing in Pakistani crop diseases.

Analyze these {imageCount} images of the same crop issue and provide a comprehensive diagnosis.

Context:
- Crop Type: {cropType}
- Location: {location}
- Farmer Description: {description}
- On-device Prediction: {onDevicePrediction}

Analyze all images together to:
1. Identify the disease/pest/deficiency with high confidence
2. Assess severity and distribution across the crop
3. Note any progression or variation visible across images
4. Determine consensus diagnosis from all images
5. Provide urgency level and recommended actions

Format response as JSON with detailed analysis.`,
};

/**
 * Response Schema (Expected from Cloud AI)
 */
export const EXPECTED_RESPONSE_SCHEMA = {
  provider: 'string', // 'gpt4-vision' or 'gemini-vision'
  timestamp: 'ISO8601',
  predictions: [
    {
      rank: 'number',
      diseaseId: 'string',
      diseaseName: 'string',
      category: 'string',
      severity: 'string',
      confidence: 'number', // 0-1
      confidencePercent: 'number', // 0-100
    },
  ],
  reasoning: 'string',
  visualIndicators: ['string'],
  severity: 'string',
  urgency: 'string',
  multiImageConsensus: 'boolean',
  treatmentSummary: 'string', // Brief treatment recommendation
};

/**
 * Default Fallback Response
 * Used when cloud analysis fails
 */
export const FALLBACK_RESPONSE = {
  provider: 'fallback',
  predictions: [],
  reasoning: 'Cloud analysis unavailable. Using on-device results.',
  error: true,
  fallbackToOnDevice: true,
};

/**
 * Cost Tracking (for monitoring)
 */
export const COST_CONFIG = {
  TRACK_API_USAGE: true,
  LOG_COST_ESTIMATES: true,
  ESTIMATED_COST_PER_IMAGE: {
    [CLOUD_PROVIDERS.GPT4_VISION]: 0.01, // $0.01 per image (estimate)
    [CLOUD_PROVIDERS.GEMINI_VISION]: 0.005, // $0.005 per image (estimate)
  },
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_CLOUD_ANALYSIS: true,
  ENABLE_AUTO_TRIGGER: true, // AC1: Automatically trigger when online
  ENABLE_COMPARISON_NOTIFICATIONS: true, // AC7: Notify on different diagnosis
  ENABLE_RESULT_CACHING: true,
  ENABLE_MULTI_PROVIDER_FALLBACK: true,
  ENABLE_COST_TRACKING: true,
};

export default {
  CLOUD_PROVIDERS,
  CLOUD_ANALYSIS_STATUS,
  PERFORMANCE_CONFIG,
  API_CONFIG,
  COMPARISON_CONFIG,
  AGREEMENT_LEVELS,
  ANALYSIS_PRIORITY,
  URGENCY_LEVELS,
  ERROR_CODES,
  QUEUE_CONFIG,
  NOTIFICATION_CONFIG,
  PROMPT_TEMPLATES,
  EXPECTED_RESPONSE_SCHEMA,
  FALLBACK_RESPONSE,
  COST_CONFIG,
  FEATURE_FLAGS,
};
