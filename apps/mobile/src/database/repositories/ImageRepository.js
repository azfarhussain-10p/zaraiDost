// Image Repository
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.5 (Create ImageRepository with CRUD operations)

import { BaseRepository } from './BaseRepository';
import { Image } from '../models/Image';
import { TABLES, STORAGE_LIMITS } from '../../constants/DatabaseConstants';
import { getDatabase } from '../config/db.config';

export class ImageRepository extends BaseRepository {
  constructor() {
    super(TABLES.IMAGES, Image);
  }

  /**
   * Find images by crop ID
   */
  async findByCropId(cropId) {
    return await this.findBy('crop_id = ?', [cropId], 'timestamp DESC');
  }

  /**
   * Find images without crop association
   */
  async findUnassociated() {
    return await this.findBy('crop_id IS NULL', [], 'timestamp DESC');
  }

  /**
   * Find images with analysis results
   */
  async findAnalyzed() {
    return await this.findBy('analysis_result_json IS NOT NULL', [], 'timestamp DESC');
  }

  /**
   * Get total image count
   */
  async getTotalCount() {
    return await this.count();
  }

  /**
   * Clean up old images when limit exceeded
   * Implements: Task 5.3 (Image cache cleanup)
   */
  async cleanupOldImages() {
    const db = getDatabase();
    
    try {
      const currentCount = await this.getTotalCount();
      
      if (currentCount <= STORAGE_LIMITS.MAX_IMAGES) {
        console.log(`[ImageRepository] Image count (${currentCount}) within limit`);
        return 0;
      }

      const deleteCount = currentCount - STORAGE_LIMITS.MAX_IMAGES;
      
      // Delete oldest images
      const query = `
        DELETE FROM ${this.tableName}
        WHERE id IN (
          SELECT id FROM ${this.tableName}
          ORDER BY timestamp ASC
          LIMIT ?
        )
      `;
      
      const result = await db.runAsync(query, [deleteCount]);
      console.log(`[ImageRepository] Cleaned up ${result.changes} old images`);
      
      return result.changes;
    } catch (error) {
      console.error('[ImageRepository] CleanupOldImages failed:', error);
      throw error;
    }
  }

  /**
   * Get images pending upload (not synced)
   */
  async findPendingUpload() {
    return await this.findBy('sync_status = ? AND remote_url IS NULL', ['pending']);
  }

  /**
   * Update with remote URL after upload
   */
  async updateRemoteUrl(imageId, remoteUrl) {
    return await this.update(imageId, {
      remote_url: remoteUrl,
      sync_status: 'synced',
    });
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResult(imageId, analysisResult, confidenceScore) {
    return await this.update(imageId, {
      analysis_result_json: JSON.stringify(analysisResult),
      confidence_score: confidenceScore,
    });
  }

  // ========================================
  // Story 1.4: Upload Queue Methods
  // ========================================

  /**
   * Get pending uploads (pending or failed status)
   * Used by ImageUploadQueue for processing
   */
  async getPendingUploads() {
    const db = getDatabase();

    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE sync_status IN ('pending', 'failed')
        ORDER BY timestamp DESC
      `;

      const rows = await db.getAllAsync(query);
      return rows.map((row) => this.mapToModel(row));
    } catch (error) {
      console.error('[ImageRepository] GetPendingUploads failed:', error);
      throw error;
    }
  }

  /**
   * Get failed uploads only
   */
  async getFailedUploads() {
    return await this.findBy('sync_status = ?', ['failed'], 'timestamp DESC');
  }

  /**
   * Find images by sync status
   */
  async findByStatus(status) {
    return await this.findBy('sync_status = ?', [status], 'timestamp DESC');
  }

  /**
   * Count images by sync status
   */
  async countByStatus(status) {
    const db = getDatabase();

    try {
      const query = `
        SELECT COUNT(*) as count FROM ${this.tableName}
        WHERE sync_status = ?
      `;

      const result = await db.getFirstAsync(query, [status]);
      return result?.count || 0;
    } catch (error) {
      console.error('[ImageRepository] CountByStatus failed:', error);
      throw error;
    }
  }

  /**
   * Update sync status for an image
   */
  async updateSyncStatus(imageId, status) {
    return await this.update(imageId, {
      sync_status: status,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Increment upload attempt counter
   */
  async incrementUploadAttempts(imageId) {
    const db = getDatabase();

    try {
      const query = `
        UPDATE ${this.tableName}
        SET upload_attempts = upload_attempts + 1,
            last_upload_attempt = ?
        WHERE id = ?
      `;

      await db.runAsync(query, [new Date().toISOString(), imageId]);
    } catch (error) {
      console.error('[ImageRepository] IncrementUploadAttempts failed:', error);
      throw error;
    }
  }

  /**
   * Get images that need retry (failed with attempts < max)
   */
  async getRetryableUploads(maxAttempts = 3) {
    const db = getDatabase();

    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE sync_status = 'failed'
          AND upload_attempts < ?
        ORDER BY last_upload_attempt ASC
      `;

      const rows = await db.getAllAsync(query, [maxAttempts]);
      return rows.map((row) => this.mapToModel(row));
    } catch (error) {
      console.error('[ImageRepository] GetRetryableUploads failed:', error);
      throw error;
    }
  }

  /**
   * Get upload queue statistics
   */
  async getQueueStats() {
    const db = getDatabase();

    try {
      const query = `
        SELECT
          sync_status,
          COUNT(*) as count,
          SUM(file_size_bytes) as total_bytes
        FROM ${this.tableName}
        GROUP BY sync_status
      `;

      const rows = await db.getAllAsync(query);

      const stats = {};
      rows.forEach((row) => {
        stats[row.sync_status] = {
          count: row.count,
          totalBytes: row.total_bytes || 0,
        };
      });

      return stats;
    } catch (error) {
      console.error('[ImageRepository] GetQueueStats failed:', error);
      throw error;
    }
  }
}

export default new ImageRepository();

