// StalenessDetector Tests
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 8 (Unit tests for staleness detection)

import StalenessDetector from '../../../services/cache/StalenessDetector';
import { STALENESS } from '../../../constants/CacheConstants';

describe('StalenessDetector', () => {
  const now = new Date();

  describe('analyzeStaleness', () => {
    it('should return FRESH category for recent data (<6 hours)', () => {
      const recentTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      const result = StalenessDetector.analyzeStaleness(recentTime.toISOString());

      expect(result.category).toBe('FRESH');
      expect(result.needsRefresh).toBe(false);
      expect(result.isCritical).toBe(false);
    });

    it('should return ACCEPTABLE category for data 6-24 hours old', () => {
      const acceptableTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      const result = StalenessDetector.analyzeStaleness(acceptableTime.toISOString());

      expect(result.category).toBe('ACCEPTABLE');
      expect(result.needsRefresh).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('should return STALE category for data 24-72 hours old', () => {
      const staleTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
      const result = StalenessDetector.analyzeStaleness(staleTime.toISOString());

      expect(result.category).toBe('STALE');
      expect(result.needsRefresh).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('should return VERY_STALE category for data 72-120 hours old', () => {
      const veryStaleTime = new Date(now.getTime() - 96 * 60 * 60 * 1000); // 96 hours ago
      const result = StalenessDetector.analyzeStaleness(veryStaleTime.toISOString());

      expect(result.category).toBe('VERY_STALE');
      expect(result.needsRefresh).toBe(true);
      expect(result.isCritical).toBe(false);
    });

    it('should return CRITICAL category for data >120 hours old', () => {
      const criticalTime = new Date(now.getTime() - 150 * 60 * 60 * 1000); // 150 hours ago
      const result = StalenessDetector.analyzeStaleness(criticalTime.toISOString());

      expect(result.category).toBe('CRITICAL');
      expect(result.needsRefresh).toBe(true);
      expect(result.isCritical).toBe(true);
    });

    it('should return CRITICAL when lastUpdated is null', () => {
      const result = StalenessDetector.analyzeStaleness(null);

      expect(result.category).toBe('CRITICAL');
      expect(result.label).toBe('No Data');
      expect(result.isCritical).toBe(true);
    });
  });

  describe('getRelativeTimeString', () => {
    it('should return "X minutes ago" for recent updates', () => {
      const recentTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const result = StalenessDetector.getRelativeTimeString(recentTime.toISOString());

      expect(result).toContain('minutes ago');
    });

    it('should return "X hours ago" for updates within 24 hours', () => {
      const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      const result = StalenessDetector.getRelativeTimeString(hoursAgo.toISOString());

      expect(result).toContain('hours ago');
    });

    it('should return "X days ago" for updates beyond 24 hours', () => {
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = StalenessDetector.getRelativeTimeString(daysAgo.toISOString());

      expect(result).toContain('days ago');
    });

    it('should return "Never" when lastUpdated is null', () => {
      const result = StalenessDetector.getRelativeTimeString(null);

      expect(result).toBe('Never');
    });
  });

  describe('getExpiryCountdown', () => {
    it('should return expiry countdown for valid data', () => {
      const recentTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const result = StalenessDetector.getExpiryCountdown(recentTime.toISOString());

      expect(result.expired).toBe(false);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.message).toContain('Expires in');
    });

    it('should indicate expired for critically stale data', () => {
      const oldTime = new Date(now.getTime() - 200 * 60 * 60 * 1000); // 200 hours ago
      const result = StalenessDetector.getExpiryCountdown(oldTime.toISOString());

      expect(result.expired).toBe(true);
      expect(result.hoursRemaining).toBe(0);
      expect(result.daysRemaining).toBe(0);
    });

    it('should return null when lastUpdated is null', () => {
      const result = StalenessDetector.getExpiryCountdown(null);

      expect(result).toBeNull();
    });
  });

  describe('shouldShowWarning', () => {
    it('should return false for fresh data', () => {
      const freshTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      const result = StalenessDetector.shouldShowWarning(freshTime.toISOString());

      expect(result).toBe(false);
    });

    it('should return true for stale data', () => {
      const staleTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
      const result = StalenessDetector.shouldShowWarning(staleTime.toISOString());

      expect(result).toBe(true);
    });

    it('should return true when lastUpdated is null', () => {
      const result = StalenessDetector.shouldShowWarning(null);

      expect(result).toBe(true);
    });
  });

  describe('shouldShowCriticalWarning', () => {
    it('should return false for non-critical data', () => {
      const recentTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
      const result = StalenessDetector.shouldShowCriticalWarning(
        recentTime.toISOString()
      );

      expect(result).toBe(false);
    });

    it('should return true for critically stale data', () => {
      const criticalTime = new Date(now.getTime() - 150 * 60 * 60 * 1000); // 150 hours ago
      const result = StalenessDetector.shouldShowCriticalWarning(
        criticalTime.toISOString()
      );

      expect(result).toBe(true);
    });
  });

  describe('getIndicatorType', () => {
    it('should return "success" for fresh data', () => {
      const freshTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const result = StalenessDetector.getIndicatorType(freshTime.toISOString());

      expect(result).toBe('success');
    });

    it('should return "warning" for stale data', () => {
      const staleTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const result = StalenessDetector.getIndicatorType(staleTime.toISOString());

      expect(result).toBe('warning');
    });

    it('should return "error" for critically stale data', () => {
      const criticalTime = new Date(now.getTime() - 150 * 60 * 60 * 1000);
      const result = StalenessDetector.getIndicatorType(criticalTime.toISOString());

      expect(result).toBe('error');
    });

    it('should return "error" when lastUpdated is null', () => {
      const result = StalenessDetector.getIndicatorType(null);

      expect(result).toBe('error');
    });
  });

  describe('getBadgeText', () => {
    it('should return "Live" when isLive is true', () => {
      const result = StalenessDetector.getBadgeText(new Date().toISOString(), true);

      expect(result).toBe('Live');
    });

    it('should return "No Data" when lastUpdated is null', () => {
      const result = StalenessDetector.getBadgeText(null, false);

      expect(result).toBe('No Data');
    });

    it('should return appropriate label based on staleness', () => {
      const freshTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const result = StalenessDetector.getBadgeText(freshTime.toISOString(), false);

      expect(result).toBeDefined();
      expect(['Live', 'Recent', 'Outdated', 'Very Old', 'Critical']).toContain(result);
    });
  });

  describe('getAggregatedStaleness', () => {
    it('should return CRITICAL when no cache types provided', () => {
      const result = StalenessDetector.getAggregatedStaleness({});

      expect(result.overallStatus).toBe('CRITICAL');
      expect(result.message).toBe('No cached data');
    });

    it('should return worst staleness category across cache types', () => {
      const cacheTypes = {
        weather: { lastUpdated: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
        advisory: { lastUpdated: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() },
      };

      const result = StalenessDetector.getAggregatedStaleness(cacheTypes);

      expect(result.overallStatus).toBe('STALE');
    });
  });

  describe('getRecommendation', () => {
    it('should recommend refresh for online stale data', () => {
      const staleTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const result = StalenessDetector.getRecommendation(staleTime.toISOString(), true);

      expect(result).toContain('refresh');
    });

    it('should suggest connecting to internet for offline stale data', () => {
      const staleTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const result = StalenessDetector.getRecommendation(staleTime.toISOString(), false);

      expect(result).toContain('internet');
    });

    it('should indicate data is up to date for fresh data', () => {
      const freshTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const result = StalenessDetector.getRecommendation(freshTime.toISOString(), true);

      expect(result).toContain('up to date');
    });
  });
});
