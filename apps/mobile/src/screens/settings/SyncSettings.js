// Sync Settings Screen
// Story 1.2: Background Synchronization Service
// Implements: Task 5 (Sync UI and manual controls), Task 6 (Sync state management UI)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import SyncService from '../../services/sync/SyncService';
import NetworkMonitor from '../../services/sync/NetworkMonitor';
import BackgroundSync from '../../services/sync/BackgroundSync';
import ConflictResolver from '../../services/sync/ConflictResolver';
import SyncButton from '../../components/sync/SyncButton';
import SyncStatusIndicator from '../../components/sync/SyncStatusIndicator';
import { SYNC_EVENTS } from '../../constants/SyncConstants';

/**
 * SyncSettings Screen
 * Provides manual sync controls, settings, and sync history
 */
const SyncSettings = () => {
  const [syncStatus, setSyncStatus] = useState({});
  const [pendingCount, setPendingCount] = useState({ total: 0, byType: {} });
  const [syncHistory, setSyncHistory] = useState([]);
  const [syncStats, setSyncStats] = useState({});
  const [conflictStats, setConflictStats] = useState({});
  const [networkInfo, setNetworkInfo] = useState({});
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);
  const [wifiOnlySync, setWifiOnlySync] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();

    // Subscribe to sync events
    const unsubscribeSync = SyncService.addListener((event) => {
      console.log('[SyncSettings] Sync event:', event);
      loadAllData();
    });

    // Subscribe to network events
    const unsubscribeNetwork = NetworkMonitor.addListener(() => {
      loadNetworkInfo();
    });

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
    };
  }, []);

  const loadAllData = async () => {
    try {
      const [status, pending, history, stats, conflicts, bgSettings] = await Promise.all([
        Promise.resolve(SyncService.getSyncStatus()),
        SyncService.getPendingCount(),
        Promise.resolve(SyncService.getSyncHistory(10)),
        Promise.resolve(SyncService.getStatistics()),
        Promise.resolve(ConflictResolver.getStatistics()),
        Promise.resolve(BackgroundSync.getSettings()),
      ]);

      setSyncStatus(status);
      setPendingCount(pending);
      setSyncHistory(history);
      setSyncStats(stats);
      setConflictStats(conflicts);
      setWifiOnlySync(bgSettings.WIFI_ONLY);
      loadNetworkInfo();

      // Check if background sync is registered
      const isRegistered = await BackgroundSync.isTaskRegistered();
      setBackgroundSyncEnabled(isRegistered);
    } catch (error) {
      console.error('[SyncSettings] Failed to load data:', error);
    }
  };

  const loadNetworkInfo = () => {
    const info = NetworkMonitor.getConnectionInfo();
    setNetworkInfo(info);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleBackgroundSyncToggle = async (value) => {
    try {
      if (value) {
        await BackgroundSync.register();
      } else {
        await BackgroundSync.unregister();
      }
      setBackgroundSyncEnabled(value);
    } catch (error) {
      console.error('[SyncSettings] Failed to toggle background sync:', error);
    }
  };

  const handleWifiOnlyToggle = async (value) => {
    try {
      await BackgroundSync.updateSettings({ WIFI_ONLY: value });
      setWifiOnlySync(value);
    } catch (error) {
      console.error('[SyncSettings] Failed to update WiFi setting:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <SyncStatusIndicator />

        {/* Pending Items Counter - Task 5.3 */}
        {pendingCount.total > 0 && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>
              {pendingCount.total} item{pendingCount.total > 1 ? 's' : ''} to sync
            </Text>
            <View style={styles.pendingBreakdown}>
              {Object.entries(pendingCount.byType).map(([type, count]) =>
                count > 0 ? (
                  <Text key={type} style={styles.pendingType}>
                    {type}: {count}
                  </Text>
                ) : null
              )}
            </View>
          </View>
        )}

        {/* Manual Sync Button - Task 5.1 */}
        <View style={styles.syncButtonContainer}>
          <SyncButton
            onSyncComplete={() => loadAllData()}
            style={styles.syncButton}
          />
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Background Sync</Text>
            <Text style={styles.settingDescription}>
              Automatically sync when app is in background
            </Text>
          </View>
          <Switch
            value={backgroundSyncEnabled}
            onValueChange={handleBackgroundSyncToggle}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>WiFi Only</Text>
            <Text style={styles.settingDescription}>
              Only sync when connected to WiFi
            </Text>
          </View>
          <Switch
            value={wifiOnlySync}
            onValueChange={handleWifiOnlyToggle}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Connection</Text>
          <Text style={styles.infoValue}>
            {networkInfo.isConnected
              ? `${networkInfo.connectionType} ${networkInfo.isWiFi ? '(WiFi)' : '(Cellular)'}`
              : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{syncStats.totalSyncs || 0}</Text>
            <Text style={styles.statLabel}>Total Syncs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statSuccess]}>
              {syncStats.successfulSyncs || 0}
            </Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statFailed]}>
              {syncStats.failedSyncs || 0}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {syncStats.avgDuration ? formatDuration(syncStats.avgDuration) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>

        {/* Conflict Statistics */}
        {conflictStats.total > 0 && (
          <View style={styles.conflictCard}>
            <Text style={styles.conflictTitle}>Conflicts Resolved</Text>
            <Text style={styles.conflictText}>
              Total: {conflictStats.total} | Local: {conflictStats.localWins} | Remote:{' '}
              {conflictStats.remoteWins}
            </Text>
          </View>
        )}
      </View>

      {/* Sync History - Task 5.6 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync History</Text>

        {syncHistory.length === 0 ? (
          <Text style={styles.emptyText}>No sync history yet</Text>
        ) : (
          syncHistory.map((record, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View
                  style={[
                    styles.historyStatus,
                    { backgroundColor: record.success ? '#4CAF50' : '#F44336' },
                  ]}
                />
                <Text style={styles.historyTime}>
                  {formatTimestamp(record.timestamp)}
                </Text>
                <Text style={styles.historyDuration}>
                  {formatDuration(record.duration)}
                </Text>
              </View>

              <View style={styles.historyDetails}>
                {record.success ? (
                  <Text style={styles.historyText}>
                    Synced {record.syncedCount} / {record.pendingCount} items
                  </Text>
                ) : (
                  <Text style={[styles.historyText, styles.errorText]}>
                    {record.error || 'Sync failed'}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  pendingBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pendingType: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  syncButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  syncButton: {
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statSuccess: {
    color: '#4CAF50',
  },
  statFailed: {
    color: '#F44336',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  conflictCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  conflictText: {
    fontSize: 12,
    color: '#666',
  },
  historyItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  historyTime: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  historyDuration: {
    fontSize: 12,
    color: '#999',
  },
  historyDetails: {
    marginLeft: 16,
  },
  historyText: {
    fontSize: 13,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 24,
  },
  bottomPadding: {
    height: 24,
  },
});

export default SyncSettings;
