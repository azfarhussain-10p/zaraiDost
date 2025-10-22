// Inference Cache Repository
// Story 1.3: Offline AI Model Storage
// Implements: Task 5 (Build result caching fallback)

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { CACHE_SETTINGS } from '../../constants/ModelConstants';

/**
 * InferenceCacheRepository
 * Manages cached inference results for offline fallback
 * AC5: Fallback to cached results if model loading fails
 */
class InferenceCacheRepository {
  /**
   * Save inference result to cache
   * Implements: Task 5.2
   */
  async save(cacheData) {
    const db = getDatabase();
    const {
      image_hash,
      model_version,
      prediction_result,
      inference_time_ms,
    } = cacheData;

    try {
      const timestamp = new Date().toISOString();

      // Convert prediction result to JSON if it's an object
      const resultJson = typeof prediction_result === 'string'
        ? prediction_result
        : JSON.stringify(prediction_result);

      // Check if cache entry exists
      const existing = await this.findByHash(image_hash, model_version);

      if (existing) {
        // Update existing cache
        await db.runAsync(
          `UPDATE ${TABLES.INFERENCE_CACHE}
           SET prediction_result = ?,
               inference_time_ms = ?,
               created_at = ?
           WHERE image_hash = ? AND model_version = ?`,
          [
            resultJson,
            inference_time_ms,
            timestamp,
            image_hash,
            model_version,
          ]
        );

        return { ...existing, prediction_result: resultJson, updated: true };
      } else {
        // Insert new cache entry
        const result = await db.runAsync(
          `INSERT INTO ${TABLES.INFERENCE_CACHE}
           (image_hash, model_version, prediction_result, inference_time_ms, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            image_hash,
            model_version,
            resultJson,
            inference_time_ms,
            timestamp,
          ]
        );

        return {
          id: result.lastInsertRowId,
          image_hash,
          model_version,
          prediction_result: resultJson,
          inference_time_ms,
          created_at: timestamp,
        };
      }
    } catch (error) {
      console.error('[InferenceCacheRepository] Save failed:', error);
      throw error;
    }
  }

  /**
   * Find cached result by image hash and model version
   * Implements: Task 5.3
   */
  async findByHash(image_hash, model_version) {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        `SELECT * FROM ${TABLES.INFERENCE_CACHE}
         WHERE image_hash = ? AND model_version = ?`,
        [image_hash, model_version]
      );

      if (result && result.prediction_result) {
        // Parse JSON result
        return {
          ...result,
          prediction_result: JSON.parse(result.prediction_result),
        };
      }

      return null;
    } catch (error) {
      console.error('[InferenceCacheRepository] Find by hash failed:', error);
      throw error;
    }
  }

  /**
   * Find similar cached results by image hash
   * Implements: Task 5.3 (similar image lookup)
   * Uses perceptual hash similarity
   */
  async findSimilar(image_hash, model_version, similarityThreshold = 0.9) {
    const db = getDatabase();

    try {
      // Get all cache entries for this model version
      const allResults = await db.getAllAsync(
        `SELECT * FROM ${TABLES.INFERENCE_CACHE}
         WHERE model_version = ?
         ORDER BY created_at DESC
         LIMIT 100`,
        [model_version]
      );

      if (!allResults || allResults.length === 0) {
        return null;
      }

      // Find most similar hash
      // For now, return exact match (perceptual hash similarity will be implemented in PerceptualHash util)
      const exactMatch = allResults.find(r => r.image_hash === image_hash);

      if (exactMatch) {
        return {
          ...exactMatch,
          prediction_result: JSON.parse(exactMatch.prediction_result),
          similarity: 1.0,
        };
      }

      // TODO: Implement perceptual hash distance calculation
      // For now, return null if no exact match
      return null;
    } catch (error) {
      console.error('[InferenceCacheRepository] Find similar failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * Useful for monitoring cache usage
   */
  async getStatistics() {
    const db = getDatabase();

    try {
      const totalCount = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${TABLES.INFERENCE_CACHE}`
      );

      const avgInferenceTime = await db.getFirstAsync(
        `SELECT AVG(inference_time_ms) as avg_time FROM ${TABLES.INFERENCE_CACHE}`
      );

      const oldestEntry = await db.getFirstAsync(
        `SELECT created_at FROM ${TABLES.INFERENCE_CACHE}
         ORDER BY created_at ASC LIMIT 1`
      );

      const newestEntry = await db.getFirstAsync(
        `SELECT created_at FROM ${TABLES.INFERENCE_CACHE}
         ORDER BY created_at DESC LIMIT 1`
      );

      return {
        total_entries: totalCount?.count || 0,
        avg_inference_time_ms: avgInferenceTime?.avg_time || 0,
        oldest_entry: oldestEntry?.created_at,
        newest_entry: newestEntry?.created_at,
      };
    } catch (error) {
      console.error('[InferenceCacheRepository] Get statistics failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old cache entries
   * Implements: Task 5.6 (Limit cache size to 1000 recent predictions)
   */
  async cleanup() {
    const db = getDatabase();

    try {
      // Get current cache count
      const countResult = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${TABLES.INFERENCE_CACHE}`
      );

      const currentCount = countResult?.count || 0;
      const maxSize = CACHE_SETTINGS.MAX_CACHE_SIZE;

      if (currentCount <= maxSize) {
        console.log('[InferenceCacheRepository] Cache size within limits');
        return 0;
      }

      // Delete oldest entries beyond the limit
      const deleteCount = currentCount - maxSize;

      await db.runAsync(
        `DELETE FROM ${TABLES.INFERENCE_CACHE}
         WHERE id IN (
           SELECT id FROM ${TABLES.INFERENCE_CACHE}
           ORDER BY created_at ASC
           LIMIT ?
         )`,
        [deleteCount]
      );

      console.log(`[InferenceCacheRepository] Cleaned up ${deleteCount} old cache entries`);
      return deleteCount;
    } catch (error) {
      console.error('[InferenceCacheRepository] Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Delete expired cache entries (older than expiry days)
   * Implements: Task 5.6
   */
  async deleteExpired() {
    const db = getDatabase();

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - CACHE_SETTINGS.CACHE_EXPIRY_DAYS);
      const expiryTimestamp = expiryDate.toISOString();

      const result = await db.runAsync(
        `DELETE FROM ${TABLES.INFERENCE_CACHE}
         WHERE created_at < ?`,
        [expiryTimestamp]
      );

      const deletedCount = result.changes || 0;
      console.log(`[InferenceCacheRepository] Deleted ${deletedCount} expired cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('[InferenceCacheRepository] Delete expired failed:', error);
      throw error;
    }
  }

  /**
   * Clear all cache entries
   * For testing or manual cleanup
   */
  async clearAll() {
    const db = getDatabase();

    try {
      await db.runAsync(`DELETE FROM ${TABLES.INFERENCE_CACHE}`);
      console.log('[InferenceCacheRepository] Cleared all cache entries');
    } catch (error) {
      console.error('[InferenceCacheRepository] Clear all failed:', error);
      throw error;
    }
  }

  /**
   * Delete cache entries for a specific model version
   * Useful when model is updated
   */
  async deleteByModelVersion(model_version) {
    const db = getDatabase();

    try {
      const result = await db.runAsync(
        `DELETE FROM ${TABLES.INFERENCE_CACHE}
         WHERE model_version = ?`,
        [model_version]
      );

      const deletedCount = result.changes || 0;
      console.log(`[InferenceCacheRepository] Deleted ${deletedCount} cache entries for model ${model_version}`);
      return deletedCount;
    } catch (error) {
      console.error('[InferenceCacheRepository] Delete by model version failed:', error);
      throw error;
    }
  }
}

export default new InferenceCacheRepository();
