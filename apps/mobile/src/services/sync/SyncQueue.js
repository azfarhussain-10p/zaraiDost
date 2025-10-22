// Sync Queue Manager
// Story 1.2: Background Synchronization Service
// Implements: Task 2.5 (Sync priority handling)

import { SYNC_PRIORITY } from '../../constants/SyncConstants';

/**
 * Manages sync operation queue with priority handling
 */
class SyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add sync operation to queue
   * Implements: Task 2.5 (Priority: user-initiated > auto-sync)
   *
   * @param {Object} operation - Sync operation details
   * @param {string} priority - SYNC_PRIORITY value
   */
  enqueue(operation, priority = SYNC_PRIORITY.NORMAL) {
    const queueItem = {
      ...operation,
      priority,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };

    // Insert based on priority (high priority goes first)
    const priorityOrder = {
      [SYNC_PRIORITY.HIGH]: 3,
      [SYNC_PRIORITY.NORMAL]: 2,
      [SYNC_PRIORITY.LOW]: 1,
    };

    const insertIndex = this.queue.findIndex(
      item => priorityOrder[item.priority] < priorityOrder[priority]
    );

    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    console.log(
      `[SyncQueue] Enqueued ${operation.entityType}:${operation.entityId} (${priority} priority), Queue size: ${this.queue.length}`
    );

    return queueItem;
  }

  /**
   * Get next item from queue (highest priority first)
   */
  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }

    const item = this.queue.shift();
    console.log(
      `[SyncQueue] Dequeued ${item.entityType}:${item.entityId} (${item.priority} priority)`
    );

    return item;
  }

  /**
   * Peek at next item without removing it
   */
  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Get queue size by priority
   */
  sizeByPriority() {
    return {
      high: this.queue.filter(item => item.priority === SYNC_PRIORITY.HIGH).length,
      normal: this.queue.filter(item => item.priority === SYNC_PRIORITY.NORMAL).length,
      low: this.queue.filter(item => item.priority === SYNC_PRIORITY.LOW).length,
    };
  }

  /**
   * Check if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Clear all items from queue
   */
  clear() {
    const size = this.queue.length;
    this.queue = [];
    console.log(`[SyncQueue] Cleared ${size} items from queue`);
    return size;
  }

  /**
   * Remove specific item from queue
   */
  remove(entityType, entityId) {
    const initialSize = this.queue.length;
    this.queue = this.queue.filter(
      item => !(item.entityType === entityType && item.entityId === entityId)
    );

    const removed = initialSize - this.queue.length;
    if (removed > 0) {
      console.log(`[SyncQueue] Removed ${entityType}:${entityId} from queue`);
    }

    return removed > 0;
  }

  /**
   * Get all items in queue (for display)
   */
  getAll() {
    return [...this.queue];
  }

  /**
   * Mark item as being processed
   */
  markProcessing() {
    this.processing = true;
  }

  /**
   * Mark processing complete
   */
  markComplete() {
    this.processing = false;
  }

  /**
   * Check if currently processing
   */
  isProcessing() {
    return this.processing;
  }

  /**
   * Get queue statistics
   */
  getStatistics() {
    const priorityCounts = this.sizeByPriority();

    return {
      total: this.queue.length,
      byPriority: priorityCounts,
      isProcessing: this.processing,
      oldestItem: this.queue.length > 0 ? this.queue[this.queue.length - 1] : null,
      newestItem: this.queue.length > 0 ? this.queue[0] : null,
    };
  }
}

// Singleton instance
export default new SyncQueue();
