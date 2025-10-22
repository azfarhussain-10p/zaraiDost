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
}

export default new ImageRepository();

