// Inference Cache Service
// Story 1.3: Offline AI Model Storage
// Implements: Task 5 (Build result caching fallback)

import InferenceCacheRepository from '../../database/repositories/InferenceCacheRepository';
import ModelMetadataRepository from '../../database/repositories/ModelMetadataRepository';
import PerceptualHash from '../../utils/PerceptualHash';
import { MODEL_NAMES } from '../../constants/ModelConstants';

/**
 * InferenceCache
 * Manages cached inference results for fallback
 * Implements: Task 5
 * AC5: Fallback to cached results if model loading fails
 */
class InferenceCache {
  /**
   * Cache inference result
   * Implements: Task 5.2
   */
  async cacheResult(imageUri, predictions, inferenceTime) {
    try {
      console.log('[InferenceCache] Caching result for:', imageUri);

      // Generate perceptual hash
      const imageHash = await PerceptualHash.generateHash(imageUri);

      // Get active model version
      const activeModel = await ModelMetadataRepository.getActiveModel(
        MODEL_NAMES.DISEASE_DETECTION
      );

      if (!activeModel) {
        console.warn('[InferenceCache] No active model, skipping cache');
        return null;
      }

      const cacheData = {
        image_hash: imageHash,
        model_version: activeModel.version,
        prediction_result: predictions,
        inference_time_ms: inferenceTime,
      };

      const saved = await InferenceCacheRepository.save(cacheData);
      console.log('[InferenceCache] Result cached successfully');

      // Cleanup old cache if needed
      await InferenceCacheRepository.cleanup();

      return saved;
    } catch (error) {
      console.error('[InferenceCache] Cache save failed:', error);
      return null;
    }
  }

  /**
   * Get cached result for image
   * Implements: Task 5.3, 5.4
   */
  async getCachedResult(imageUri) {
    try {
      const imageHash = await PerceptualHash.generateHash(imageUri);

      const activeModel = await ModelMetadataRepository.getActiveModel(
        MODEL_NAMES.DISEASE_DETECTION
      );

      if (!activeModel) {
        return null;
      }

      // Try exact match first
      const cached = await InferenceCacheRepository.findByHash(
        imageHash,
        activeModel.version
      );

      if (cached) {
        console.log('[InferenceCache] Found cached result (exact match)');
        return {
          ...cached,
          fromCache: true,
          matchType: 'exact',
        };
      }

      // Try similar images
      const similar = await InferenceCacheRepository.findSimilar(
        imageHash,
        activeModel.version
      );

      if (similar) {
        console.log('[InferenceCache] Found similar cached result');
        return {
          ...similar,
          fromCache: true,
          matchType: 'similar',
        };
      }

      return null;
    } catch (error) {
      console.error('[InferenceCache] Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async cleanupCache() {
    try {
      const deletedExpired = await InferenceCacheRepository.deleteExpired();
      const deletedOld = await InferenceCacheRepository.cleanup();

      console.log(`[InferenceCache] Cleanup: ${deletedExpired} expired, ${deletedOld} old entries`);

      return {
        deletedExpired,
        deletedOld,
      };
    } catch (error) {
      console.error('[InferenceCache] Cleanup failed:', error);
      return null;
    }
  }
}

export default new InferenceCache();
