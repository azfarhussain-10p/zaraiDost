// Network Quality Monitor Service
// Story 1.6: Network Status and Sync Monitoring
// Monitors network quality and provides connection recommendations

import NetInfo from '@react-native-community/netinfo';
import {
  CONNECTION_STATUS,
  CONNECTION_TYPE_MAP,
  CELLULAR_SUBTYPE_MAP,
  NETWORK_QUALITY,
} from '../../constants/SyncConstants';
import { Platform } from 'react-native';

// Cache current connection status
let currentConnectionStatus = CONNECTION_STATUS.UNKNOWN;
let connectionListeners = [];

/**
 * Initialize network quality monitoring
 * @returns {Promise<void>}
 */
export async function initializeNetworkMonitor() {
  if (Platform.OS === 'web') {
    console.log('[NetworkQualityMonitor] Web platform - using simplified monitoring');
    currentConnectionStatus = CONNECTION_STATUS.WIFI; // Assume WiFi on web
    return;
  }

  try {
    // Get initial state
    const state = await NetInfo.fetch();
    currentConnectionStatus = mapConnectionState(state);

    // Subscribe to network state updates
    NetInfo.addEventListener((state) => {
      const newStatus = mapConnectionState(state);
      if (newStatus.type !== currentConnectionStatus.type) {
        console.log('[NetworkQualityMonitor] Connection changed:', {
          from: currentConnectionStatus.label,
          to: newStatus.label,
        });

        currentConnectionStatus = newStatus;

        // Notify all listeners
        connectionListeners.forEach((listener) => {
          try {
            listener(newStatus);
          } catch (error) {
            console.error('[NetworkQualityMonitor] Listener error:', error);
          }
        });
      }
    });

    console.log('[NetworkQualityMonitor] Initialized with:', currentConnectionStatus.label);
  } catch (error) {
    console.error('[NetworkQualityMonitor] Initialization failed:', error);
    currentConnectionStatus = CONNECTION_STATUS.UNKNOWN;
  }
}

/**
 * Get current connection status
 * @returns {Object} Current connection status
 */
export function getCurrentConnectionStatus() {
  return currentConnectionStatus;
}

/**
 * Check if currently connected
 * @returns {boolean} True if connected
 */
export function isConnected() {
  return currentConnectionStatus.canSync;
}

/**
 * Check if on WiFi
 * @returns {boolean} True if on WiFi
 */
export function isWiFi() {
  return currentConnectionStatus.type === 'wifi';
}

/**
 * Check if on cellular
 * @returns {boolean} True if on cellular
 */
export function isCellular() {
  return currentConnectionStatus.type === 'cellular';
}

/**
 * Get network quality level
 * @returns {Object} Network quality info
 */
export function getNetworkQuality() {
  const status = currentConnectionStatus;

  // Map connection type to quality level
  switch (status.quality) {
    case 'excellent':
      return NETWORK_QUALITY.EXCELLENT;
    case 'good':
      return NETWORK_QUALITY.GOOD;
    case 'moderate':
      return NETWORK_QUALITY.MODERATE;
    case 'poor':
      return NETWORK_QUALITY.POOR;
    case 'none':
    default:
      return NETWORK_QUALITY.NONE;
  }
}

/**
 * Check if connection is suitable for sync
 * @param {boolean} wifiOnlyMode - WiFi-only mode enabled
 * @returns {Object} Suitability assessment
 */
export function isConnectionSuitableForSync(wifiOnlyMode = false) {
  const status = currentConnectionStatus;

  if (!status.canSync) {
    return {
      suitable: false,
      reason: 'No internet connection',
      recommendation: 'Connect to WiFi or enable cellular data',
    };
  }

  if (wifiOnlyMode && status.type !== 'wifi') {
    return {
      suitable: false,
      reason: 'WiFi-only mode enabled',
      recommendation: 'Connect to WiFi or disable WiFi-only mode',
    };
  }

  // Check connection quality
  const quality = getNetworkQuality();

  if (quality.min <= 1) {
    // Poor connection (2G)
    return {
      suitable: true,
      reason: 'Slow connection detected',
      recommendation: 'Sync may be slow. Consider waiting for better connection.',
      warning: true,
    };
  }

  return {
    suitable: true,
    reason: `Connected via ${status.label}`,
    recommendation: null,
  };
}

/**
 * Estimate sync time based on connection quality
 * @param {number} dataSize - Data size in bytes
 * @returns {Object} Estimated sync time
 */
export function estimateSyncTime(dataSize) {
  const status = currentConnectionStatus;

  // Typical speeds (bytes per second)
  const speeds = {
    wifi: 5 * 1024 * 1024, // 5 MB/s
    '5G': 10 * 1024 * 1024, // 10 MB/s
    '4G': 2 * 1024 * 1024, // 2 MB/s
    '3G': 384 * 1024, // 384 KB/s
    '2G': 50 * 1024, // 50 KB/s
    offline: 0,
  };

  let speed = speeds['4G']; // Default

  if (status.type === 'wifi') {
    speed = speeds.wifi;
  } else if (status.type === 'cellular') {
    speed = speeds[status.subtype] || speeds['4G'];
  } else {
    speed = speeds.offline;
  }

  if (speed === 0) {
    return {
      estimatedSeconds: null,
      estimatedMinutes: null,
      estimatedFormatted: 'No connection',
    };
  }

  const estimatedSeconds = Math.ceil(dataSize / speed);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  let formatted = '';
  if (estimatedSeconds < 60) {
    formatted = `~${estimatedSeconds} seconds`;
  } else if (estimatedMinutes < 60) {
    formatted = `~${estimatedMinutes} minutes`;
  } else {
    const hours = Math.ceil(estimatedMinutes / 60);
    formatted = `~${hours} hours`;
  }

  return {
    estimatedSeconds,
    estimatedMinutes,
    estimatedFormatted: formatted,
    connectionType: status.label,
  };
}

/**
 * Get connection recommendations for user
 * @param {Object} syncData - Sync data info (size, entity types)
 * @returns {Array} Recommendations
 */
export function getConnectionRecommendations(syncData = {}) {
  const status = currentConnectionStatus;
  const recommendations = [];

  // No connection
  if (!status.canSync) {
    recommendations.push({
      priority: 'high',
      message: 'No internet connection. Please connect to WiFi or enable cellular data.',
      action: 'enable_connection',
    });
    return recommendations;
  }

  // On cellular with large data
  if (status.type === 'cellular' && syncData.totalBytes > 10 * 1024 * 1024) {
    // > 10MB
    recommendations.push({
      priority: 'high',
      message: `Syncing ${formatDataSize(syncData.totalBytes)} on cellular. Consider using WiFi to save data.`,
      action: 'suggest_wifi',
    });
  }

  // Slow connection
  if (status.quality === 'poor') {
    recommendations.push({
      priority: 'medium',
      message: 'Slow connection detected. Sync may take longer than usual.',
      action: 'warn_slow',
    });
  }

  // Large image uploads on cellular
  if (
    status.type === 'cellular' &&
    syncData.imageCount > 5 &&
    syncData.imageBytes > 5 * 1024 * 1024
  ) {
    recommendations.push({
      priority: 'medium',
      message: `${syncData.imageCount} images to upload. Consider WiFi to avoid data charges.`,
      action: 'suggest_wifi_for_images',
    });
  }

  // Good connection
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      message: `Connected via ${status.label}. Good for syncing.`,
      action: 'proceed',
    });
  }

  return recommendations;
}

/**
 * Subscribe to connection status changes
 * @param {Function} callback - Callback function (receives new status)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConnectionChanges(callback) {
  connectionListeners.push(callback);

  // Return unsubscribe function
  return () => {
    connectionListeners = connectionListeners.filter((listener) => listener !== callback);
  };
}

/**
 * Map NetInfo state to our CONNECTION_STATUS
 * @param {Object} state - NetInfo state object
 * @returns {Object} CONNECTION_STATUS object
 */
function mapConnectionState(state) {
  if (!state.isConnected) {
    return CONNECTION_STATUS.OFFLINE;
  }

  const type = state.type?.toLowerCase();
  const subtype = state.details?.cellularGeneration?.toLowerCase();

  // Check if WiFi
  if (type === 'wifi' || type === 'ethernet') {
    return CONNECTION_STATUS.WIFI;
  }

  // Check cellular subtype
  if (type === 'cellular' && subtype) {
    return CELLULAR_SUBTYPE_MAP[subtype] || CONNECTION_STATUS.CELLULAR_4G;
  }

  // Fallback to type mapping
  return CONNECTION_TYPE_MAP[type] || CONNECTION_STATUS.UNKNOWN;
}

/**
 * Format data size for display
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string
 */
function formatDataSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default {
  initializeNetworkMonitor,
  getCurrentConnectionStatus,
  isConnected,
  isWiFi,
  isCellular,
  getNetworkQuality,
  isConnectionSuitableForSync,
  estimateSyncTime,
  getConnectionRecommendations,
  subscribeToConnectionChanges,
};

