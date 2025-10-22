// Cloud Vision Service
// Story 3.3: Cloud-Based Enhanced Analysis
// AC1: Cloud analysis automatically triggered when online
// AC2: More comprehensive model in cloud
// AC5: Cloud analysis completes within 10 seconds
// AC6: Fallback to on-device if cloud times out

import {
  CLOUD_PROVIDERS,
  API_CONFIG,
  PERFORMANCE_CONFIG,
  ERROR_CODES,
  FEATURE_FLAGS,
} from '../../constants/CloudAnalysisConstants';
import GPT4VisionProvider from './GPT4VisionProvider';
import GeminiVisionProvider from './GeminiVisionProvider';

/**
 * CloudVisionService
 * Abstraction layer for cloud vision AI providers
 * Handles provider selection, fallback, and timeout management
 */
class CloudVisionService {
  constructor() {
    // Initialize providers
    this.providers = {
      [CLOUD_PROVIDERS.GPT4_VISION]: new GPT4VisionProvider(),
      [CLOUD_PROVIDERS.GEMINI_VISION]: new GeminiVisionProvider(),
    };

    // Default provider
    this.activeProvider = API_CONFIG.DEFAULT_PROVIDER;
    this.fallbackProvider = API_CONFIG.FALLBACK_PROVIDER;

    // Performance tracking
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      totalAnalysisTime: 0,
      averageAnalysisTime: 0,
      providerUsage: {
        [CLOUD_PROVIDERS.GPT4_VISION]: 0,
        [CLOUD_PROVIDERS.GEMINI_VISION]: 0,
      },
    };
  }

  /**
   * Analyze single image
   * @param {string} imageUrl - S3 URL or base64 image
   * @param {object} context - Analysis context (crop type, location, etc.)
   * @returns {Promise<object>} Analysis result
   */
  async analyzeImage(imageUrl, context = {}) {
    if (!FEATURE_FLAGS.ENABLE_CLOUD_ANALYSIS) {
      throw new Error('Cloud analysis is disabled');
    }

    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      console.log('[CloudVisionService] Starting single image analysis');
      console.log('[CloudVisionService] Provider:', this.activeProvider);
      console.log('[CloudVisionService] Image URL:', imageUrl?.substring(0, 50) + '...');

      // Get active provider
      const provider = this.providers[this.activeProvider];
      if (!provider) {
        throw new Error(`Provider ${this.activeProvider} not found`);
      }

      // Wrap analysis in timeout promise (AC5: 10 seconds)
      const result = await this._withTimeout(
        provider.analyze(imageUrl, context),
        PERFORMANCE_CONFIG.CLOUD_TIMEOUT_MS
      );

      // Track success
      const analysisTime = Date.now() - startTime;
      this._trackSuccess(analysisTime);

      console.log(`[CloudVisionService] Analysis completed in ${analysisTime}ms`);

      return {
        ...result,
        analysisTime,
        provider: this.activeProvider,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[CloudVisionService] Analysis failed:', error.message);

      // Check if timeout error
      if (error.message === 'TIMEOUT') {
        this.metrics.timeoutCount++;

        // AC6: Fallback to on-device if cloud times out
        throw new Error(ERROR_CODES.TIMEOUT);
      }

      // Try fallback provider if multi-provider fallback enabled
      if (FEATURE_FLAGS.ENABLE_MULTI_PROVIDER_FALLBACK && this.fallbackProvider) {
        console.log('[CloudVisionService] Attempting fallback to:', this.fallbackProvider);

        try {
          const fallbackResult = await this._analyzeWithFallback(imageUrl, context);
          const analysisTime = Date.now() - startTime;
          this._trackSuccess(analysisTime);

          return {
            ...fallbackResult,
            analysisTime,
            provider: this.fallbackProvider,
            timestamp: new Date().toISOString(),
            usedFallback: true,
          };
        } catch (fallbackError) {
          console.error('[CloudVisionService] Fallback also failed:', fallbackError.message);
        }
      }

      // Track failure
      this.metrics.failureCount++;
      throw error;
    }
  }

  /**
   * Analyze multiple images
   * AC3: Multi-image analysis for better diagnosis
   * @param {string[]} imageUrls - Array of S3 URLs
   * @param {object} context - Analysis context
   * @returns {Promise<object>} Aggregated analysis result
   */
  async analyzeMultipleImages(imageUrls, context = {}) {
    if (!FEATURE_FLAGS.ENABLE_CLOUD_ANALYSIS) {
      throw new Error('Cloud analysis is disabled');
    }

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No images provided for analysis');
    }

    if (imageUrls.length > API_CONFIG.MAX_IMAGES_PER_REQUEST) {
      throw new Error(`Maximum ${API_CONFIG.MAX_IMAGES_PER_REQUEST} images allowed per request`);
    }

    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      console.log('[CloudVisionService] Starting multi-image analysis');
      console.log('[CloudVisionService] Image count:', imageUrls.length);
      console.log('[CloudVisionService] Provider:', this.activeProvider);

      // Get active provider
      const provider = this.providers[this.activeProvider];
      if (!provider) {
        throw new Error(`Provider ${this.activeProvider} not found`);
      }

      // Add image count to context
      const enhancedContext = {
        ...context,
        imageCount: imageUrls.length,
        multiImage: true,
      };

      // Wrap analysis in timeout promise (AC5: 10 seconds)
      const result = await this._withTimeout(
        provider.analyzeMultiple(imageUrls, enhancedContext),
        PERFORMANCE_CONFIG.CLOUD_TIMEOUT_MS
      );

      // Track success
      const analysisTime = Date.now() - startTime;
      this._trackSuccess(analysisTime);

      console.log(`[CloudVisionService] Multi-image analysis completed in ${analysisTime}ms`);

      return {
        ...result,
        analysisTime,
        provider: this.activeProvider,
        timestamp: new Date().toISOString(),
        imageCount: imageUrls.length,
      };
    } catch (error) {
      console.error('[CloudVisionService] Multi-image analysis failed:', error.message);

      // Check if timeout error
      if (error.message === 'TIMEOUT') {
        this.metrics.timeoutCount++;
        throw new Error(ERROR_CODES.TIMEOUT);
      }

      // Try fallback provider
      if (FEATURE_FLAGS.ENABLE_MULTI_PROVIDER_FALLBACK && this.fallbackProvider) {
        console.log('[CloudVisionService] Attempting fallback to:', this.fallbackProvider);

        try {
          const fallbackResult = await this._analyzeMultipleWithFallback(imageUrls, context);
          const analysisTime = Date.now() - startTime;
          this._trackSuccess(analysisTime);

          return {
            ...fallbackResult,
            analysisTime,
            provider: this.fallbackProvider,
            timestamp: new Date().toISOString(),
            imageCount: imageUrls.length,
            usedFallback: true,
          };
        } catch (fallbackError) {
          console.error('[CloudVisionService] Fallback also failed:', fallbackError.message);
        }
      }

      // Track failure
      this.metrics.failureCount++;
      throw error;
    }
  }

  /**
   * Analyze with fallback provider
   * @private
   */
  async _analyzeWithFallback(imageUrl, context) {
    const fallbackProviderInstance = this.providers[this.fallbackProvider];
    if (!fallbackProviderInstance) {
      throw new Error(`Fallback provider ${this.fallbackProvider} not found`);
    }

    return await this._withTimeout(
      fallbackProviderInstance.analyze(imageUrl, context),
      PERFORMANCE_CONFIG.CLOUD_TIMEOUT_MS
    );
  }

  /**
   * Analyze multiple images with fallback provider
   * @private
   */
  async _analyzeMultipleWithFallback(imageUrls, context) {
    const fallbackProviderInstance = this.providers[this.fallbackProvider];
    if (!fallbackProviderInstance) {
      throw new Error(`Fallback provider ${this.fallbackProvider} not found`);
    }

    const enhancedContext = {
      ...context,
      imageCount: imageUrls.length,
      multiImage: true,
    };

    return await this._withTimeout(
      fallbackProviderInstance.analyzeMultiple(imageUrls, enhancedContext),
      PERFORMANCE_CONFIG.CLOUD_TIMEOUT_MS
    );
  }

  /**
   * Wrap promise with timeout
   * AC5: Cloud analysis completes within 10 seconds
   * @private
   */
  _withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
      }),
    ]);
  }

  /**
   * Track successful analysis
   * @private
   */
  _trackSuccess(analysisTime) {
    this.metrics.successCount++;
    this.metrics.totalAnalysisTime += analysisTime;
    this.metrics.averageAnalysisTime =
      this.metrics.totalAnalysisTime / this.metrics.successCount;
    this.metrics.providerUsage[this.activeProvider]++;
  }

  /**
   * Set active provider
   * @param {string} provider - Provider name from CLOUD_PROVIDERS
   */
  setActiveProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Invalid provider: ${provider}`);
    }
    console.log('[CloudVisionService] Switching provider to:', provider);
    this.activeProvider = provider;
  }

  /**
   * Set fallback provider
   * @param {string} provider - Provider name from CLOUD_PROVIDERS
   */
  setFallbackProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Invalid provider: ${provider}`);
    }
    console.log('[CloudVisionService] Setting fallback provider to:', provider);
    this.fallbackProvider = provider;
  }

  /**
   * Get performance metrics
   * @returns {object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.requestCount > 0
        ? (this.metrics.successCount / this.metrics.requestCount) * 100
        : 0,
      timeoutRate: this.metrics.requestCount > 0
        ? (this.metrics.timeoutCount / this.metrics.requestCount) * 100
        : 0,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      totalAnalysisTime: 0,
      averageAnalysisTime: 0,
      providerUsage: {
        [CLOUD_PROVIDERS.GPT4_VISION]: 0,
        [CLOUD_PROVIDERS.GEMINI_VISION]: 0,
      },
    };
  }

  /**
   * Check if service is available
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    try {
      const provider = this.providers[this.activeProvider];
      if (!provider || !provider.checkAvailability) {
        return false;
      }
      return await provider.checkAvailability();
    } catch (error) {
      console.error('[CloudVisionService] Availability check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new CloudVisionService();
