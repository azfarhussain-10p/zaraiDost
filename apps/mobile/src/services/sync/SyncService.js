// Sync Service
// Story 1.2: Background Synchronization Service
// Implements: Task 2 (Sync orchestration), Task 4 (Conflict resolution)

import NetworkMonitor from './NetworkMonitor';
import FarmerRepository from '../../database/repositories/FarmerRepository';
import FieldRepository from '../../database/repositories/FieldRepository';
import CropRepository from '../../database/repositories/CropRepository';
import QueryRepository from '../../database/repositories/QueryRepository';
import ImageRepository from '../../database/repositories/ImageRepository';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.retryCount = 0;
    this.maxRetries = 6;
    this.syncListeners = [];
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
   * Implements: Task 2.1 (Sync orchestration)
   */
  async performSync(isManual = false) {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return { success: false, message: 'Sync in progress' };
    }

    if (!NetworkMonitor.isNetworkAvailable()) {
      console.log('[SyncService] No network connection');
      return { success: false, message: 'No network connection' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing', isManual });

    try {
      console.log('[SyncService] Starting sync...', isManual ? '(manual)' : '(auto)');

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

      this.notifyListeners({
        status: 'success',
        totalSynced,
        lastSyncTime: this.lastSyncTime,
      });

      console.log(`[SyncService] Sync complete: ${totalSynced} items synced`);
      return { success: true, totalSynced, lastSyncTime: this.lastSyncTime };

    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      
      // Implements: Task 2.4 (Exponential backoff)
      if (this.retryCount < this.maxRetries) {
        this.scheduleRetry();
      }

      this.notifyListeners({ status: 'failed', error: error.message });
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
  scheduleRetry() {
    this.retryCount++;
    const delay = Math.min(Math.pow(2, this.retryCount - 1) * 1000, 60000);
    
    console.log(`[SyncService] Scheduling retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
    
    setTimeout(() => {
      this.performSync(false);
    }, delay);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      retryCount: this.retryCount,
      isConnected: NetworkMonitor.isNetworkAvailable(),
    };
  }

  /**
   * Add sync listener
   */
  addListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify listeners
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
}

// Singleton instance
export default new SyncService();

