// AdvisoryCacheService
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 3 (Advisory caching service)

import AdvisoryCacheRepository from '../../database/repositories/AdvisoryCacheRepository';
import {
  CACHE_SIZE,
  RETENTION,
  REFRESH,
  ADVISORY_TYPES,
  REFRESH_PRIORITY,
  needsRefresh,
  calculateHoursSinceUpdate,
} from '../../constants/CacheConstants';

/**
 * Service for managing advisory cache data
 * Handles fetching, storing, and refreshing farming advisories
 */
class AdvisoryCacheService {
  constructor() {
    this.repository = AdvisoryCacheRepository;
    this.isRefreshing = {};
    this.refreshPromises = {};
  }

  /**
   * Get advisories by type
   */
  async getAdvisoriesByType(advisoryType, includeExpired = false) {
    try {
      console.log(`[AdvisoryCacheService] Getting ${advisoryType} advisories`);

      // Check if refresh is needed
      const lastUpdated = await this.repository.getLastUpdated(advisoryType);
      const shouldRefresh = !lastUpdated || needsRefresh(lastUpdated);

      // Trigger background refresh if needed
      if (shouldRefresh && !this.isRefreshing[advisoryType]) {
        this.refreshAdvisoryCache(advisoryType).catch(error => {
          console.error(
            `[AdvisoryCacheService] Background refresh failed for ${advisoryType}:`,
            error
          );
        });
      }

      // Get advisories from cache
      const advisories = includeExpired
        ? await this.repository.getAdvisoriesByType(advisoryType)
        : await this.repository.getValidAdvisories(advisoryType);

      return {
        data: advisories,
        fromCache: true,
        lastUpdated,
        hoursOld: lastUpdated ? calculateHoursSinceUpdate(lastUpdated) : null,
      };
    } catch (error) {
      console.error('[AdvisoryCacheService] Get advisories by type failed:', error);
      throw error;
    }
  }

  /**
   * Get all valid advisories (non-expired)
   */
  async getValidAdvisories() {
    try {
      console.log('[AdvisoryCacheService] Getting all valid advisories');

      const advisories = await this.repository.getValidAdvisories();

      return {
        data: advisories,
        fromCache: true,
        count: advisories.length,
      };
    } catch (error) {
      console.error('[AdvisoryCacheService] Get valid advisories failed:', error);
      throw error;
    }
  }

  /**
   * Get critical advisories
   */
  async getCriticalAdvisories() {
    try {
      console.log('[AdvisoryCacheService] Getting critical advisories');

      const advisories = await this.repository.getCriticalAdvisories();

      return {
        data: advisories,
        fromCache: true,
        count: advisories.length,
      };
    } catch (error) {
      console.error('[AdvisoryCacheService] Get critical advisories failed:', error);
      throw error;
    }
  }

  /**
   * Get advisories for specific crops
   */
  async getAdvisoriesForCrops(crops) {
    try {
      console.log(`[AdvisoryCacheService] Getting advisories for crops: ${crops.join(', ')}`);

      const advisories = await this.repository.getAdvisoriesForCrops(crops);

      return {
        data: advisories,
        fromCache: true,
        count: advisories.length,
      };
    } catch (error) {
      console.error('[AdvisoryCacheService] Get advisories for crops failed:', error);
      throw error;
    }
  }

  /**
   * Refresh advisory cache for a specific type
   */
  async refreshAdvisoryCache(advisoryType) {
    // Prevent concurrent refreshes for the same type
    if (this.isRefreshing[advisoryType]) {
      console.log(
        `[AdvisoryCacheService] Refresh already in progress for ${advisoryType}, returning existing promise`
      );
      return this.refreshPromises[advisoryType];
    }

    this.isRefreshing[advisoryType] = true;
    this.refreshPromises[advisoryType] = this._doRefresh(advisoryType);

    try {
      const result = await this.refreshPromises[advisoryType];
      return result;
    } finally {
      this.isRefreshing[advisoryType] = false;
      delete this.refreshPromises[advisoryType];
    }
  }

  /**
   * Internal refresh implementation
   */
  async _doRefresh(advisoryType) {
    let retryCount = 0;
    let lastError = null;

    while (retryCount < REFRESH.RETRY_ATTEMPTS) {
      try {
        console.log(
          `[AdvisoryCacheService] Refreshing advisory cache for ${advisoryType} (attempt ${
            retryCount + 1
          })`
        );

        // TODO: Replace with actual API call to backend
        // For now, this is a placeholder that would be replaced with:
        // const advisories = await AdvisoryAPI.fetchAdvisories(advisoryType);

        const advisories = await this._fetchAdvisoriesFromAPI(advisoryType);

        // Store advisories in cache
        for (const advisory of advisories) {
          await this.repository.saveAdvisory(advisory);
        }

        // Clean up expired advisories
        await this.repository.deleteExpiredAdvisories();

        // Enforce retention limits
        await this.repository.enforceRetentionLimits();

        // Enforce cache size limits
        await this.enforceCacheSizeLimit();

        console.log(
          `[AdvisoryCacheService] Successfully refreshed ${advisories.length} advisories for ${advisoryType}`
        );

        return {
          success: true,
          count: advisories.length,
          type: advisoryType,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount < REFRESH.RETRY_ATTEMPTS) {
          const delayMs = Math.min(
            REFRESH.RETRY_DELAY_MS * Math.pow(REFRESH.BACKOFF_MULTIPLIER, retryCount - 1),
            REFRESH.MAX_RETRY_DELAY_MS
          );

          console.log(
            `[AdvisoryCacheService] Refresh failed for ${advisoryType}, retrying in ${delayMs}ms...`,
            error.message
          );

          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(
      `[AdvisoryCacheService] Refresh failed for ${advisoryType} after all retries:`,
      lastError
    );
    throw lastError;
  }

  /**
   * Refresh all advisory types
   */
  async refreshAllAdvisories() {
    try {
      console.log('[AdvisoryCacheService] Refreshing all advisory types');

      const types = [
        ADVISORY_TYPES.IRRIGATION,
        ADVISORY_TYPES.MARKET,
        ADVISORY_TYPES.CLIMATE,
      ];

      const results = await Promise.allSettled(
        types.map(type => this.refreshAdvisoryCache(type))
      );

      const summary = {
        total: types.length,
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results: results.map((r, i) => ({
          type: types[i],
          status: r.status,
          data: r.status === 'fulfilled' ? r.value : null,
          error: r.status === 'rejected' ? r.reason.message : null,
        })),
      };

      console.log('[AdvisoryCacheService] Refresh all complete:', summary);

      return summary;
    } catch (error) {
      console.error('[AdvisoryCacheService] Refresh all advisories failed:', error);
      throw error;
    }
  }

  /**
   * Placeholder for API call - would be replaced with actual GraphQL call
   */
  async _fetchAdvisoriesFromAPI(advisoryType) {
    // TODO: Replace with actual API implementation
    // This is a mock implementation for development
    console.log(
      '[AdvisoryCacheService] Mock API call - would fetch from backend GraphQL'
    );

    // Return empty array for now - actual implementation would come from AdvisoryAPI
    return [];

    // Example of what the actual implementation would look like:
    // import AdvisoryAPI from '../../api/AdvisoryAPI';
    // return await AdvisoryAPI.fetchAdvisories(advisoryType);
  }

  /**
   * Enforce cache size limits
   */
  async enforceCacheSizeLimit() {
    try {
      const cacheSize = await this.repository.getCacheSize();
      const maxSizeBytes = CACHE_SIZE.MAX_ADVISORY_MB * 1024 * 1024;

      if (cacheSize > maxSizeBytes) {
        console.log(
          `[AdvisoryCacheService] Cache size (${cacheSize} bytes) exceeds limit (${maxSizeBytes} bytes), cleaning up...`
        );

        // Delete low-priority advisories first
        await this.repository.deleteLowPriorityAdvisories(3);

        // If still over limit, enforce retention limits more aggressively
        const newSize = await this.repository.getCacheSize();
        if (newSize > maxSizeBytes) {
          await this.repository.enforceRetentionLimits();
        }
      }
    } catch (error) {
      console.error('[AdvisoryCacheService] Enforce cache size limit failed:', error);
      // Don't throw - this is a background cleanup operation
    }
  }

  /**
   * Clear advisory cache
   */
  async clearCache(advisoryType = null) {
    try {
      console.log(
        `[AdvisoryCacheService] Clearing advisory cache${
          advisoryType ? ` for ${advisoryType}` : ''
        }`
      );
      return await this.repository.clearCache(advisoryType);
    } catch (error) {
      console.error('[AdvisoryCacheService] Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = await this.repository.getAdvisoryStats();
      const size = await this.repository.getCacheSize();

      return {
        types: stats,
        totalSize: size,
        sizeMB: (size / (1024 * 1024)).toFixed(2),
        maxSizeMB: CACHE_SIZE.MAX_ADVISORY_MB,
      };
    } catch (error) {
      console.error('[AdvisoryCacheService] Get cache stats failed:', error);
      throw error;
    }
  }

  /**
   * Check if advisory type needs refresh
   */
  async needsRefresh(advisoryType) {
    try {
      const lastUpdated = await this.repository.getLastUpdated(advisoryType);
      if (!lastUpdated) return true;

      return needsRefresh(lastUpdated);
    } catch (error) {
      console.error('[AdvisoryCacheService] Check needs refresh failed:', error);
      return true; // Default to refresh on error
    }
  }

  /**
   * Get refresh priority for advisory types
   * Returns types sorted by priority
   */
  getRefreshPriority() {
    const types = [
      { type: ADVISORY_TYPES.CLIMATE, priority: REFRESH_PRIORITY.CLIMATE },
      { type: ADVISORY_TYPES.MARKET, priority: REFRESH_PRIORITY.MARKET },
      { type: ADVISORY_TYPES.IRRIGATION, priority: REFRESH_PRIORITY.IRRIGATION },
    ];

    return types.sort((a, b) => a.priority - b.priority).map(t => t.type);
  }
}

export default new AdvisoryCacheService();
