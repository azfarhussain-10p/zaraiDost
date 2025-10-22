// CacheSizeMonitor Tests
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 8 (Unit tests for cache size management)

import CacheSizeMonitor from '../../../services/cache/CacheSizeMonitor';
import WeatherCacheRepository from '../../../database/repositories/WeatherCacheRepository';
import AdvisoryCacheRepository from '../../../database/repositories/AdvisoryCacheRepository';
import { CACHE_SIZE } from '../../../constants/CacheConstants';

// Mock dependencies
jest.mock('../../../database/repositories/WeatherCacheRepository');
jest.mock('../../../database/repositories/AdvisoryCacheRepository');

describe('CacheSizeMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTotalCacheSize', () => {
    it('should calculate total cache size across all types', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.getTotalCacheSize();

      expect(result.totalBytes).toBe(3145728); // 3MB
      expect(result.totalMB).toBe('3.00');
      expect(result.weatherMB).toBe('1.00');
      expect(result.advisoryMB).toBe('2.00');
      expect(result.isOverLimit).toBe(false);
    });

    it('should flag when cache is near limit (>=80%)', async () => {
      const nearLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 0.85 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);

      const result = await CacheSizeMonitor.getTotalCacheSize();

      expect(result.isNearLimit).toBe(true);
      expect(result.isOverLimit).toBe(false);
    });

    it('should flag when cache is over limit', async () => {
      const overLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 1.1 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);

      const result = await CacheSizeMonitor.getTotalCacheSize();

      expect(result.isOverLimit).toBe(true);
    });
  });

  describe('getWeatherCacheSize', () => {
    it('should return weather cache size for location', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB

      const result = await CacheSizeMonitor.getWeatherCacheSize('lahore_punjab');

      expect(result.sizeBytes).toBe(1048576);
      expect(result.sizeMB).toBe('1.00');
      expect(result.maxMB).toBe(CACHE_SIZE.MAX_WEATHER_MB);
    });
  });

  describe('getAdvisoryCacheSize', () => {
    it('should return advisory cache size', async () => {
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.getAdvisoryCacheSize();

      expect(result.sizeBytes).toBe(2097152);
      expect(result.sizeMB).toBe('2.00');
      expect(result.maxMB).toBe(CACHE_SIZE.MAX_ADVISORY_MB);
    });
  });

  describe('isOverLimit', () => {
    it('should return true when cache exceeds limit', async () => {
      const overLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 1.1 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);

      const result = await CacheSizeMonitor.isOverLimit();

      expect(result).toBe(true);
    });

    it('should return false when cache is within limit', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.isOverLimit();

      expect(result).toBe(false);
    });
  });

  describe('isNearLimit', () => {
    it('should return true when cache is at 80% or more', async () => {
      const nearLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 0.85 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);

      const result = await CacheSizeMonitor.isNearLimit();

      expect(result).toBe(true);
    });

    it('should return false when cache is below 80%', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.isNearLimit();

      expect(result).toBe(false);
    });
  });

  describe('getAvailableSpace', () => {
    it('should calculate available cache space', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.getAvailableSpace();

      expect(result.totalMB).toBe(CACHE_SIZE.MAX_TOTAL_MB);
      expect(result.usedMB).toBe('3.00');
      expect(parseFloat(result.availableMB)).toBeGreaterThan(0);
    });
  });

  describe('enforceSizeLimits', () => {
    it('should not cleanup when within limits', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.enforceSizeLimits('lahore_punjab');

      expect(result.cleanupPerformed).toBe(false);
      expect(result.reason).toBe('Cache size within limits');
    });

    it('should cleanup when over limit', async () => {
      const overLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 1.1 * 1024 * 1024;

      // First call returns over limit, second call after cleanup returns normal
      WeatherCacheRepository.getCacheSize
        .mockResolvedValueOnce(overLimitSize / 2)
        .mockResolvedValueOnce(1048576); // 1MB after cleanup

      AdvisoryCacheRepository.getCacheSize
        .mockResolvedValueOnce(overLimitSize / 2)
        .mockResolvedValueOnce(2097152); // 2MB after cleanup

      WeatherCacheRepository.deleteOldWeather.mockResolvedValue(5);
      AdvisoryCacheRepository.deleteExpiredAdvisories.mockResolvedValue(2);
      AdvisoryCacheRepository.deleteLowPriorityAdvisories.mockResolvedValue(3);
      AdvisoryCacheRepository.enforceRetentionLimits.mockResolvedValue(1);

      const result = await CacheSizeMonitor.enforceSizeLimits('lahore_punjab');

      expect(result.cleanupPerformed).toBe(true);
      expect(result.deletedWeather).toBeDefined();
      expect(WeatherCacheRepository.deleteOldWeather).toHaveBeenCalled();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all cache data', async () => {
      WeatherCacheRepository.clearCache.mockResolvedValue(10);
      AdvisoryCacheRepository.clearCache.mockResolvedValue(15);

      const result = await CacheSizeMonitor.clearAllCaches('lahore_punjab');

      expect(result.deletedWeather).toBe(10);
      expect(result.deletedAdvisories).toBe(15);
      expect(result.total).toBe(25);
    });
  });

  describe('getStorageWarningLevel', () => {
    it('should return "normal" when within limits', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.getStorageWarningLevel();

      expect(result).toBe('normal');
    });

    it('should return "warning" when near limit', async () => {
      const nearLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 0.85 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(nearLimitSize / 2);

      const result = await CacheSizeMonitor.getStorageWarningLevel();

      expect(result).toBe('warning');
    });

    it('should return "critical" when over limit', async () => {
      const overLimitSize = CACHE_SIZE.MAX_TOTAL_MB * 1.1 * 1024 * 1024;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(overLimitSize / 2);

      const result = await CacheSizeMonitor.getStorageWarningLevel();

      expect(result).toBe('critical');
    });
  });

  describe('hasSpaceForRefresh', () => {
    it('should return true when sufficient space available', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const result = await CacheSizeMonitor.hasSpaceForRefresh();

      expect(result.hasSpace).toBe(true);
      expect(result.availableMB).toBeDefined();
      expect(result.neededMB).toBeDefined();
    });
  });

  describe('getCacheStatistics', () => {
    it('should return comprehensive cache statistics', async () => {
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      WeatherCacheRepository.count.mockResolvedValue(7);

      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB
      AdvisoryCacheRepository.getAdvisoryStats.mockResolvedValue([
        { advisory_type: 'irrigation', count: 5, critical_count: 1 },
      ]);

      const result = await CacheSizeMonitor.getCacheStatistics('lahore_punjab');

      expect(result.total).toBeDefined();
      expect(result.weather).toBeDefined();
      expect(result.weather.count).toBe(7);
      expect(result.advisory).toBeDefined();
    });
  });
});
