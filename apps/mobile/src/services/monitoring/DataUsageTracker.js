// Data Usage Tracker Service
// Story 1.6: Network Status and Sync Monitoring
// Tracks bandwidth usage during sync operations

import {
  createDataUsage,
  getDailyDataUsage,
  getWeeklyDataUsage,
  getMonthlyDataUsage,
  getTotalDataUsage,
} from '../../database/repositories/DataUsageRepository';
import { DATA_USAGE_THRESHOLDS } from '../../constants/SyncConstants';
import { Platform } from 'react-native';

/**
 * Track data usage for a sync operation
 * @param {Object} usageData - Usage data
 * @returns {Promise<Object>} Created usage record
 */
export async function trackSyncUsage(usageData) {
  try {
    const {
      syncOperationId,
      connectionType,
      bytesUploaded = 0,
      bytesDownloaded = 0,
      entityBreakdown = {},
    } = usageData;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const usageRecord = {
      id: `usage_${syncOperationId}_${Date.now()}`,
      date: today,
      connection_type: connectionType,
      sync_operation_id: syncOperationId,
      bytes_uploaded: bytesUploaded,
      bytes_downloaded: bytesDownloaded,
      total_bytes: bytesUploaded + bytesDownloaded,
      entity_breakdown: entityBreakdown,
    };

    console.log('[DataUsageTracker] Tracking sync usage:', {
      total: formatBytes(usageRecord.total_bytes),
      connection: connectionType,
    });

    return await createDataUsage(usageRecord);
  } catch (error) {
    console.error('[DataUsageTracker] TrackSyncUsage failed:', error);
    throw error;
  }
}

/**
 * Get today's data usage statistics
 * @returns {Promise<Object>} Today's usage
 */
export async function getTodayUsage() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usage = await getDailyDataUsage(today);

    return {
      date: today,
      wifi: {
        ...usage.wifi,
        formatted: formatBytes(usage.wifi.total),
      },
      cellular: {
        ...usage.cellular,
        formatted: formatBytes(usage.cellular.total),
      },
      total: usage.wifi.total + usage.cellular.total,
      totalFormatted: formatBytes(usage.wifi.total + usage.cellular.total),
    };
  } catch (error) {
    console.error('[DataUsageTracker] GetTodayUsage failed:', error);
    throw error;
  }
}

/**
 * Get this week's data usage statistics
 * @returns {Promise<Object>} Week's usage
 */
export async function getThisWeekUsage() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const startDate = startOfWeek.toISOString().split('T')[0];

    const usage = await getWeeklyDataUsage(startDate);

    return {
      startDate,
      wifi: {
        ...usage.wifi,
        formatted: formatBytes(usage.wifi.total),
      },
      cellular: {
        ...usage.cellular,
        formatted: formatBytes(usage.cellular.total),
      },
      total: usage.wifi.total + usage.cellular.total,
      totalFormatted: formatBytes(usage.wifi.total + usage.cellular.total),
    };
  } catch (error) {
    console.error('[DataUsageTracker] GetThisWeekUsage failed:', error);
    throw error;
  }
}

/**
 * Get this month's data usage statistics
 * @returns {Promise<Object>} Month's usage
 */
export async function getThisMonthUsage() {
  try {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const usage = await getMonthlyDataUsage(yearMonth);

    return {
      yearMonth,
      wifi: {
        ...usage.wifi,
        formatted: formatBytes(usage.wifi.total),
      },
      cellular: {
        ...usage.cellular,
        formatted: formatBytes(usage.cellular.total),
      },
      total: usage.total,
      totalFormatted: formatBytes(usage.total),
      estimatedCost: estimateDataCost(usage.cellular.total),
    };
  } catch (error) {
    console.error('[DataUsageTracker] GetThisMonthUsage failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive data usage statistics
 * @returns {Promise<Object>} All usage stats
 */
export async function getComprehensiveUsageStats() {
  try {
    const [today, week, month, total] = await Promise.all([
      getTodayUsage(),
      getThisWeekUsage(),
      getThisMonthUsage(),
      getTotalDataUsage(),
    ]);

    return {
      today,
      week,
      month,
      allTime: {
        wifi: total.wifi,
        wifiFormatted: formatBytes(total.wifi),
        cellular: total.cellular,
        cellularFormatted: formatBytes(total.cellular),
        total: total.total,
        totalFormatted: formatBytes(total.total),
      },
      warnings: getUsageWarnings(today, week, month),
    };
  } catch (error) {
    console.error('[DataUsageTracker] GetComprehensiveUsageStats failed:', error);
    throw error;
  }
}

/**
 * Check for usage warnings (exceeding thresholds)
 * @param {Object} today - Today's usage
 * @param {Object} week - Week's usage
 * @param {Object} month - Month's usage
 * @returns {Array} Warning messages
 */
function getUsageWarnings(today, week, month) {
  const warnings = [];
  const thresholdsMB = DATA_USAGE_THRESHOLDS;

  // Check cellular usage against thresholds
  const todayCellularMB = bytesToMB(today.cellular.total);
  const weekCellularMB = bytesToMB(week.cellular.total);
  const monthCellularMB = bytesToMB(month.cellular.total);

  if (todayCellularMB > thresholdsMB.DAILY_TARGET) {
    warnings.push({
      type: 'daily_exceeded',
      level: 'warning',
      message: `Daily cellular usage (${formatBytes(today.cellular.total)}) exceeds target (${thresholdsMB.DAILY_TARGET}MB)`,
    });
  }

  if (weekCellularMB > thresholdsMB.WEEKLY_TARGET) {
    warnings.push({
      type: 'weekly_exceeded',
      level: 'warning',
      message: `Weekly cellular usage (${formatBytes(week.cellular.total)}) exceeds target (${thresholdsMB.WEEKLY_TARGET}MB)`,
    });
  }

  if (monthCellularMB > thresholdsMB.WARNING) {
    warnings.push({
      type: 'monthly_warning',
      level: 'critical',
      message: `Monthly cellular usage (${formatBytes(month.cellular.total)}) exceeds warning threshold (${thresholdsMB.WARNING}MB)`,
    });
  }

  if (monthCellularMB > thresholdsMB.LIMIT) {
    warnings.push({
      type: 'monthly_limit',
      level: 'critical',
      message: `Monthly cellular usage (${formatBytes(month.cellular.total)}) exceeds recommended limit (${thresholdsMB.LIMIT}MB). Consider enabling WiFi-only sync.`,
    });
  }

  return warnings;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Convert bytes to megabytes
 * @param {number} bytes - Bytes
 * @returns {number} Megabytes
 */
export function bytesToMB(bytes) {
  return bytes / (1024 * 1024);
}

/**
 * Convert megabytes to bytes
 * @param {number} mb - Megabytes
 * @returns {number} Bytes
 */
export function mbToBytes(mb) {
  return mb * 1024 * 1024;
}

/**
 * Estimate data cost based on typical carrier rates in Pakistan
 * @param {number} cellularBytes - Cellular data used in bytes
 * @returns {string} Estimated cost in PKR
 */
export function estimateDataCost(cellularBytes) {
  // Typical Pakistan carrier rates: ~PKR 10-20 per GB
  // Using conservative estimate of PKR 15 per GB
  const GB_COST_PKR = 15;
  const gb = cellularBytes / (1024 * 1024 * 1024);
  const cost = gb * GB_COST_PKR;

  if (cost < 1) {
    return 'Less than PKR 1';
  }

  return `~PKR ${Math.round(cost)}`;
}

/**
 * Get data usage trend (increasing, stable, decreasing)
 * @param {Array} dailyUsageHistory - Array of daily usage objects
 * @returns {string} Trend direction
 */
export function getUsageTrend(dailyUsageHistory) {
  if (!dailyUsageHistory || dailyUsageHistory.length < 2) {
    return 'stable';
  }

  const recentDays = dailyUsageHistory.slice(-7); // Last 7 days
  const firstHalf = recentDays.slice(0, Math.ceil(recentDays.length / 2));
  const secondHalf = recentDays.slice(Math.ceil(recentDays.length / 2));

  const firstAvg =
    firstHalf.reduce((sum, day) => sum + day.total, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, day) => sum + day.total, 0) / secondHalf.length;

  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (changePercent > 20) {
    return 'increasing';
  } else if (changePercent < -20) {
    return 'decreasing';
  }

  return 'stable';
}

/**
 * Calculate average daily usage
 * @param {Array} dailyUsageHistory - Array of daily usage objects
 * @returns {number} Average bytes per day
 */
export function getAverageDailyUsage(dailyUsageHistory) {
  if (!dailyUsageHistory || dailyUsageHistory.length === 0) {
    return 0;
  }

  const totalBytes = dailyUsageHistory.reduce((sum, day) => sum + day.total, 0);
  return totalBytes / dailyUsageHistory.length;
}

/**
 * Project monthly usage based on current trend
 * @param {Object} monthUsage - Current month's usage
 * @returns {Object} Projection
 */
export function projectMonthlyUsage(monthUsage) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  if (daysPassed === 0) {
    return {
      projected: 0,
      projectedFormatted: '0 B',
      daysRemaining,
    };
  }

  const dailyAverage = monthUsage.total / daysPassed;
  const projected = monthUsage.total + dailyAverage * daysRemaining;

  return {
    projected,
    projectedFormatted: formatBytes(projected),
    dailyAverage,
    dailyAverageFormatted: formatBytes(dailyAverage),
    daysRemaining,
    likelyToExceedWarning: bytesToMB(projected) > DATA_USAGE_THRESHOLDS.WARNING,
    likelyToExceedLimit: bytesToMB(projected) > DATA_USAGE_THRESHOLDS.LIMIT,
  };
}

export default {
  trackSyncUsage,
  getTodayUsage,
  getThisWeekUsage,
  getThisMonthUsage,
  getComprehensiveUsageStats,
  formatBytes,
  bytesToMB,
  mbToBytes,
  estimateDataCost,
  getUsageTrend,
  getAverageDailyUsage,
  projectMonthlyUsage,
};

