// ImageUploadQueue.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 3 (Upload queue management system)

import {
  UPLOAD_QUEUE,
  SYNC_STATUS,
  UPLOAD_PRIORITY,
  PRIORITIZATION,
  BACKGROUND_UPLOAD,
  ERROR_MESSAGES,
} from '../../constants/ImageConstants';
import ImageRepository from '../../database/repositories/ImageRepository';
import S3UploadService from './S3UploadService';
import NetworkMonitor from '../sync/NetworkMonitor';
import ImageStorageManager from './ImageStorageManager';

/**
 * ImageUploadQueue
 *
 * Service for managing image upload queue with intelligent prioritization.
 * Handles automatic upload when connectivity restored, retry logic, and
 * background upload processing.
 *
 * Implements AC3: Images automatically upload when connectivity restored
 * Implements AC4: Upload queue prioritizes recent/unsynced images
 * Implements AC6: Storage management prevents filling device
 */
class ImageUploadQueue {
  constructor() {
    this.isProcessing = false;
    this.uploadListeners = [];
    this.networkListener = null;
    this.backgroundTaskId = null;
  }

  /**
   * Initialize upload queue service
   * Sets up network monitoring and background upload
   */
  async initialize() {
    try {
      console.log('[ImageUploadQueue] Initializing upload queue...');

      // Initialize Network Monitor
      await NetworkMonitor.initialize();

      // Listen for connectivity changes
      this.networkListener = NetworkMonitor.addListener((status) => {
        console.log('[ImageUploadQueue] Network status changed:', status);

        if (status.isConnected) {
          // Trigger upload when connection restored
          console.log('[ImageUploadQueue] Connection restored, starting upload...');
          this.processQueue();
        }
      });

      // Start background upload task
      if (BACKGROUND_UPLOAD.ENABLE) {
        this.startBackgroundUpload();
      }

      console.log('[ImageUploadQueue] Upload queue initialized');
      return true;
    } catch (error) {
      console.error('[ImageUploadQueue] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process upload queue
   * Implements AC3, AC4
   *
   * @param {boolean} force - Force upload even if already processing
   * @returns {Promise<object>} Upload statistics
   */
  async processQueue(force = false) {
    try {
      if (this.isProcessing && !force) {
        console.log('[ImageUploadQueue] Queue already processing, skipping...');
        return { skipped: true };
      }

      // Check network connectivity
      const networkStatus = NetworkMonitor.getStatus();
      if (!networkStatus.isConnected) {
        console.log('[ImageUploadQueue] No network connection, skipping upload');
        return { skipped: true, reason: 'no_network' };
      }

      // Check WiFi-only setting
      if (BACKGROUND_UPLOAD.WIFI_ONLY && !NetworkMonitor.isWiFi()) {
        console.log('[ImageUploadQueue] WiFi-only mode enabled, skipping cellular upload');
        return { skipped: true, reason: 'wifi_only' };
      }

      // Check battery level
      // const batteryLevel = await this.getBatteryLevel();
      // if (batteryLevel < BACKGROUND_UPLOAD.MIN_BATTERY_LEVEL) {
      //   console.log('[ImageUploadQueue] Battery too low, skipping upload');
      //   return { skipped: true, reason: 'low_battery' };
      // }

      console.log('[ImageUploadQueue] Starting queue processing...');
      this.isProcessing = true;

      // Get pending images with prioritization
      const pendingImages = await this.getPendingImagesWithPriority();

      if (pendingImages.length === 0) {
        console.log('[ImageUploadQueue] No pending images to upload');
        this.isProcessing = false;
        return { uploaded: 0, failed: 0, total: 0 };
      }

      console.log(`[ImageUploadQueue] Found ${pendingImages.length} images to upload`);

      // Determine batch size based on connection type
      const batchSize = NetworkMonitor.isWiFi()
        ? UPLOAD_QUEUE.BATCH_SIZE_WIFI
        : UPLOAD_QUEUE.BATCH_SIZE_CELLULAR;

      console.log(`[ImageUploadQueue] Batch size: ${batchSize} (${networkStatus.connectionType})`);

      // Upload in batches
      const stats = {
        uploaded: 0,
        failed: 0,
        total: pendingImages.length,
      };

      for (let i = 0; i < pendingImages.length; i += batchSize) {
        const batch = pendingImages.slice(i, i + batchSize);

        // Upload batch in parallel
        const results = await Promise.allSettled(
          batch.map((image) => this.uploadImage(image))
        );

        // Update statistics
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.success) {
            stats.uploaded++;
          } else {
            stats.failed++;
          }
        });

        console.log(`[ImageUploadQueue] Batch ${Math.floor(i / batchSize) + 1} complete. Uploaded: ${stats.uploaded}, Failed: ${stats.failed}`);
      }

      this.isProcessing = false;

      console.log('[ImageUploadQueue] Queue processing complete:', stats);

      // Notify listeners
      this.notifyUploadComplete(stats);

      // Trigger storage cleanup after successful uploads
      if (stats.uploaded > 0) {
        await ImageStorageManager.cleanup();
      }

      return stats;
    } catch (error) {
      this.isProcessing = false;
      console.error('[ImageUploadQueue] Queue processing failed:', error);
      throw error;
    }
  }

  /**
   * Get pending images with intelligent prioritization
   * Implements AC4: Upload queue prioritizes recent/unsynced images
   *
   * @returns {Promise<Array>} Prioritized list of pending images
   */
  async getPendingImagesWithPriority() {
    try {
      // Get all pending and failed images
      const pendingImages = await ImageRepository.getPendingUploads();

      if (pendingImages.length === 0) {
        return [];
      }

      // Calculate priority score for each image
      const now = new Date();
      const prioritizedImages = pendingImages.map((image) => {
        let score = 0;

        // 1. Recent images get higher priority
        const imageDate = new Date(image.timestamp);
        const hoursSinceCapture = (now - imageDate) / (1000 * 60 * 60);
        if (hoursSinceCapture < PRIORITIZATION.RECENT_HOURS_THRESHOLD) {
          score += PRIORITIZATION.SCORE_RECENT_IMAGE;
        }

        // 2. High confidence critical diseases prioritized
        if (image.confidence_score >= PRIORITIZATION.CRITICAL_CONFIDENCE_THRESHOLD) {
          score += PRIORITIZATION.SCORE_HIGH_CONFIDENCE;
        }

        // 3. Failed uploads with fewer retries prioritized
        if (image.upload_attempts < PRIORITIZATION.MAX_RETRY_PRIORITY) {
          score += PRIORITIZATION.SCORE_LOW_RETRY_COUNT;
        }

        // 4. Failed status gets slight priority boost
        if (image.sync_status === SYNC_STATUS.FAILED) {
          score += PRIORITIZATION.SCORE_FAILED_STATUS;
        }

        return {
          ...image,
          priorityScore: score,
        };
      });

      // Sort by priority score (highest first)
      prioritizedImages.sort((a, b) => b.priorityScore - a.priorityScore);

      // Limit to max queue size
      const queuedImages = prioritizedImages.slice(0, UPLOAD_QUEUE.MAX_QUEUE_SIZE);

      console.log('[ImageUploadQueue] Prioritization complete. Top image score:', queuedImages[0]?.priorityScore);

      return queuedImages;
    } catch (error) {
      console.error('[ImageUploadQueue] Prioritization failed:', error);
      throw error;
    }
  }

  /**
   * Upload single image to S3
   *
   * @param {object} image - Image record from database
   * @returns {Promise<object>} Upload result
   */
  async uploadImage(image) {
    try {
      console.log(`[ImageUploadQueue] Uploading image ${image.id}...`);

      // Check if max retry attempts exceeded
      if (image.upload_attempts >= UPLOAD_QUEUE.MAX_RETRY_ATTEMPTS) {
        console.log(`[ImageUploadQueue] Max retry attempts (${UPLOAD_QUEUE.MAX_RETRY_ATTEMPTS}) exceeded for image ${image.id}`);
        return { success: false, reason: 'max_retries_exceeded' };
      }

      // Update status to uploading
      await ImageRepository.updateSyncStatus(image.id, SYNC_STATUS.UPLOADING);

      // Notify listeners
      this.notifyUploadProgress(image.id, 0);

      // Upload to S3
      const uploadResult = await S3UploadService.uploadImage(
        image.local_file_path,
        image.id,
        (progress) => {
          this.notifyUploadProgress(image.id, progress);
        }
      );

      if (uploadResult.success) {
        // Update database with remote URL and synced status
        await ImageRepository.update(image.id, {
          remote_url: uploadResult.remoteUrl,
          sync_status: SYNC_STATUS.SYNCED,
          last_upload_attempt: new Date().toISOString(),
          upload_attempts: image.upload_attempts + 1,
          upload_error_message: null,
        });

        console.log(`[ImageUploadQueue] Image ${image.id} uploaded successfully`);

        // Notify listeners
        this.notifyUploadSuccess(image.id, uploadResult.remoteUrl);

        return { success: true, remoteUrl: uploadResult.remoteUrl };
      } else {
        // Upload failed, update status
        await ImageRepository.update(image.id, {
          sync_status: SYNC_STATUS.FAILED,
          last_upload_attempt: new Date().toISOString(),
          upload_attempts: image.upload_attempts + 1,
          upload_error_message: uploadResult.error || 'Unknown error',
        });

        console.error(`[ImageUploadQueue] Image ${image.id} upload failed:`, uploadResult.error);

        // Notify listeners
        this.notifyUploadFailed(image.id, uploadResult.error);

        return { success: false, error: uploadResult.error };
      }
    } catch (error) {
      console.error(`[ImageUploadQueue] Upload error for image ${image.id}:`, error);

      // Update failure status
      await ImageRepository.update(image.id, {
        sync_status: SYNC_STATUS.FAILED,
        last_upload_attempt: new Date().toISOString(),
        upload_attempts: image.upload_attempts + 1,
        upload_error_message: error.message,
      });

      // Notify listeners
      this.notifyUploadFailed(image.id, error.message);

      return { success: false, error: error.message };
    }
  }

  /**
   * Retry failed uploads
   *
   * @returns {Promise<object>} Retry statistics
   */
  async retryFailedUploads() {
    try {
      console.log('[ImageUploadQueue] Retrying failed uploads...');

      // Reset failed images under max retry attempts
      const failedImages = await ImageRepository.getFailedUploads();
      const retryableImages = failedImages.filter(
        (img) => img.upload_attempts < UPLOAD_QUEUE.MAX_RETRY_ATTEMPTS
      );

      console.log(`[ImageUploadQueue] Found ${retryableImages.length} retryable images`);

      // Process queue to upload them
      return await this.processQueue(true);
    } catch (error) {
      console.error('[ImageUploadQueue] Retry failed:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   *
   * @returns {Promise<object>} Queue statistics
   */
  async getQueueStatistics() {
    try {
      const stats = {
        pending: await ImageRepository.countByStatus(SYNC_STATUS.PENDING),
        uploading: await ImageRepository.countByStatus(SYNC_STATUS.UPLOADING),
        synced: await ImageRepository.countByStatus(SYNC_STATUS.SYNCED),
        failed: await ImageRepository.countByStatus(SYNC_STATUS.FAILED),
        totalImages: await ImageRepository.count(),
      };

      return stats;
    } catch (error) {
      console.error('[ImageUploadQueue] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Start background upload task
   * Runs every BACKGROUND_UPLOAD.INTERVAL_MINUTES
   */
  startBackgroundUpload() {
    if (this.backgroundTaskId) {
      console.log('[ImageUploadQueue] Background upload already running');
      return;
    }

    const intervalMs = BACKGROUND_UPLOAD.INTERVAL_MINUTES * 60 * 1000;

    this.backgroundTaskId = setInterval(async () => {
      console.log('[ImageUploadQueue] Background upload task triggered');
      try {
        await this.processQueue();
      } catch (error) {
        console.error('[ImageUploadQueue] Background upload error:', error);
      }
    }, intervalMs);

    console.log(`[ImageUploadQueue] Background upload started (interval: ${BACKGROUND_UPLOAD.INTERVAL_MINUTES}m)`);
  }

  /**
   * Stop background upload task
   */
  stopBackgroundUpload() {
    if (this.backgroundTaskId) {
      clearInterval(this.backgroundTaskId);
      this.backgroundTaskId = null;
      console.log('[ImageUploadQueue] Background upload stopped');
    }
  }

  /**
   * Add upload listener for progress updates
   *
   * @param {function} callback - Listener callback
   * @returns {function} Unsubscribe function
   */
  addUploadListener(callback) {
    this.uploadListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.uploadListeners = this.uploadListeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify listeners of upload progress
   */
  notifyUploadProgress(imageId, progress) {
    this.uploadListeners.forEach((listener) => {
      listener({
        event: 'progress',
        imageId,
        progress,
      });
    });
  }

  /**
   * Notify listeners of upload success
   */
  notifyUploadSuccess(imageId, remoteUrl) {
    this.uploadListeners.forEach((listener) => {
      listener({
        event: 'success',
        imageId,
        remoteUrl,
      });
    });
  }

  /**
   * Notify listeners of upload failure
   */
  notifyUploadFailed(imageId, error) {
    this.uploadListeners.forEach((listener) => {
      listener({
        event: 'failed',
        imageId,
        error,
      });
    });
  }

  /**
   * Notify listeners of queue completion
   */
  notifyUploadComplete(stats) {
    this.uploadListeners.forEach((listener) => {
      listener({
        event: 'complete',
        stats,
      });
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('[ImageUploadQueue] Cleaning up...');

    // Stop background upload
    this.stopBackgroundUpload();

    // Remove network listener
    if (this.networkListener) {
      NetworkMonitor.removeListener(this.networkListener);
      this.networkListener = null;
    }

    // Clear listeners
    this.uploadListeners = [];
  }

  /**
   * Get current processing status
   *
   * @returns {boolean} True if processing
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}

// Export singleton instance
export default new ImageUploadQueue();
