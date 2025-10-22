// WeatherCacheService
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 2 (Weather data caching service)

import WeatherCacheRepository from '../../database/repositories/WeatherCacheRepository';
import {
  CACHE_SIZE,
  RETENTION,
  REFRESH,
  needsRefresh,
  calculateHoursSinceUpdate,
} from '../../constants/CacheConstants';

/**
 * Service for managing weather data cache
 * Handles fetching, storing, and refreshing weather forecasts
 */
class WeatherCacheService {
  constructor() {
    this.repository = WeatherCacheRepository;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Get 7-day weather forecast from cache
   * Falls back to API if cache is empty or stale
   */
  async get7DayForecast(locationId, forceRefresh = false) {
    try {
      console.log(`[WeatherCacheService] Getting 7-day forecast for ${locationId}`);

      // Check if refresh is needed
      const lastUpdated = await this.repository.getLastUpdated(locationId);
      const shouldRefresh = forceRefresh || !lastUpdated || needsRefresh(lastUpdated);

      // If we need to refresh and we're online, trigger refresh in background
      if (shouldRefresh && !this.isRefreshing) {
        // Fire and forget - don't wait for refresh
        this.refreshWeatherCache(locationId).catch(error => {
          console.error('[WeatherCacheService] Background refresh failed:', error);
        });
      }

      // Return cached data immediately
      const cachedForecast = await this.repository.get7DayForecast(locationId);

      if (cachedForecast && cachedForecast.length > 0) {
        return {
          data: cachedForecast,
          fromCache: true,
          lastUpdated,
          hoursOld: lastUpdated ? calculateHoursSinceUpdate(lastUpdated) : null,
        };
      }

      // If no cached data and refresh is in progress, wait for it
      if (this.isRefreshing && this.refreshPromise) {
        await this.refreshPromise;
        const freshForecast = await this.repository.get7DayForecast(locationId);
        return {
          data: freshForecast,
          fromCache: false,
          lastUpdated: new Date().toISOString(),
          hoursOld: 0,
        };
      }

      // No cached data and no refresh in progress
      return {
        data: [],
        fromCache: false,
        lastUpdated: null,
        hoursOld: null,
      };
    } catch (error) {
      console.error('[WeatherCacheService] Get 7-day forecast failed:', error);
      throw error;
    }
  }

  /**
   * Get today's weather from cache
   */
  async getTodayWeather(locationId) {
    try {
      console.log(`[WeatherCacheService] Getting today's weather for ${locationId}`);

      const todayWeather = await this.repository.getTodayWeather(locationId);
      const lastUpdated = todayWeather?.last_updated || null;

      return {
        data: todayWeather,
        fromCache: !!todayWeather,
        lastUpdated,
        hoursOld: lastUpdated ? calculateHoursSinceUpdate(lastUpdated) : null,
      };
    } catch (error) {
      console.error('[WeatherCacheService] Get today weather failed:', error);
      throw error;
    }
  }

  /**
   * Refresh weather cache from API
   * This would typically call the backend GraphQL API
   */
  async refreshWeatherCache(locationId) {
    // Prevent concurrent refreshes
    if (this.isRefreshing) {
      console.log('[WeatherCacheService] Refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh(locationId);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Internal refresh implementation
   */
  async _doRefresh(locationId) {
    let retryCount = 0;
    let lastError = null;

    while (retryCount < REFRESH.RETRY_ATTEMPTS) {
      try {
        console.log(
          `[WeatherCacheService] Refreshing weather cache for ${locationId} (attempt ${
            retryCount + 1
          })`
        );

        // TODO: Replace with actual API call to backend
        // For now, this is a placeholder that would be replaced with:
        // const weatherData = await WeatherAPI.fetchWeatherForecast(locationId, 7);

        const weatherData = await this._fetchWeatherFromAPI(locationId);

        // Store weather data in cache
        for (const forecast of weatherData) {
          await this.repository.saveWeatherData(forecast);
        }

        // Clean up old weather data
        await this.repository.deleteOldWeather(locationId);

        // Enforce cache size limits
        await this.enforceCacheSizeLimit(locationId);

        console.log(
          `[WeatherCacheService] Successfully refreshed ${weatherData.length} weather forecasts`
        );

        return {
          success: true,
          count: weatherData.length,
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
            `[WeatherCacheService] Refresh failed, retrying in ${delayMs}ms...`,
            error.message
          );

          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error('[WeatherCacheService] Refresh failed after all retries:', lastError);
    throw lastError;
  }

  /**
   * Placeholder for API call - would be replaced with actual GraphQL call
   */
  async _fetchWeatherFromAPI(locationId) {
    // TODO: Replace with actual API implementation
    // This is a mock implementation for development
    console.log('[WeatherCacheService] Mock API call - would fetch from backend GraphQL');

    // Return empty array for now - actual implementation would come from WeatherAPI
    return [];

    // Example of what the actual implementation would look like:
    // import WeatherAPI from '../../api/WeatherAPI';
    // return await WeatherAPI.fetchWeatherForecast(locationId, 7);
  }

  /**
   * Enforce cache size limits
   */
  async enforceCacheSizeLimit(locationId) {
    try {
      const cacheSize = await this.repository.getCacheSize(locationId);
      const maxSizeBytes = CACHE_SIZE.MAX_WEATHER_MB * 1024 * 1024;

      if (cacheSize > maxSizeBytes) {
        console.log(
          `[WeatherCacheService] Cache size (${cacheSize} bytes) exceeds limit (${maxSizeBytes} bytes), cleaning up...`
        );

        // Delete oldest weather data beyond 7-day retention
        await this.repository.deleteOldWeather(locationId);
      }
    } catch (error) {
      console.error('[WeatherCacheService] Enforce cache size limit failed:', error);
      // Don't throw - this is a background cleanup operation
    }
  }

  /**
   * Clear weather cache for a location
   */
  async clearCache(locationId) {
    try {
      console.log(`[WeatherCacheService] Clearing weather cache for ${locationId}`);
      return await this.repository.clearCache(locationId);
    } catch (error) {
      console.error('[WeatherCacheService] Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(locationId) {
    try {
      const count = await this.repository.count('location_id = ?', [locationId]);
      const size = await this.repository.getCacheSize(locationId);
      const lastUpdated = await this.repository.getLastUpdated(locationId);
      const oldestDate = await this.repository.getOldestForecastDate(locationId);

      return {
        count,
        sizeBytes: size,
        sizeMB: (size / (1024 * 1024)).toFixed(2),
        lastUpdated,
        oldestDate,
        hoursOld: lastUpdated ? calculateHoursSinceUpdate(lastUpdated) : null,
      };
    } catch (error) {
      console.error('[WeatherCacheService] Get cache stats failed:', error);
      throw error;
    }
  }

  /**
   * Check if cache needs refresh
   */
  async needsRefresh(locationId) {
    try {
      const lastUpdated = await this.repository.getLastUpdated(locationId);
      if (!lastUpdated) return true;

      return needsRefresh(lastUpdated);
    } catch (error) {
      console.error('[WeatherCacheService] Check needs refresh failed:', error);
      return true; // Default to refresh on error
    }
  }
}

export default new WeatherCacheService();
