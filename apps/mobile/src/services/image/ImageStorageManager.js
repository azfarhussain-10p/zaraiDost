// ImageStorageManager.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 6 (Storage management and cleanup)

import * as FileSystem from 'expo-file-system';
import {
  STORAGE,
  SYNC_STATUS,
  ERROR_MESSAGES,
} from '../../constants/ImageConstants';
import ImageRepository from '../../database/repositories/ImageRepository';
import ImageCaptureService from './ImageCaptureService';
import MetadataExtractor from '../../utils/MetadataExtractor';

/**
 * ImageStorageManager
 *
 * Service for managing local image storage, cleanup, and quota enforcement.
 * Ensures device storage doesn't fill up by deleting old synced images.
 *
 * Implements AC6: Storage management prevents filling device (max 50 images in queue)
 */
class ImageStorageManager {
  constructor() {
    this.lastCleanup = null;
    this.storageListeners = [];
  }

  /**
   * Get current storage usage statistics
   * Implements Task 6.1
   *
   * @returns {Promise<object>} Storage statistics
   */
  async getStorageUsage() {
    try {
      console.log('[ImageStorageManager] Calculating storage usage...');

      // Get all images from database
      const allImages = await ImageRepository.findAll();

      let totalBytes = 0;
      let totalImages = allImages.length;
      let pendingImages = 0;
      let syncedImages = 0;
      let failedImages = 0;

      // Calculate storage for each image
      for (const image of allImages) {
        if (image.file_size_bytes) {
          totalBytes += image.file_size_bytes;
        }

        // Count by status
        if (image.sync_status === SYNC_STATUS.PENDING) pendingImages++;
        else if (image.sync_status === SYNC_STATUS.SYNCED) syncedImages++;
        else if (image.sync_status === SYNC_STATUS.FAILED) failedImages++;
      }

      const totalMB = totalBytes / (1024 * 1024);
      const percentUsed = (totalImages / STORAGE.MAX_LOCAL_IMAGES) * 100;

      const stats = {
        totalImages,
        pendingImages,
        syncedImages,
        failedImages,
        totalBytes,
        totalMB: parseFloat(totalMB.toFixed(2)),
        maxImages: STORAGE.MAX_LOCAL_IMAGES,
        maxMB: STORAGE.MAX_TOTAL_SIZE_MB,
        percentUsed: parseFloat(percentUsed.toFixed(1)),
        needsCleanup: totalImages > STORAGE.MAX_LOCAL_IMAGES,
      };

      console.log('[ImageStorageManager] Storage usage:', stats);
      return stats;
    } catch (error) {
      console.error('[ImageStorageManager] Error calculating storage usage:', error);
      throw error;
    }
  }

  /**
   * Clean up old synced images to free storage
   * Implements Task 6.2-6.4
   *
   * @param {boolean} force - Force cleanup even if not needed
   * @returns {Promise<object>} Cleanup statistics
   */
  async cleanup(force = false) {
    try {
      console.log('[ImageStorageManager] Starting storage cleanup...');

      const storageStats = await this.getStorageUsage();

      // Check if cleanup needed
      if (!force && !storageStats.needsCleanup) {
        console.log('[ImageStorageManager] No cleanup needed');
        return {
          deleted: 0,
          freed: 0,
          reason: 'not_needed',
        };
      }

      // Calculate how many images to delete
      const imagesToDelete = Math.max(0, storageStats.totalImages - STORAGE.MAX_LOCAL_IMAGES);

      if (imagesToDelete === 0 && !force) {
        console.log('[ImageStorageManager] No images to delete');
        return {
          deleted: 0,
          freed: 0,
          reason: 'within_limits',
        };
      }

      console.log(`[ImageStorageManager] Need to delete ${imagesToDelete} images`);

      // Get oldest synced images for deletion
      // Keep pending and failed images
      const syncedImages = await ImageRepository.findByStatus(SYNC_STATUS.SYNCED);

      // Sort by timestamp (oldest first)
      syncedImages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Take images to delete
      const toDelete = syncedImages.slice(0, imagesToDelete);

      if (toDelete.length === 0) {
        console.log('[ImageStorageManager] No synced images available for deletion');
        return {
          deleted: 0,
          freed: 0,
          reason: 'no_synced_images',
        };
      }

      console.log(`[ImageStorageManager] Deleting ${toDelete.length} oldest synced images...`);

      // Delete images
      let deletedCount = 0;
      let freedBytes = 0;

      for (const image of toDelete) {
        try {
          // Delete local file (but keep thumbnail if configured)
          const deleted = await this.deleteImageFiles(
            image.local_file_path,
            image.thumbnail_path,
            STORAGE.KEEP_THUMBNAIL
          );

          if (deleted) {
            freedBytes += image.file_size_bytes || 0;
            deletedCount++;

            // Update database: clear local path but keep record with remote URL
            await ImageRepository.update(image.id, {
              local_file_path: null, // Clear local path
              file_size_bytes: 0, // Reset size
            });

            console.log(`[ImageStorageManager] Deleted image ${image.id}`);
          }
        } catch (error) {
          console.error(`[ImageStorageManager] Failed to delete image ${image.id}:`, error);
        }
      }

      const freedMB = freedBytes / (1024 * 1024);

      const result = {
        deleted: deletedCount,
        freed: freedBytes,
        freedMB: parseFloat(freedMB.toFixed(2)),
      };

      this.lastCleanup = new Date();

      console.log('[ImageStorageManager] Cleanup complete:', result);

      // Notify listeners
      this.notifyStorageChange(result);

      return result;
    } catch (error) {
      console.error('[ImageStorageManager] Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Delete image files from file system
   *
   * @param {string} imagePath - Path to image file
   * @param {string} thumbnailPath - Path to thumbnail file
   * @param {boolean} keepThumbnail - Whether to keep thumbnail
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteImageFiles(imagePath, thumbnailPath, keepThumbnail = true) {
    try {
      let deleted = false;

      // Delete main image file
      if (imagePath) {
        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        if (imageInfo.exists) {
          await FileSystem.deleteAsync(imagePath);
          console.log('[ImageStorageManager] Deleted image file:', imagePath);
          deleted = true;
        }
      }

      // Delete thumbnail if not keeping it
      if (thumbnailPath && !keepThumbnail) {
        const thumbInfo = await FileSystem.getInfoAsync(thumbnailPath);
        if (thumbInfo.exists) {
          await FileSystem.deleteAsync(thumbnailPath);
          console.log('[ImageStorageManager] Deleted thumbnail:', thumbnailPath);
        }
      }

      return deleted;
    } catch (error) {
      console.error('[ImageStorageManager] File deletion error:', error);
      return false;
    }
  }

  /**
   * Delete all synced images (for manual cleanup)
   *
   * @returns {Promise<object>} Cleanup statistics
   */
  async deleteAllSyncedImages() {
    try {
      console.log('[ImageStorageManager] Deleting all synced images...');

      const syncedImages = await ImageRepository.findByStatus(SYNC_STATUS.SYNCED);

      console.log(`[ImageStorageManager] Found ${syncedImages.length} synced images`);

      let deletedCount = 0;
      let freedBytes = 0;

      for (const image of syncedImages) {
        try {
          const deleted = await this.deleteImageFiles(
            image.local_file_path,
            image.thumbnail_path,
            STORAGE.KEEP_THUMBNAIL
          );

          if (deleted) {
            freedBytes += image.file_size_bytes || 0;
            deletedCount++;

            // Clear local paths but keep database record
            await ImageRepository.update(image.id, {
              local_file_path: null,
              file_size_bytes: 0,
            });
          }
        } catch (error) {
          console.error(`[ImageStorageManager] Failed to delete image ${image.id}:`, error);
        }
      }

      const freedMB = freedBytes / (1024 * 1024);

      const result = {
        deleted: deletedCount,
        freed: freedBytes,
        freedMB: parseFloat(freedMB.toFixed(2)),
      };

      console.log('[ImageStorageManager] All synced images deleted:', result);

      // Notify listeners
      this.notifyStorageChange(result);

      return result;
    } catch (error) {
      console.error('[ImageStorageManager] Delete all failed:', error);
      throw error;
    }
  }

  /**
   * Check if storage limit is approaching
   * Implements Task 6.6
   *
   * @returns {Promise<object>} Storage warning info
   */
  async checkStorageWarning() {
    try {
      const stats = await this.getStorageUsage();

      const warning = {
        shouldWarn: false,
        message: null,
        stats,
      };

      // Warn if >80% of image limit
      if (stats.percentUsed >= 80) {
        warning.shouldWarn = true;
        warning.level = stats.percentUsed >= 95 ? 'critical' : 'warning';
        warning.message =
          stats.percentUsed >= 95
            ? ERROR_MESSAGES.STORAGE_FULL
            : `Storage ${stats.percentUsed}% full. Consider syncing or deleting old images.`;
      }

      return warning;
    } catch (error) {
      console.error('[ImageStorageManager] Warning check failed:', error);
      throw error;
    }
  }

  /**
   * Delete single image by ID
   *
   * @param {string} imageId - Image ID to delete
   * @param {boolean} deleteRemote - Also delete from S3
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteImage(imageId, deleteRemote = false) {
    try {
      console.log(`[ImageStorageManager] Deleting image ${imageId}...`);

      const image = await ImageRepository.findById(imageId);

      if (!image) {
        console.warn(`[ImageStorageManager] Image ${imageId} not found`);
        return false;
      }

      // Delete local files
      await this.deleteImageFiles(image.local_file_path, image.thumbnail_path, false);

      // Delete from S3 if requested and has remote URL
      if (deleteRemote && image.remote_url) {
        // TODO: Call S3UploadService.deleteImage(image.remote_url)
        console.log('[ImageStorageManager] Remote deletion not yet implemented');
      }

      // Delete database record
      await ImageRepository.delete(imageId);

      console.log(`[ImageStorageManager] Image ${imageId} deleted successfully`);

      // Notify listeners
      this.notifyStorageChange({ deleted: 1 });

      return true;
    } catch (error) {
      console.error(`[ImageStorageManager] Delete image ${imageId} failed:`, error);
      return false;
    }
  }

  /**
   * Get formatted storage usage for display
   *
   * @returns {Promise<string>} Formatted storage string
   */
  async getFormattedStorageUsage() {
    try {
      const stats = await this.getStorageUsage();

      return `${stats.totalImages}/${stats.maxImages} images (${stats.totalMB} MB / ${stats.maxMB} MB)`;
    } catch (error) {
      console.error('[ImageStorageManager] Error formatting storage:', error);
      return 'Unknown';
    }
  }

  /**
   * Verify all image files exist on disk
   * Used for integrity checks
   *
   * @returns {Promise<object>} Verification results
   */
  async verifyImageFiles() {
    try {
      console.log('[ImageStorageManager] Verifying image files...');

      const allImages = await ImageRepository.findAll();

      let existing = 0;
      let missing = 0;
      const missingImages = [];

      for (const image of allImages) {
        if (image.local_file_path) {
          const fileInfo = await FileSystem.getInfoAsync(image.local_file_path);

          if (fileInfo.exists) {
            existing++;
          } else {
            missing++;
            missingImages.push(image.id);

            // Update database to reflect missing file
            await ImageRepository.update(image.id, {
              local_file_path: null,
              file_size_bytes: 0,
            });
          }
        }
      }

      const result = {
        total: allImages.length,
        existing,
        missing,
        missingImages,
      };

      console.log('[ImageStorageManager] Verification complete:', result);

      return result;
    } catch (error) {
      console.error('[ImageStorageManager] Verification failed:', error);
      throw error;
    }
  }

  /**
   * Add storage listener for notifications
   *
   * @param {function} callback - Listener callback
   * @returns {function} Unsubscribe function
   */
  addStorageListener(callback) {
    this.storageListeners.push(callback);

    return () => {
      this.storageListeners = this.storageListeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify listeners of storage changes
   */
  notifyStorageChange(data) {
    this.storageListeners.forEach((listener) => {
      listener({
        event: 'storage_change',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Get last cleanup timestamp
   *
   * @returns {Date|null} Last cleanup date
   */
  getLastCleanup() {
    return this.lastCleanup;
  }
}

// Export singleton instance
export default new ImageStorageManager();
