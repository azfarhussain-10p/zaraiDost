// WeatherCacheService Tests
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 8 (Unit tests for weather cache)

import WeatherCacheService from '../../../services/cache/WeatherCacheService';
import WeatherCacheRepository from '../../../database/repositories/WeatherCacheRepository';
import { CACHE_SIZE, RETENTION } from '../../../constants/CacheConstants';

// Mock dependencies
jest.mock('../../../database/repositories/WeatherCacheRepository');

describe('WeatherCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get7DayForecast', () => {
    it('should return cached forecast when available', async () => {
      const mockForecast = [
        {
          id: '1',
          location_id: 'lahore_punjab',
          forecast_date: '2025-10-23',
          temperature_high_c: 32,
          temperature_low_c: 18,
          weather_condition: 'Sunny',
          last_updated: new Date().toISOString(),
        },
      ];

      WeatherCacheRepository.get7DayForecast.mockResolvedValue(mockForecast);
      WeatherCacheRepository.getLastUpdated.mockResolvedValue(new Date().toISOString());

      const result = await WeatherCacheService.get7DayForecast('lahore_punjab');

      expect(result.data).toEqual(mockForecast);
      expect(result.fromCache).toBe(true);
      expect(result.lastUpdated).toBeDefined();
    });

    it('should return empty array when no cached data', async () => {
      WeatherCacheRepository.get7DayForecast.mockResolvedValue([]);
      WeatherCacheRepository.getLastUpdated.mockResolvedValue(null);

      const result = await WeatherCacheService.get7DayForecast('lahore_punjab');

      expect(result.data).toEqual([]);
      expect(result.fromCache).toBe(false);
      expect(result.lastUpdated).toBeNull();
    });
  });

  describe('getTodayWeather', () => {
    it('should return today\'s weather from cache', async () => {
      const mockWeather = {
        id: '1',
        location_id: 'lahore_punjab',
        forecast_date: new Date().toISOString().split('T')[0],
        temperature_high_c: 32,
        temperature_low_c: 18,
        last_updated: new Date().toISOString(),
      };

      WeatherCacheRepository.getTodayWeather.mockResolvedValue(mockWeather);

      const result = await WeatherCacheService.getTodayWeather('lahore_punjab');

      expect(result.data).toEqual(mockWeather);
      expect(result.fromCache).toBe(true);
    });

    it('should return null when no today\'s weather cached', async () => {
      WeatherCacheRepository.getTodayWeather.mockResolvedValue(null);

      const result = await WeatherCacheService.getTodayWeather('lahore_punjab');

      expect(result.data).toBeNull();
      expect(result.fromCache).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear weather cache for location', async () => {
      WeatherCacheRepository.clearCache.mockResolvedValue(5);

      const deletedCount = await WeatherCacheService.clearCache('lahore_punjab');

      expect(deletedCount).toBe(5);
      expect(WeatherCacheRepository.clearCache).toHaveBeenCalledWith('lahore_punjab');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      WeatherCacheRepository.count.mockResolvedValue(7);
      WeatherCacheRepository.getCacheSize.mockResolvedValue(1048576); // 1MB
      WeatherCacheRepository.getLastUpdated.mockResolvedValue(new Date().toISOString());
      WeatherCacheRepository.getOldestForecastDate.mockResolvedValue('2025-10-16');

      const stats = await WeatherCacheService.getCacheStats('lahore_punjab');

      expect(stats.count).toBe(7);
      expect(stats.sizeBytes).toBe(1048576);
      expect(stats.sizeMB).toBe('1.00');
      expect(stats.lastUpdated).toBeDefined();
      expect(stats.oldestDate).toBe('2025-10-16');
    });
  });

  describe('enforceCacheSizeLimit', () => {
    it('should cleanup old weather when over limit', async () => {
      const oversizeBytes = CACHE_SIZE.MAX_WEATHER_MB * 1024 * 1024 + 1000;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(oversizeBytes);
      WeatherCacheRepository.deleteOldWeather.mockResolvedValue(2);

      await WeatherCacheService.enforceCacheSizeLimit('lahore_punjab');

      expect(WeatherCacheRepository.deleteOldWeather).toHaveBeenCalledWith('lahore_punjab');
    });

    it('should not cleanup when within limit', async () => {
      const normalSize = CACHE_SIZE.MAX_WEATHER_MB * 1024 * 1024 - 1000;
      WeatherCacheRepository.getCacheSize.mockResolvedValue(normalSize);

      await WeatherCacheService.enforceCacheSizeLimit('lahore_punjab');

      expect(WeatherCacheRepository.deleteOldWeather).not.toHaveBeenCalled();
    });
  });
});
