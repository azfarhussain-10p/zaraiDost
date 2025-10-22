// Sync Status Indicator Component
// Story 1.2: Background Synchronization Service
// Implements: Task 5.2 (Display sync status indicator)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import SyncService from '../../services/sync/SyncService';
import NetworkMonitor from '../../services/sync/NetworkMonitor';
import { SYNC_EVENTS } from '../../constants/SyncConstants';

/**
 * SyncStatusIndicator Component
 * Displays current sync status with icon and text
 */
const SyncStatusIndicator = ({ compact = false }) => {
  const [status, setStatus] = useState({
    isSyncing: false,
    isConnected: false,
    lastSyncTime: null,
    pendingCount: 0,
  });

  useEffect(() => {
    // Initial status
    updateStatus();

    // Listen to sync events
    const unsubscribeSync = SyncService.addListener((event) => {
      updateStatus();
    });

    // Listen to network changes
    const unsubscribeNetwork = NetworkMonitor.addListener(() => {
      updateStatus();
    });

    // Update pending count periodically
    const interval = setInterval(() => {
      updatePendingCount();
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, []);

  const updateStatus = async () => {
    const syncStatus = SyncService.getSyncStatus();
    const pendingCount = await SyncService.getPendingCount();

    setStatus({
      isSyncing: syncStatus.isSyncing,
      isConnected: syncStatus.isConnected,
      lastSyncTime: syncStatus.lastSyncTime,
      pendingCount: pendingCount.total,
      connectionType: syncStatus.connectionType,
    });
  };

  const updatePendingCount = async () => {
    const pendingCount = await SyncService.getPendingCount();
    setStatus((prev) => ({ ...prev, pendingCount: pendingCount.total }));
  };

  const getStatusColor = () => {
    if (status.isSyncing) return '#2196F3'; // Blue
    if (!status.isConnected) return '#9E9E9E'; // Gray
    if (status.pendingCount > 0) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  };

  const getStatusText = () => {
    if (status.isSyncing) return 'Syncing...';
    if (!status.isConnected) return 'Offline';
    if (status.pendingCount > 0) return `${status.pendingCount} pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (status.isSyncing) return '↻';
    if (!status.isConnected) return '✕';
    if (status.pendingCount > 0) return '⚠';
    return '✓';
  };

  const formatLastSyncTime = () => {
    if (!status.lastSyncTime) return 'Never';

    const lastSync = new Date(status.lastSyncTime);
    const now = new Date();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderColor: getStatusColor() }]}>
        {status.isSyncing ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <Text style={[styles.icon, { color: getStatusColor() }]}>
            {getStatusIcon()}
          </Text>
        )}
        <Text style={styles.compactText}>{getStatusText()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {status.isSyncing ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
        )}
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {status.lastSyncTime && !status.isSyncing && (
        <Text style={styles.lastSyncText}>
          Last synced: {formatLastSyncTime()}
        </Text>
      )}

      {!status.isConnected && (
        <Text style={styles.offlineText}>
          No internet connection
        </Text>
      )}

      {status.isConnected && status.connectionType === 'cellular' && (
        <Text style={styles.cellularText}>
          Using cellular data
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  compactText: {
    fontSize: 12,
    color: '#666',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  offlineText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  cellularText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
  },
});

export default SyncStatusIndicator;
