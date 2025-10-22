// StalenessDetector
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 5 (Cache staleness detection)

import {
  STALENESS,
  STALENESS_COLORS,
  STALENESS_LABELS,
  getStalenessCategory,
  getStalenessColor,
  getStalenessLabel,
  calculateHoursSinceUpdate,
  needsRefresh,
  isCriticallyStale,
} from '../../constants/CacheConstants';

/**
 * Service for detecting and categorizing cache data staleness
 * Provides staleness indicators and warnings for cached data
 */
class StalenessDetector {
  /**
   * Analyze staleness of cached data
   * Returns comprehensive staleness information
   */
  analyzeStaleness(lastUpdated) {
    if (!lastUpdated) {
      return {
        category: 'CRITICAL',
        label: 'No Data',
        color: STALENESS_COLORS.CRITICAL,
        hoursOld: null,
        needsRefresh: true,
        isCritical: true,
        message: 'No cached data available',
      };
    }

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);
    const category = getStalenessCategory(hoursOld);
    const color = getStalenessColor(category);
    const label = getStalenessLabel(category);

    return {
      category,
      label,
      color,
      hoursOld: Math.round(hoursOld * 10) / 10, // Round to 1 decimal
      needsRefresh: needsRefresh(lastUpdated),
      isCritical: isCriticallyStale(lastUpdated),
      message: this.getStalenessMessage(category, hoursOld),
      lastUpdated,
      timestamp: new Date(lastUpdated).toLocaleString(),
    };
  }

  /**
   * Get human-readable staleness message
   */
  getStalenessMessage(category, hoursOld) {
    if (hoursOld < 1) {
      return 'Updated less than 1 hour ago';
    } else if (hoursOld < STALENESS.ACCEPTABLE) {
      return `Updated ${Math.round(hoursOld)} hour${
        Math.round(hoursOld) !== 1 ? 's' : ''
      } ago`;
    } else if (hoursOld < STALENESS.STALE) {
      const hours = Math.round(hoursOld);
      return `Updated ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.round(hoursOld / 24);
      return `Updated ${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get relative time string (e.g., "2 hours ago", "3 days ago")
   */
  getRelativeTimeString(lastUpdated) {
    if (!lastUpdated) return 'Never';

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);

    if (hoursOld < 1) {
      const minutesOld = Math.round(hoursOld * 60);
      return `${minutesOld} minute${minutesOld !== 1 ? 's' : ''} ago`;
    } else if (hoursOld < 24) {
      const hours = Math.round(hoursOld);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.round(hoursOld / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get expiry countdown (days until data becomes critically stale)
   */
  getExpiryCountdown(lastUpdated) {
    if (!lastUpdated) return null;

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);
    const hoursUntilCritical = STALENESS.CRITICAL - hoursOld;

    if (hoursUntilCritical <= 0) {
      return {
        expired: true,
        message: 'Data is critically stale',
        hoursRemaining: 0,
        daysRemaining: 0,
      };
    }

    const daysRemaining = Math.ceil(hoursUntilCritical / 24);

    return {
      expired: false,
      message:
        daysRemaining === 1
          ? 'Expires in 1 day'
          : `Expires in ${daysRemaining} days`,
      hoursRemaining: Math.round(hoursUntilCritical),
      daysRemaining,
    };
  }

  /**
   * Check if data should show warning indicator
   */
  shouldShowWarning(lastUpdated) {
    if (!lastUpdated) return true;

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);
    return hoursOld >= STALENESS.STALE;
  }

  /**
   * Check if data should show critical warning
   */
  shouldShowCriticalWarning(lastUpdated) {
    return isCriticallyStale(lastUpdated);
  }

  /**
   * Get staleness indicator type for UI
   * Returns: 'success' | 'warning' | 'error'
   */
  getIndicatorType(lastUpdated) {
    if (!lastUpdated) return 'error';

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);

    if (hoursOld < STALENESS.STALE) return 'success';
    if (hoursOld < STALENESS.CRITICAL) return 'warning';
    return 'error';
  }

  /**
   * Get badge text for UI (e.g., "Live", "Cached", "Outdated")
   */
  getBadgeText(lastUpdated, isLive = false) {
    if (isLive) return 'Live';
    if (!lastUpdated) return 'No Data';

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);
    const category = getStalenessCategory(hoursOld);

    return getStalenessLabel(category);
  }

  /**
   * Compare freshness of multiple data sources
   * Returns the freshest data source
   */
  getFreshestData(dataSources) {
    if (!dataSources || dataSources.length === 0) return null;

    return dataSources.reduce((freshest, current) => {
      if (!current.lastUpdated) return freshest;
      if (!freshest.lastUpdated) return current;

      const currentHours = calculateHoursSinceUpdate(current.lastUpdated);
      const freshestHours = calculateHoursSinceUpdate(freshest.lastUpdated);

      return currentHours < freshestHours ? current : freshest;
    });
  }

  /**
   * Get aggregated staleness for multiple cache types
   * Useful for showing overall cache status
   */
  getAggregatedStaleness(cacheTypes) {
    if (!cacheTypes || Object.keys(cacheTypes).length === 0) {
      return {
        overallStatus: 'CRITICAL',
        color: STALENESS_COLORS.CRITICAL,
        message: 'No cached data',
      };
    }

    let worstCategory = 'FRESH';
    let oldestHours = 0;

    Object.values(cacheTypes).forEach(cache => {
      if (!cache.lastUpdated) {
        worstCategory = 'CRITICAL';
        return;
      }

      const hoursOld = calculateHoursSinceUpdate(cache.lastUpdated);
      const category = getStalenessCategory(hoursOld);

      if (hoursOld > oldestHours) {
        oldestHours = hoursOld;
        worstCategory = category;
      }
    });

    return {
      overallStatus: worstCategory,
      color: getStalenessColor(worstCategory),
      label: getStalenessLabel(worstCategory),
      message: this.getStalenessMessage(worstCategory, oldestHours),
      oldestHours: Math.round(oldestHours * 10) / 10,
    };
  }

  /**
   * Check if any cache type is critically stale
   */
  hasCriticalStaleness(cacheTypes) {
    return Object.values(cacheTypes).some(
      cache => cache.lastUpdated && isCriticallyStale(cache.lastUpdated)
    );
  }

  /**
   * Get recommendation message based on staleness
   */
  getRecommendation(lastUpdated, isOnline) {
    if (!lastUpdated) {
      return isOnline
        ? 'Pull to refresh to download latest data'
        : 'No cached data available. Connect to internet to download data.';
    }

    const hoursOld = calculateHoursSinceUpdate(lastUpdated);

    if (hoursOld < STALENESS.ACCEPTABLE) {
      return 'Data is up to date';
    }

    if (hoursOld < STALENESS.STALE) {
      return isOnline
        ? 'Data is recent. Pull to refresh for latest updates.'
        : 'Showing recent cached data. Connect to internet for latest updates.';
    }

    if (hoursOld < STALENESS.CRITICAL) {
      return isOnline
        ? 'Data is outdated. Pull to refresh recommended.'
        : 'Showing old cached data. Connect to internet to update.';
    }

    return isOnline
      ? 'Data is very old. Refresh required.'
      : 'Cached data is critically old. Connect to internet to update.';
  }
}

export default new StalenessDetector();
