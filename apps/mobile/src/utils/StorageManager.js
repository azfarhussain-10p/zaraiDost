// Storage Manager Utility
// Story 1.1: Local Data Storage Foundation
// Implements: Task 5 (Storage management and cleanup)

import * as FileSystem from 'expo-file-system';
import { getDatabase } from '../database/config/db.config';
import QueryRepository from '../database/repositories/QueryRepository';
import ImageRepository from '../database/repositories/ImageRepository';
import { STORAGE_LIMITS, DATABASE_NAME } from '../constants/DatabaseConstants';

/**
 * Monitor and manage storage usage
 * Implements AC2: Initial app installation requires <100MB storage space
 */
export class StorageManager {
  /**
   * Get database file size in MB
   * Implements: Task 5.1 (Storage monitoring utility)
   */
  static async getDatabaseSize() {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (fileInfo.exists) {
        const sizeInMB = (fileInfo.size / 1024 / 1024).toFixed(2);
        console.log(`[StorageManager] Database size: ${sizeInMB}MB`);
        return parseFloat(sizeInMB);
      }
      
      return 0;
    } catch (error) {
      console.error('[StorageManager] GetDatabaseSize failed:', error);
      return 0;
    }
  }

  /**
   * Get total app storage usage in MB
   */
  static async getTotalStorage() {
    try {
      const dbSize = await this.getDatabaseSize();
      
      // Get total directory size (includes images, cache, etc.)
      const totalSize = await this.getDirectorySize(FileSystem.documentDirectory);
      
      return {
        totalMB: totalSize,
        databaseMB: dbSize,
        otherMB: totalSize - dbSize,
        limitMB: STORAGE_LIMITS.MAX_TOTAL_MB,
        percentageUsed: ((totalSize / STORAGE_LIMITS.MAX_TOTAL_MB) * 100).toFixed(1),
      };
    } catch (error) {
      console.error('[StorageManager] GetTotalStorage failed:', error);
      return {
        totalMB: 0,
        databaseMB: 0,
        otherMB: 0,
        limitMB: STORAGE_LIMITS.MAX_TOTAL_MB,
        percentageUsed: 0,
      };
    }
  }

  /**
   * Get directory size recursively
   */
  static async getDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      const items = await FileSystem.readDirectoryAsync(dirPath);
      
      for (const item of items) {
        const itemPath = `${dirPath}${item}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);
        
        if (itemInfo.isDirectory) {
          totalSize += await this.getDirectorySize(`${itemPath}/`);
        } else {
          totalSize += itemInfo.size || 0;
        }
      }
      
      return totalSize / 1024 / 1024; // Convert to MB
    } catch (error) {
      console.error('[StorageManager] GetDirectorySize failed:', error);
      return 0;
    }
  }

  /**
   * Check if approaching storage limit
   * Implements: Task 5.5 (Alert user if storage approaching 100MB limit)
   */
  static async isApproachingLimit(threshold = 0.8) {
    const storage = await this.getTotalStorage();
    const usagePercentage = storage.percentageUsed / 100;
    
    return {
      isApproaching: usagePercentage >= threshold,
      currentMB: storage.totalMB,
      limitMB: storage.limitMB,
      percentageUsed: storage.percentageUsed,
    };
  }

  /**
   * Clean up old data to free storage
   * Implements: Task 5.2, 5.3 (Data cleanup)
   */
  static async performCleanup() {
    console.log('[StorageManager] Starting storage cleanup...');
    
    try {
      let deletedItems = 0;

      // Cleanup old queries (older than 90 days)
      const deletedQueries = await QueryRepository.deleteOlderThan(
        STORAGE_LIMITS.QUERY_RETENTION_DAYS
      );
      deletedItems += deletedQueries;

      // Cleanup old images (keep only 50 most recent)
      const deletedImages = await ImageRepository.cleanupOldImages();
      deletedItems += deletedImages;

      console.log(`[StorageManager] Cleanup completed: ${deletedItems} items deleted`);
      
      return {
        success: true,
        deletedQueries,
        deletedImages,
        totalDeleted: deletedItems,
      };
    } catch (error) {
      console.error('[StorageManager] Cleanup failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Automatic cleanup if storage is high
   */
  static async autoCleanupIfNeeded() {
    const { isApproaching } = await this.isApproachingLimit(0.9); // 90% threshold
    
    if (isApproaching) {
      console.log('[StorageManager] Storage approaching limit, running auto-cleanup...');
      return await this.performCleanup();
    }
    
    console.log('[StorageManager] Storage within acceptable limits');
    return { success: true, skipped: true };
  }

  /**
   * Get storage statistics
   * Implements: Task 5.4 (Storage usage display in app settings)
   */
  static async getStorageStats() {
    const db = getDatabase();
    const storage = await this.getTotalStorage();
    
    try {
      // Get record counts
      const farmerCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM farmers');
      const fieldCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM fields');
      const cropCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM crops');
      const queryCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM queries');
      const imageCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM images');
      
      return {
        storage,
        records: {
          farmers: farmerCount?.count || 0,
          fields: fieldCount?.count || 0,
          crops: cropCount?.count || 0,
          queries: queryCount?.count || 0,
          images: imageCount?.count || 0,
        },
        limits: {
          maxTotalMB: STORAGE_LIMITS.MAX_TOTAL_MB,
          maxDatabaseMB: STORAGE_LIMITS.MAX_DATABASE_MB,
          maxImages: STORAGE_LIMITS.MAX_IMAGES,
          queryRetentionDays: STORAGE_LIMITS.QUERY_RETENTION_DAYS,
        },
      };
    } catch (error) {
      console.error('[StorageManager] GetStorageStats failed:', error);
      throw error;
    }
  }
}

export default StorageManager;

