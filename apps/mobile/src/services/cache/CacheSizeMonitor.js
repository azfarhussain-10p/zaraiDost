// CacheSizeMonitor
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 7 (Cache size management)

import WeatherCacheRepository from '../../database/repositories/WeatherCacheRepository';
import AdvisoryCacheRepository from '../../database/repositories/AdvisoryCacheRepository';
import { CACHE_SIZE } from '../../constants/CacheConstants';

/**
 * Service for monitoring and managing cache storage size
 * Enforces size limits and provides cache usage statistics
 */
class CacheSizeMonitor {
  /**
   * Get total cache size across all cache types
   */
  async getTotalCacheSize() {
    try {
      const weatherSize = await WeatherCacheRepository.getCacheSize();
      const advisorySize = await AdvisoryCacheRepository.getCacheSize();

      const totalBytes = weatherSize + advisorySize;
      const totalMB = totalBytes / (1024 * 1024);
      const maxMB = CACHE_SIZE.MAX_TOTAL_MB;
      const usagePercent = (totalMB / maxMB) * 100;

      return {
        totalBytes,
        totalMB: totalMB.toFixed(2),
        maxMB,
        usagePercent: Math.round(usagePercent),
        weatherBytes: weatherSize,
        weatherMB: (weatherSize / (1024 * 1024)).toFixed(2),
        advisoryBytes: advisorySize,
        advisoryMB: (advisorySize / (1024 * 1024)).toFixed(2),
        isNearLimit: usagePercent >= 80,
        isOverLimit: totalMB > maxMB,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get total cache size failed:', error);
      throw error;
    }
  }

  /**
   * Get weather cache size for a location
   */
  async getWeatherCacheSize(locationId) {
    try {
      const sizeBytes = await WeatherCacheRepository.getCacheSize(locationId);
      const sizeMB = sizeBytes / (1024 * 1024);
      const maxMB = CACHE_SIZE.MAX_WEATHER_MB;
      const usagePercent = (sizeMB / maxMB) * 100;

      return {
        sizeBytes,
        sizeMB: sizeMB.toFixed(2),
        maxMB,
        usagePercent: Math.round(usagePercent),
        isNearLimit: usagePercent >= 80,
        isOverLimit: sizeMB > maxMB,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get weather cache size failed:', error);
      throw error;
    }
  }

  /**
   * Get advisory cache size
   */
  async getAdvisoryCacheSize() {
    try {
      const sizeBytes = await AdvisoryCacheRepository.getCacheSize();
      const sizeMB = sizeBytes / (1024 * 1024);
      const maxMB = CACHE_SIZE.MAX_ADVISORY_MB;
      const usagePercent = (sizeMB / maxMB) * 100;

      return {
        sizeBytes,
        sizeMB: sizeMB.toFixed(2),
        maxMB,
        usagePercent: Math.round(usagePercent),
        isNearLimit: usagePercent >= 80,
        isOverLimit: sizeMB > maxMB,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get advisory cache size failed:', error);
      throw error;
    }
  }

  /**
   * Check if total cache size exceeds limit
   */
  async isOverLimit() {
    try {
      const cacheSize = await this.getTotalCacheSize();
      return cacheSize.isOverLimit;
    } catch (error) {
      console.error('[CacheSizeMonitor] Check over limit failed:', error);
      return false;
    }
  }

  /**
   * Check if cache is approaching limit (>=80% usage)
   */
  async isNearLimit() {
    try {
      const cacheSize = await this.getTotalCacheSize();
      return cacheSize.isNearLimit;
    } catch (error) {
      console.error('[CacheSizeMonitor] Check near limit failed:', error);
      return false;
    }
  }

  /**
   * Get available cache space
   */
  async getAvailableSpace() {
    try {
      const cacheSize = await this.getTotalCacheSize();
      const availableMB = CACHE_SIZE.MAX_TOTAL_MB - parseFloat(cacheSize.totalMB);

      return {
        availableBytes: availableMB * 1024 * 1024,
        availableMB: availableMB.toFixed(2),
        totalMB: CACHE_SIZE.MAX_TOTAL_MB,
        usedMB: cacheSize.totalMB,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get available space failed:', error);
      throw error;
    }
  }

  /**
   * Enforce cache size limits
   * Cleans up old data if exceeding limits
   */
  async enforceSizeLimits(locationId) {
    try {
      console.log('[CacheSizeMonitor] Enforcing cache size limits...');

      const cacheSize = await this.getTotalCacheSize();

      if (!cacheSize.isOverLimit) {
        console.log('[CacheSizeMonitor] Cache size within limits, no cleanup needed');
        return {
          cleanupPerformed: false,
          reason: 'Cache size within limits',
        };
      }

      console.log(
        `[CacheSizeMonitor] Cache size (${cacheSize.totalMB}MB) exceeds limit (${cacheSize.maxMB}MB), performing cleanup...`
      );

      let deletedWeather = 0;
      let deletedAdvisories = 0;

      // Step 1: Delete old weather data beyond 7-day retention
      if (cacheSize.weatherMB > CACHE_SIZE.MAX_WEATHER_MB) {
        deletedWeather = await WeatherCacheRepository.deleteOldWeather(locationId);
        console.log(`[CacheSizeMonitor] Deleted ${deletedWeather} old weather records`);
      }

      // Step 2: Delete expired advisories
      const expiredCount = await AdvisoryCacheRepository.deleteExpiredAdvisories();
      console.log(`[CacheSizeMonitor] Deleted ${expiredCount} expired advisories`);

      // Step 3: Delete low-priority advisories
      if (cacheSize.advisoryMB > CACHE_SIZE.MAX_ADVISORY_MB) {
        deletedAdvisories = await AdvisoryCacheRepository.deleteLowPriorityAdvisories(3);
        console.log(
          `[CacheSizeMonitor] Deleted ${deletedAdvisories} low-priority advisories`
        );
      }

      // Step 4: Enforce retention limits
      await AdvisoryCacheRepository.enforceRetentionLimits();

      const newSize = await this.getTotalCacheSize();

      console.log(
        `[CacheSizeMonitor] Cleanup complete. New cache size: ${newSize.totalMB}MB`
      );

      return {
        cleanupPerformed: true,
        deletedWeather,
        deletedAdvisories,
        oldSize: cacheSize.totalMB,
        newSize: newSize.totalMB,
        freedMB: (parseFloat(cacheSize.totalMB) - parseFloat(newSize.totalMB)).toFixed(2),
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Enforce size limits failed:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(locationId) {
    try {
      console.log('[CacheSizeMonitor] Clearing all caches...');

      const deletedWeather = await WeatherCacheRepository.clearCache(locationId);
      const deletedAdvisories = await AdvisoryCacheRepository.clearCache();

      console.log(
        `[CacheSizeMonitor] Cleared ${deletedWeather} weather records and ${deletedAdvisories} advisory records`
      );

      return {
        deletedWeather,
        deletedAdvisories,
        total: deletedWeather + deletedAdvisories,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Clear all caches failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for display in settings
   */
  async getCacheStatistics(locationId) {
    try {
      const totalSize = await this.getTotalCacheSize();
      const weatherSize = await this.getWeatherCacheSize(locationId);
      const advisorySize = await this.getAdvisoryCacheSize();

      const weatherCount = await WeatherCacheRepository.count('location_id = ?', [
        locationId,
      ]);
      const advisoryStats = await AdvisoryCacheRepository.getAdvisoryStats();

      return {
        total: totalSize,
        weather: {
          ...weatherSize,
          count: weatherCount,
        },
        advisory: {
          ...advisorySize,
          stats: advisoryStats,
        },
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get cache statistics failed:', error);
      throw error;
    }
  }

  /**
   * Get storage usage warning level
   * Returns: 'normal' | 'warning' | 'critical'
   */
  async getStorageWarningLevel() {
    try {
      const cacheSize = await this.getTotalCacheSize();

      if (cacheSize.isOverLimit) return 'critical';
      if (cacheSize.isNearLimit) return 'warning';
      return 'normal';
    } catch (error) {
      console.error('[CacheSizeMonitor] Get storage warning level failed:', error);
      return 'normal';
    }
  }

  /**
   * Get storage warning message for UI
   */
  async getStorageWarningMessage() {
    try {
      const cacheSize = await this.getTotalCacheSize();

      if (cacheSize.isOverLimit) {
        return {
          level: 'critical',
          message: `Cache storage is over limit (${cacheSize.totalMB}MB / ${cacheSize.maxMB}MB). Old data will be automatically deleted.`,
          action: 'Consider clearing cache manually in settings.',
        };
      }

      if (cacheSize.isNearLimit) {
        return {
          level: 'warning',
          message: `Cache storage is ${cacheSize.usagePercent}% full (${cacheSize.totalMB}MB / ${cacheSize.maxMB}MB).`,
          action: 'Cache will be cleaned up automatically when limit is reached.',
        };
      }

      return {
        level: 'normal',
        message: `Cache storage is ${cacheSize.usagePercent}% full (${cacheSize.totalMB}MB / ${cacheSize.maxMB}MB).`,
        action: null,
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Get storage warning message failed:', error);
      return {
        level: 'normal',
        message: 'Cache storage status unavailable',
        action: null,
      };
    }
  }

  /**
   * Estimate space needed for refresh operation
   */
  estimateRefreshSpace() {
    // Estimate based on typical data sizes
    const weatherEstimate = 0.3; // ~300KB for 7-day forecast
    const advisoryEstimate = 1.0; // ~1MB for all advisories

    return {
      weatherMB: weatherEstimate,
      advisoryMB: advisoryEstimate,
      totalMB: weatherEstimate + advisoryEstimate,
    };
  }

  /**
   * Check if there's enough space for refresh
   */
  async hasSpaceForRefresh() {
    try {
      const available = await this.getAvailableSpace();
      const needed = this.estimateRefreshSpace();

      return {
        hasSpace: parseFloat(available.availableMB) >= needed.totalMB,
        availableMB: available.availableMB,
        neededMB: needed.totalMB.toFixed(2),
      };
    } catch (error) {
      console.error('[CacheSizeMonitor] Check space for refresh failed:', error);
      return {
        hasSpace: true, // Default to true to avoid blocking refresh
        availableMB: 'unknown',
        neededMB: 'unknown',
      };
    }
  }
}

export default new CacheSizeMonitor();
