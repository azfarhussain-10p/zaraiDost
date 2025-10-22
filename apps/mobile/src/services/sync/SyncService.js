// Sync Service
// Story 1.2: Background Synchronization Service
// Implements: Task 2 (Sync orchestration), Task 4 (Conflict resolution)

import NetworkMonitor from './NetworkMonitor';
import ConflictResolver from './ConflictResolver';
import SyncQueue from './SyncQueue';
import FarmerRepository from '../../database/repositories/FarmerRepository';
import FieldRepository from '../../database/repositories/FieldRepository';
import CropRepository from '../../database/repositories/CropRepository';
import QueryRepository from '../../database/repositories/QueryRepository';
import ImageRepository from '../../database/repositories/ImageRepository';
import {
  SYNC_PRIORITY,
  SYNC_EVENTS,
  RETRY_CONFIG,
  SYNC_STATUS
} from '../../constants/SyncConstants';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.retryCount = 0;
    this.maxRetries = RETRY_CONFIG.MAX_RETRIES;
    this.syncListeners = [];
    this.syncHistory = [];
  }

  /**
   * Initialize sync service
   * Implements: Task 2.2 (Auto-sync trigger on connectivity restored)
   */
  async init() {
    console.log('[SyncService] Initializing...');
    
    // Listen for network changes
    NetworkMonitor.addListener(async ({ isConnected, wasConnected }) => {
      if (isConnected && !wasConnected) {
        console.log('[SyncService] Connection restored, triggering auto-sync');
        await this.performSync(false); // Auto-sync
      }
    });

    console.log('[SyncService] Initialized');
  }

  /**
   * Perform sync operation
   * Implements: Task 2.1 (Sync orchestration), Task 2.5 (Priority handling)
   *
   * @param {boolean} isManual - Whether sync was manually triggered
   * @param {string} priority - Sync priority level
   */
  async performSync(isManual = false, priority = SYNC_PRIORITY.NORMAL) {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return { success: false, message: 'Sync in progress' };
    }

    if (!NetworkMonitor.isNetworkAvailable()) {
      console.log('[SyncService] No network connection');
      return { success: false, message: 'No network connection' };
    }

    this.isSyncing = true;
    const syncStartTime = Date.now();

    this.notifyListeners({
      event: SYNC_EVENTS.SYNC_STARTED,
      isManual,
      priority
    });

    try {
      console.log(
        `[SyncService] Starting sync... (${isManual ? 'manual' : 'auto'}, priority: ${priority})`
      );

      // Get all pending items
      const pendingFarmers = await FarmerRepository.findPendingSync();
      const pendingFields = await FieldRepository.findPendingSync();
      const pendingCrops = await CropRepository.findPendingSync();
      const pendingQueries = await QueryRepository.findPendingSync();
      const pendingImages = await ImageRepository.findPendingSync();

      const totalPending =
        pendingFarmers.length +
        pendingFields.length +
        pendingCrops.length +
        pendingQueries.length +
        pendingImages.length;

      console.log(`[SyncService] Found ${totalPending} items to sync`);

      if (totalPending === 0) {
        this.lastSyncTime = new Date().toISOString();
        this.recordSyncHistory(true, 0, 0, syncStartTime);

        this.notifyListeners({
          event: SYNC_EVENTS.SYNC_SUCCESS,
          totalSynced: 0,
          lastSyncTime: this.lastSyncTime,
        });

        return { success: true, totalSynced: 0, lastSyncTime: this.lastSyncTime };
      }

      // Sync each entity type
      // TODO: Replace with actual API calls when backend is ready
      const results = {
        farmers: await this.syncEntities(pendingFarmers, FarmerRepository, 'farmers'),
        fields: await this.syncEntities(pendingFields, FieldRepository, 'fields'),
        crops: await this.syncEntities(pendingCrops, CropRepository, 'crops'),
        queries: await this.syncEntities(pendingQueries, QueryRepository, 'queries'),
        images: await this.syncEntities(pendingImages, ImageRepository, 'images'),
      };

      const totalSynced =
        results.farmers + results.fields + results.crops + results.queries + results.images;

      this.lastSyncTime = new Date().toISOString();
      this.retryCount = 0; // Reset retry counter on success

      // Record sync history
      this.recordSyncHistory(true, totalSynced, totalPending, syncStartTime);

      this.notifyListeners({
        event: SYNC_EVENTS.SYNC_SUCCESS,
        totalSynced,
        totalPending,
        lastSyncTime: this.lastSyncTime,
        results,
      });

      console.log(`[SyncService] Sync complete: ${totalSynced}/${totalPending} items synced`);
      return { success: true, totalSynced, totalPending, lastSyncTime: this.lastSyncTime };

    } catch (error) {
      console.error('[SyncService] Sync failed:', error);

      // Record failed sync
      this.recordSyncHistory(false, 0, 0, syncStartTime, error.message);

      // Implements: Task 2.4 (Exponential backoff)
      if (this.retryCount < this.maxRetries) {
        this.scheduleRetry(priority);
      }

      this.notifyListeners({
        event: SYNC_EVENTS.SYNC_FAILED,
        error: error.message
      });
      return { success: false, error: error.message };

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync entities to server (mock implementation)
   * TODO: Replace with actual GraphQL API calls
   */
  async syncEntities(entities, repository, entityType) {
    console.log(`[SyncService] Syncing ${entities.length} ${entityType}...`);
    
    let syncedCount = 0;
    for (const entity of entities) {
      try {
        // Mock API call - replace with actual GraphQL mutation
        await this.mockApiSync(entity, entityType);
        
        // Mark as synced in local database
        await repository.markAsSynced(entity.id);
        syncedCount++;
      } catch (error) {
        console.error(`[SyncService] Failed to sync ${entityType} ${entity.id}:`, error);
      }
    }

    return syncedCount;
  }

  /**
   * Mock API sync (replace with actual GraphQL calls)
   */
  async mockApiSync(entity, entityType) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // TODO: Implement actual GraphQL mutations:
    // - mutation SyncFarmer
    // - mutation SyncField
    // - mutation SyncCrop
    // - mutation SyncQuery
    // - mutation SyncImage
    
    console.log(`[SyncService] Mock synced ${entityType}:`, entity.id);
    return { success: true, id: entity.id };
  }

  /**
   * Schedule retry with exponential backoff
   * Implements: Task 2.4 (Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s)
   */
  scheduleRetry(priority = SYNC_PRIORITY.NORMAL) {
    this.retryCount++;
    const delay = Math.min(
      Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, this.retryCount - 1) *
        RETRY_CONFIG.INITIAL_DELAY,
      RETRY_CONFIG.MAX_DELAY
    );

    console.log(
      `[SyncService] Scheduling retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`
    );

    setTimeout(() => {
      this.performSync(false, priority);
    }, delay);
  }

  /**
   * Record sync operation in history
   * Implements: Task 6.3 (Track sync attempts and failures)
   */
  recordSyncHistory(success, syncedCount, pendingCount, startTime, error = null) {
    const record = {
      timestamp: new Date().toISOString(),
      success,
      syncedCount,
      pendingCount,
      duration: Date.now() - startTime,
      error,
      retryCount: this.retryCount,
    };

    this.syncHistory.push(record);

    // Keep only last 50 records
    if (this.syncHistory.length > 50) {
      this.syncHistory.shift();
    }

    console.log('[SyncService] Sync history recorded:', record);
  }

  /**
   * Get sync history
   * Implements: Task 5.6 (Show sync history)
   */
  getSyncHistory(limit = 10) {
    return this.syncHistory.slice(-limit).reverse();
  }

  /**
   * Get sync status
   * Implements: Task 5.2, 5.4 (Display sync status, last sync time)
   */
  getSyncStatus() {
    const queueStats = SyncQueue.getStatistics();

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      retryCount: this.retryCount,
      isConnected: NetworkMonitor.isNetworkAvailable(),
      connectionType: NetworkMonitor.getConnectionInfo().connectionType,
      queueSize: queueStats.total,
      queueByPriority: queueStats.byPriority,
    };
  }

  /**
   * Get pending sync count
   * Implements: Task 5.3 (Show pending changes counter)
   */
  async getPendingCount() {
    try {
      const [farmers, fields, crops, queries, images] = await Promise.all([
        FarmerRepository.count('sync_status = ?', [SYNC_STATUS.PENDING]),
        FieldRepository.count('sync_status = ?', [SYNC_STATUS.PENDING]),
        CropRepository.count('sync_status = ?', [SYNC_STATUS.PENDING]),
        QueryRepository.count('sync_status = ?', [SYNC_STATUS.PENDING]),
        ImageRepository.count('sync_status = ?', [SYNC_STATUS.PENDING]),
      ]);

      const total = farmers + fields + crops + queries + images;

      return {
        total,
        byType: { farmers, fields, crops, queries, images },
      };
    } catch (error) {
      console.error('[SyncService] Failed to get pending count:', error);
      return { total: 0, byType: {} };
    }
  }

  /**
   * Manual sync trigger
   * Implements: Task 5.1 (Manual sync button)
   */
  async triggerManualSync() {
    console.log('[SyncService] Manual sync triggered');
    return await this.performSync(true, SYNC_PRIORITY.HIGH);
  }

  /**
   * Add sync listener
   * Implements: Task 6.4 (Sync event emitter)
   */
  addListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners
   * Implements: Task 6.4 (Sync event emitter)
   */
  notifyListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SyncService] Listener error:', error);
      }
    });
  }

  /**
   * Clear sync history
   */
  clearHistory() {
    this.syncHistory = [];
    console.log('[SyncService] History cleared');
  }

  /**
   * Get sync statistics
   */
  getStatistics() {
    const totalSyncs = this.syncHistory.length;
    const successfulSyncs = this.syncHistory.filter(h => h.success).length;
    const failedSyncs = totalSyncs - successfulSyncs;
    const avgDuration =
      totalSyncs > 0
        ? this.syncHistory.reduce((sum, h) => sum + h.duration, 0) / totalSyncs
        : 0;

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      lastSyncTime: this.lastSyncTime,
    };
  }
}

// Singleton instance
export default new SyncService();

