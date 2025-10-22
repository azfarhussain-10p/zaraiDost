// AdvisoryCacheService Tests
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 8 (Unit tests for advisory cache)

import AdvisoryCacheService from '../../../services/cache/AdvisoryCacheService';
import AdvisoryCacheRepository from '../../../database/repositories/AdvisoryCacheRepository';
import { ADVISORY_TYPES, RETENTION } from '../../../constants/CacheConstants';

// Mock dependencies
jest.mock('../../../database/repositories/AdvisoryCacheRepository');

describe('AdvisoryCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdvisoriesByType', () => {
    it('should return advisories for irrigation type', async () => {
      const mockAdvisories = [
        {
          id: '1',
          advisory_type: 'irrigation',
          title: 'Optimal Irrigation Schedule',
          content: 'Water your crops in the morning...',
          priority: 'normal',
          last_updated: new Date().toISOString(),
        },
      ];

      AdvisoryCacheRepository.getValidAdvisories.mockResolvedValue(mockAdvisories);
      AdvisoryCacheRepository.getLastUpdated.mockResolvedValue(new Date().toISOString());

      const result = await AdvisoryCacheService.getAdvisoriesByType(
        ADVISORY_TYPES.IRRIGATION
      );

      expect(result.data).toEqual(mockAdvisories);
      expect(result.fromCache).toBe(true);
    });

    it('should return empty array when no advisories', async () => {
      AdvisoryCacheRepository.getValidAdvisories.mockResolvedValue([]);
      AdvisoryCacheRepository.getLastUpdated.mockResolvedValue(null);

      const result = await AdvisoryCacheService.getAdvisoriesByType(
        ADVISORY_TYPES.MARKET
      );

      expect(result.data).toEqual([]);
      expect(result.fromCache).toBe(true);
    });
  });

  describe('getCriticalAdvisories', () => {
    it('should return only critical advisories', async () => {
      const mockCriticalAdvisories = [
        {
          id: '1',
          advisory_type: 'climate',
          title: 'Heavy Rain Warning',
          is_critical: 1,
          priority: 'critical',
        },
      ];

      AdvisoryCacheRepository.getCriticalAdvisories.mockResolvedValue(
        mockCriticalAdvisories
      );

      const result = await AdvisoryCacheService.getCriticalAdvisories();

      expect(result.data).toEqual(mockCriticalAdvisories);
      expect(result.count).toBe(1);
    });
  });

  describe('getAdvisoriesForCrops', () => {
    it('should return advisories for specific crops', async () => {
      const mockAdvisories = [
        {
          id: '1',
          advisory_type: 'irrigation',
          title: 'Wheat Irrigation',
          applicable_crops: '["wheat", "rice"]',
        },
      ];

      AdvisoryCacheRepository.getAdvisoriesForCrops.mockResolvedValue(mockAdvisories);

      const result = await AdvisoryCacheService.getAdvisoriesForCrops([
        'wheat',
        'rice',
      ]);

      expect(result.data).toEqual(mockAdvisories);
      expect(result.count).toBe(1);
    });
  });

  describe('refreshAllAdvisories', () => {
    it('should refresh all advisory types', async () => {
      AdvisoryCacheService._fetchAdvisoriesFromAPI = jest.fn().mockResolvedValue([]);
      AdvisoryCacheRepository.saveAdvisory = jest.fn().mockResolvedValue({});
      AdvisoryCacheRepository.deleteExpiredAdvisories = jest.fn().mockResolvedValue(0);
      AdvisoryCacheRepository.enforceRetentionLimits = jest.fn().mockResolvedValue(0);

      const result = await AdvisoryCacheService.refreshAllAdvisories();

      expect(result.total).toBe(3); // irrigation, market, climate
      expect(result.success).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear advisory cache for specific type', async () => {
      AdvisoryCacheRepository.clearCache.mockResolvedValue(5);

      const deletedCount = await AdvisoryCacheService.clearCache(
        ADVISORY_TYPES.IRRIGATION
      );

      expect(deletedCount).toBe(5);
      expect(AdvisoryCacheRepository.clearCache).toHaveBeenCalledWith(
        ADVISORY_TYPES.IRRIGATION
      );
    });

    it('should clear all advisory cache when no type specified', async () => {
      AdvisoryCacheRepository.clearCache.mockResolvedValue(15);

      const deletedCount = await AdvisoryCacheService.clearCache();

      expect(deletedCount).toBe(15);
      expect(AdvisoryCacheRepository.clearCache).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockStats = [
        {
          advisory_type: 'irrigation',
          count: 5,
          critical_count: 1,
          last_updated: new Date().toISOString(),
        },
      ];

      AdvisoryCacheRepository.getAdvisoryStats.mockResolvedValue(mockStats);
      AdvisoryCacheRepository.getCacheSize.mockResolvedValue(2097152); // 2MB

      const stats = await AdvisoryCacheService.getCacheStats();

      expect(stats.types).toEqual(mockStats);
      expect(stats.totalSize).toBe(2097152);
      expect(stats.sizeMB).toBe('2.00');
    });
  });

  describe('getRefreshPriority', () => {
    it('should return advisory types in priority order', () => {
      const priority = AdvisoryCacheService.getRefreshPriority();

      expect(priority).toHaveLength(3);
      expect(priority[0]).toBe(ADVISORY_TYPES.CLIMATE); // Highest priority
      expect(priority[2]).toBe(ADVISORY_TYPES.IRRIGATION); // Lowest priority
    });
  });
});
