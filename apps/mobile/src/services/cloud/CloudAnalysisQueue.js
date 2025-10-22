// Cloud Analysis Queue Service
// Story 3.3: Cloud-Based Enhanced Analysis
// AC1: Cloud analysis automatically triggered when online
// AC6: Fallback to on-device if cloud times out
// Manages queuing of cloud analysis requests when offline

import {
  CLOUD_ANALYSIS_STATUS,
  PERFORMANCE_CONFIG,
  QUEUE_CONFIG,
  ERROR_CODES,
  ANALYSIS_PRIORITY,
} from '../../constants/CloudAnalysisConstants';
import CloudVisionService from './CloudVisionService';
import ResultComparison from './ResultComparison';
import { NetworkMonitor } from '../sync/NetworkMonitor';

/**
 * CloudAnalysisQueue
 * Manages pending cloud analysis requests
 * Automatically processes queue when connectivity is restored
 */
class CloudAnalysisQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.processingInterval = null;

    // Performance tracking
    this.metrics = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalExpired: 0,
    };

    // Start monitoring network connectivity
    this._startNetworkMonitoring();

    // Start periodic queue processing
    this._startQueueProcessing();
  }

  /**
   * Add health check to queue for cloud analysis
   * AC1: Automatically triggered when online
   *
   * @param {object} queueItem - Queue item data
   * @returns {string} Queue item ID
   */
  async add(queueItem) {
    try {
      console.log('[CloudAnalysisQueue] Adding item to queue:', queueItem.healthCheckId);

      // Validate queue item
      if (!queueItem.healthCheckId) {
        throw new Error('Health check ID is required');
      }

      if (!queueItem.imageUrls || queueItem.imageUrls.length === 0) {
        throw new Error('At least one image URL is required');
      }

      // Check queue size limit
      if (this.queue.length >= QUEUE_CONFIG.MAX_QUEUE_SIZE) {
        console.warn('[CloudAnalysisQueue] Queue is full, removing oldest item');
        this.queue.shift();
      }

      // Create queue item
      const item = {
        id: queueItem.id || `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        healthCheckId: queueItem.healthCheckId,
        imageUrls: queueItem.imageUrls,
        context: queueItem.context || {},
        priority: queueItem.priority || ANALYSIS_PRIORITY.NORMAL,
        status: CLOUD_ANALYSIS_STATUS.QUEUED,
        retryCount: 0,
        maxRetries: queueItem.maxRetries || PERFORMANCE_CONFIG.MAX_RETRY_ATTEMPTS,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
        error: null,
        onDeviceResult: queueItem.onDeviceResult || null,
      };

      // Add to queue
      this.queue.push(item);
      this.metrics.totalQueued++;

      console.log(`[CloudAnalysisQueue] Item added. Queue size: ${this.queue.length}`);

      // Try to process immediately if online
      if (await NetworkMonitor.isOnline()) {
        console.log('[CloudAnalysisQueue] Online - attempting immediate processing');
        this.processQueue();
      }

      return item.id;
    } catch (error) {
      console.error('[CloudAnalysisQueue] Failed to add item:', error);
      throw error;
    }
  }

  /**
   * Process queue
   * Processes pending cloud analysis requests when online
   */
  async processQueue() {
    if (this.processing) {
      console.log('[CloudAnalysisQueue] Already processing queue');
      return;
    }

    try {
      this.processing = true;

      // Check if online
      const isOnline = await NetworkMonitor.isOnline();
      if (!isOnline) {
        console.log('[CloudAnalysisQueue] Offline - skipping queue processing');
        return;
      }

      console.log(`[CloudAnalysisQueue] Processing queue (${this.queue.length} items)`);

      // Get pending items (sorted by priority)
      const pendingItems = this.queue
        .filter(item =>
          item.status === CLOUD_ANALYSIS_STATUS.QUEUED ||
          item.status === CLOUD_ANALYSIS_STATUS.PENDING ||
          item.status === CLOUD_ANALYSIS_STATUS.FAILED
        )
        .sort((a, b) => this._comparePriority(a.priority, b.priority));

      if (pendingItems.length === 0) {
        console.log('[CloudAnalysisQueue] No pending items to process');
        return;
      }

      // Process batch
      const batchSize = Math.min(
        pendingItems.length,
        QUEUE_CONFIG.PROCESS_BATCH_SIZE
      );

      const batch = pendingItems.slice(0, batchSize);
      console.log(`[CloudAnalysisQueue] Processing batch of ${batch.length} items`);

      // Process items in parallel
      const processingPromises = batch.map(item => this._processItem(item));
      await Promise.allSettled(processingPromises);

      console.log('[CloudAnalysisQueue] Batch processing complete');

    } catch (error) {
      console.error('[CloudAnalysisQueue] Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process single queue item
   * @private
   */
  async _processItem(item) {
    try {
      console.log(`[CloudAnalysisQueue] Processing item: ${item.id}`);

      // Update status
      item.status = CLOUD_ANALYSIS_STATUS.ANALYZING;
      item.lastAttemptAt = new Date().toISOString();

      // Perform cloud analysis
      const cloudResult = await CloudVisionService.analyzeMultipleImages(
        item.imageUrls,
        item.context
      );

      // Compare with on-device result if available
      let comparison = null;
      if (item.onDeviceResult) {
        comparison = ResultComparison.compare(item.onDeviceResult, cloudResult);
      }

      // Update item status
      item.status = CLOUD_ANALYSIS_STATUS.COMPLETED;
      item.cloudResult = cloudResult;
      item.comparison = comparison;
      item.completedAt = new Date().toISOString();

      this.metrics.totalProcessed++;

      console.log(`[CloudAnalysisQueue] Item completed: ${item.id}`);

      // Trigger callback if provided
      if (item.onComplete) {
        item.onComplete(cloudResult, comparison);
      }

      // Remove from queue after successful processing
      this._removeItem(item.id);

      return { success: true, item };

    } catch (error) {
      console.error(`[CloudAnalysisQueue] Item processing failed:`, error);

      // Update retry count
      item.retryCount++;
      item.error = error.message;

      // Check if should retry
      if (item.retryCount < item.maxRetries) {
        console.log(`[CloudAnalysisQueue] Will retry (${item.retryCount}/${item.maxRetries})`);
        item.status = CLOUD_ANALYSIS_STATUS.FAILED;

        // Schedule retry with exponential backoff
        const retryDelay = PERFORMANCE_CONFIG.RETRY_DELAY_MS * Math.pow(2, item.retryCount - 1);
        setTimeout(() => {
          console.log(`[CloudAnalysisQueue] Retrying item: ${item.id}`);
          this._processItem(item);
        }, retryDelay);
      } else {
        console.log(`[CloudAnalysisQueue] Max retries exceeded for item: ${item.id}`);
        item.status = CLOUD_ANALYSIS_STATUS.FAILED;
        this.metrics.totalFailed++;

        // Trigger error callback if provided
        if (item.onError) {
          item.onError(error);
        }

        // Remove from queue
        this._removeItem(item.id);
      }

      return { success: false, item, error };
    }
  }

  /**
   * Remove item from queue
   * @private
   */
  _removeItem(itemId) {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      console.log(`[CloudAnalysisQueue] Item removed: ${itemId}. Queue size: ${this.queue.length}`);
    }
  }

  /**
   * Compare priority levels
   * @private
   */
  _comparePriority(priorityA, priorityB) {
    const priorityOrder = {
      [ANALYSIS_PRIORITY.HIGH]: 3,
      [ANALYSIS_PRIORITY.NORMAL]: 2,
      [ANALYSIS_PRIORITY.LOW]: 1,
    };

    return (priorityOrder[priorityB] || 0) - (priorityOrder[priorityA] || 0);
  }

  /**
   * Start network monitoring
   * AC1: Automatically trigger when online
   * @private
   */
  _startNetworkMonitoring() {
    // Listen for network connectivity changes
    if (NetworkMonitor && NetworkMonitor.on) {
      NetworkMonitor.on('online', () => {
        console.log('[CloudAnalysisQueue] Network online - processing queue');
        this.processQueue();
      });

      NetworkMonitor.on('offline', () => {
        console.log('[CloudAnalysisQueue] Network offline - pausing queue processing');
      });
    }
  }

  /**
   * Start periodic queue processing
   * @private
   */
  _startQueueProcessing() {
    // Process queue periodically
    this.processingInterval = setInterval(() => {
      if (this.queue.length > 0) {
        console.log('[CloudAnalysisQueue] Periodic queue check');
        this.processQueue();
      }
    }, QUEUE_CONFIG.PROCESS_INTERVAL_MS);

    // Cleanup expired items periodically
    setInterval(() => {
      this._cleanupExpiredItems();
    }, QUEUE_CONFIG.CLEANUP_INTERVAL_MS);
  }

  /**
   * Cleanup expired queue items
   * @private
   */
  _cleanupExpiredItems() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - PERFORMANCE_CONFIG.QUEUE_EXPIRY_DAYS);

    const beforeCount = this.queue.length;
    this.queue = this.queue.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate > expiryDate;
    });

    const removedCount = beforeCount - this.queue.length;
    if (removedCount > 0) {
      console.log(`[CloudAnalysisQueue] Cleaned up ${removedCount} expired items`);
      this.metrics.totalExpired += removedCount;
    }
  }

  /**
   * Get queue status
   * @returns {object} Queue status
   */
  getStatus() {
    const statusCounts = this.queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return {
      queueSize: this.queue.length,
      processing: this.processing,
      statusCounts,
      metrics: this.metrics,
      oldestItem: this.queue[0]?.createdAt || null,
      newestItem: this.queue[this.queue.length - 1]?.createdAt || null,
    };
  }

  /**
   * Get pending items count
   * @returns {number} Pending count
   */
  getPendingCount() {
    return this.queue.filter(item =>
      item.status === CLOUD_ANALYSIS_STATUS.QUEUED ||
      item.status === CLOUD_ANALYSIS_STATUS.PENDING
    ).length;
  }

  /**
   * Clear queue
   */
  clear() {
    console.log('[CloudAnalysisQueue] Clearing queue');
    this.queue = [];
  }

  /**
   * Stop queue processing
   */
  stop() {
    console.log('[CloudAnalysisQueue] Stopping queue processing');
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Retry failed item manually
   * @param {string} itemId - Queue item ID
   */
  async retryItem(itemId) {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    if (item.status !== CLOUD_ANALYSIS_STATUS.FAILED) {
      throw new Error(`Item is not in failed state: ${itemId}`);
    }

    console.log(`[CloudAnalysisQueue] Manually retrying item: ${itemId}`);
    item.status = CLOUD_ANALYSIS_STATUS.QUEUED;
    item.retryCount = 0;
    item.error = null;

    await this._processItem(item);
  }

  /**
   * Get all queue items
   * @returns {array} Queue items
   */
  getAllItems() {
    return [...this.queue];
  }
}

// Export singleton instance
export default new CloudAnalysisQueue();
