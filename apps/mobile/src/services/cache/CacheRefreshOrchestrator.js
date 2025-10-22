// CacheRefreshOrchestrator
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 4 (Cache refresh orchestration)

import WeatherCacheService from './WeatherCacheService';
import AdvisoryCacheService from './AdvisoryCacheService';
import NetworkMonitor from '../sync/NetworkMonitor';
import { REFRESH, REFRESH_PRIORITY } from '../../constants/CacheConstants';

/**
 * Orchestrates cache refresh operations
 * Coordinates weather and advisory cache refreshes based on network status
 * Implements refresh prioritization and scheduling
 */
class CacheRefreshOrchestrator {
  constructor() {
    this.isRefreshing = false;
    this.lastRefreshTime = {};
    this.scheduledRefreshTimer = null;
    this.networkListener = null;
    this.currentLocationId = null;
  }

  /**
   * Initialize the orchestrator
   * Sets up network monitoring and periodic refresh
   */
  async initialize(locationId) {
    try {
      console.log('[CacheRefreshOrchestrator] Initializing...');

      this.currentLocationId = locationId;

      // Set up network status monitoring
      this.setupNetworkMonitoring();

      // Schedule periodic refresh
      this.schedulePeriodicRefresh();

      console.log('[CacheRefreshOrchestrator] Initialized successfully');
    } catch (error) {
      console.error('[CacheRefreshOrchestrator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('[CacheRefreshOrchestrator] Cleaning up...');

    // Remove network listener
    if (this.networkListener) {
      NetworkMonitor.removeListener(this.networkListener);
      this.networkListener = null;
    }

    // Clear scheduled refresh timer
    if (this.scheduledRefreshTimer) {
      clearInterval(this.scheduledRefreshTimer);
      this.scheduledRefreshTimer = null;
    }

    console.log('[CacheRefreshOrchestrator] Cleanup complete');
  }

  /**
   * Set up network monitoring to trigger refresh on connectivity restored
   */
  setupNetworkMonitoring() {
    // Listen for network connectivity changes
    this.networkListener = NetworkMonitor.addListener(async (isOnline) => {
      if (isOnline) {
        console.log('[CacheRefreshOrchestrator] Network connectivity restored, triggering refresh');
        await this.refreshAll().catch(error => {
          console.error('[CacheRefreshOrchestrator] Auto-refresh on connectivity failed:', error);
        });
      }
    });

    console.log('[CacheRefreshOrchestrator] Network monitoring set up');
  }

  /**
   * Schedule periodic refresh (every 6 hours when online)
   */
  schedulePeriodicRefresh() {
    const intervalMs = REFRESH.AUTO_INTERVAL_HOURS * 60 * 60 * 1000;

    this.scheduledRefreshTimer = setInterval(async () => {
      const isOnline = await NetworkMonitor.isOnline();

      if (isOnline) {
        console.log('[CacheRefreshOrchestrator] Periodic refresh triggered');
        await this.refreshAll().catch(error => {
          console.error('[CacheRefreshOrchestrator] Periodic refresh failed:', error);
        });
      } else {
        console.log('[CacheRefreshOrchestrator] Periodic refresh skipped (offline)');
      }
    }, intervalMs);

    console.log(
      `[CacheRefreshOrchestrator] Periodic refresh scheduled every ${REFRESH.AUTO_INTERVAL_HOURS} hours`
    );
  }

  /**
   * Refresh all caches with prioritization
   * Weather > Climate > Market > Irrigation
   */
  async refreshAll(forceRefresh = false) {
    if (this.isRefreshing) {
      console.log('[CacheRefreshOrchestrator] Refresh already in progress, skipping');
      return {
        skipped: true,
        reason: 'Refresh already in progress',
      };
    }

    const isOnline = await NetworkMonitor.isOnline();
    if (!isOnline) {
      console.log('[CacheRefreshOrchestrator] Cannot refresh - offline');
      return {
        skipped: true,
        reason: 'Device is offline',
      };
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      console.log('[CacheRefreshOrchestrator] Starting prioritized refresh...');

      const results = {
        weather: null,
        advisories: {},
        duration: 0,
        timestamp: new Date().toISOString(),
      };

      // Priority 1: Weather forecast (highest priority)
      try {
        console.log('[CacheRefreshOrchestrator] [Priority 1] Refreshing weather...');
        results.weather = await WeatherCacheService.refreshWeatherCache(
          this.currentLocationId
        );
        this.lastRefreshTime.weather = Date.now();
      } catch (error) {
        console.error('[CacheRefreshOrchestrator] Weather refresh failed:', error);
        results.weather = { error: error.message };
      }

      // Priority 2-4: Advisories (climate > market > irrigation)
      const advisoryPriority = AdvisoryCacheService.getRefreshPriority();

      for (const advisoryType of advisoryPriority) {
        try {
          console.log(
            `[CacheRefreshOrchestrator] [Priority ${
              REFRESH_PRIORITY[advisoryType.toUpperCase()]
            }] Refreshing ${advisoryType} advisories...`
          );

          results.advisories[advisoryType] =
            await AdvisoryCacheService.refreshAdvisoryCache(advisoryType);

          this.lastRefreshTime[advisoryType] = Date.now();
        } catch (error) {
          console.error(
            `[CacheRefreshOrchestrator] ${advisoryType} advisory refresh failed:`,
            error
          );
          results.advisories[advisoryType] = { error: error.message };
        }
      }

      results.duration = Date.now() - startTime;

      console.log(
        `[CacheRefreshOrchestrator] Refresh completed in ${results.duration}ms`,
        results
      );

      return results;
    } catch (error) {
      console.error('[CacheRefreshOrchestrator] Refresh all failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually trigger cache refresh
   * Typically called from pull-to-refresh UI gesture
   */
  async manualRefresh(locationId = null) {
    const targetLocationId = locationId || this.currentLocationId;

    console.log(`[CacheRefreshOrchestrator] Manual refresh triggered for ${targetLocationId}`);

    // Update location if changed
    if (targetLocationId !== this.currentLocationId) {
      this.currentLocationId = targetLocationId;
    }

    return await this.refreshAll(true);
  }

  /**
   * Refresh only weather cache
   */
  async refreshWeatherOnly(locationId = null) {
    const targetLocationId = locationId || this.currentLocationId;

    const isOnline = await NetworkMonitor.isOnline();
    if (!isOnline) {
      throw new Error('Cannot refresh weather - device is offline');
    }

    console.log(
      `[CacheRefreshOrchestrator] Refreshing weather only for ${targetLocationId}`
    );

    return await WeatherCacheService.refreshWeatherCache(targetLocationId);
  }

  /**
   * Refresh only advisories cache
   */
  async refreshAdvisoriesOnly() {
    const isOnline = await NetworkMonitor.isOnline();
    if (!isOnline) {
      throw new Error('Cannot refresh advisories - device is offline');
    }

    console.log('[CacheRefreshOrchestrator] Refreshing advisories only');

    return await AdvisoryCacheService.refreshAllAdvisories();
  }

  /**
   * Get time since last refresh for a cache type
   */
  getTimeSinceLastRefresh(cacheType) {
    const lastRefresh = this.lastRefreshTime[cacheType];
    if (!lastRefresh) return null;

    const now = Date.now();
    const diffMs = now - lastRefresh;
    const diffHours = diffMs / (1000 * 60 * 60);

    return {
      milliseconds: diffMs,
      hours: diffHours,
      lastRefreshTime: new Date(lastRefresh).toISOString(),
    };
  }

  /**
   * Check if refresh is currently in progress
   */
  isRefreshInProgress() {
    return this.isRefreshing;
  }

  /**
   * Get refresh statistics
   */
  getRefreshStats() {
    return {
      isRefreshing: this.isRefreshing,
      currentLocationId: this.currentLocationId,
      lastRefreshTimes: Object.keys(this.lastRefreshTime).reduce((acc, key) => {
        acc[key] = new Date(this.lastRefreshTime[key]).toISOString();
        return acc;
      }, {}),
      timeSinceLastRefresh: Object.keys(this.lastRefreshTime).reduce((acc, key) => {
        acc[key] = this.getTimeSinceLastRefresh(key);
        return acc;
      }, {}),
    };
  }

  /**
   * Update current location
   */
  setLocation(locationId) {
    console.log(`[CacheRefreshOrchestrator] Location updated to ${locationId}`);
    this.currentLocationId = locationId;
  }
}

export default new CacheRefreshOrchestrator();
