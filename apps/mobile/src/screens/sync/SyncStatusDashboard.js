// Sync Status Dashboard Screen
// Story 1.6: Network Status and Sync Monitoring
// Main sync state overview with pending changes and status

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSyncSummary } from '../../services/monitoring/SyncStateManager';
import { getCurrentConnectionStatus } from '../../services/monitoring/NetworkQualityMonitor';
import NetworkStatusIndicator from '../../components/status/NetworkStatusIndicator';
import PendingChangesCounter from '../../components/status/PendingChangesCounter';
import LastSyncLabel from '../../components/status/LastSyncLabel';
import { SYNC_STATE, SYNC_ENTITIES } from '../../constants/SyncConstants';

/**
 * Sync Status Dashboard Screen
 * Comprehensive view of sync state and pending changes
 */
const SyncStatusDashboard = ({ navigation }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSyncSummary();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadSyncSummary(false);
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const loadSyncSummary = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await getSyncSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error('[SyncStatusDashboard] Failed to load summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSyncSummary(false);
  };

  const handleManualSync = () => {
    console.log('[SyncStatusDashboard] Manual sync triggered');
    // TODO: Integrate with actual sync service from Story 1.2
    alert('Manual sync will be implemented when integrating with SyncService');
  };

  const handleNavigateToHistory = () => {
    navigation.navigate('SyncHistory');
  };

  const handleNavigateToDataUsage = () => {
    navigation.navigate('DataUsageStats');
  };

  const handleNavigateToSettings = () => {
    navigation.navigate('SyncSettings');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading sync status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load sync status</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadSyncSummary()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Network Status Header */}
      <View style={styles.header}>
        <NetworkStatusIndicator showLabel size="medium" />
        <TouchableOpacity onPress={handleNavigateToSettings}>
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Sync Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Sync Status</Text>
          {summary.status === SYNC_STATE.SYNCING && (
            <ActivityIndicator size="small" color="#3b82f6" />
          )}
        </View>

        <View style={styles.statusRow}>
          <LastSyncLabel variant="full" refreshInterval={60000} />
        </View>

        {summary.hasPendingChanges && (
          <View style={styles.pendingSection}>
            <PendingChangesCounter variant="full" refreshInterval={30000} />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.syncButton,
            summary.status === SYNC_STATE.SYNCING && styles.syncButtonDisabled,
          ]}
          onPress={handleManualSync}
          disabled={summary.status === SYNC_STATE.SYNCING}
        >
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            {summary.status === SYNC_STATE.SYNCING ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending Changes by Entity */}
      {summary.hasPendingChanges && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending Changes by Type</Text>

          {Object.entries(summary.pendingByEntity).map(([entity, counts]) => {
            const total = counts.new + counts.updated + counts.deleted;
            if (total === 0) return null;

            return (
              <View key={entity} style={styles.entityRow}>
                <View style={styles.entityInfo}>
                  <Ionicons name={getEntityIcon(entity)} size={20} color="#6b7280" />
                  <Text style={styles.entityName}>{formatEntityName(entity)}</Text>
                </View>
                <View style={styles.entityCounts}>
                  {counts.new > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>+{counts.new}</Text>
                    </View>
                  )}
                  {counts.updated > 0 && (
                    <View style={[styles.countBadge, styles.countBadgeWarning]}>
                      <Text style={styles.countBadgeText}>~{counts.updated}</Text>
                    </View>
                  )}
                  {counts.deleted > 0 && (
                    <View style={[styles.countBadge, styles.countBadgeDanger]}>
                      <Text style={styles.countBadgeText}>-{counts.deleted}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionRow} onPress={handleNavigateToHistory}>
          <Ionicons name="time-outline" size={24} color="#6b7280" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Sync History</Text>
            <Text style={styles.actionSubtitle}>View past sync operations</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleNavigateToDataUsage}>
          <Ionicons name="stats-chart-outline" size={24} color="#6b7280" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Data Usage</Text>
            <Text style={styles.actionSubtitle}>Track bandwidth consumption</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleNavigateToSettings}>
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Sync Settings</Text>
            <Text style={styles.actionSubtitle}>Configure sync preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Sync Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>WiFi-Only Mode:</Text>
          <Text style={styles.infoValue}>{summary.wifiOnlyMode ? 'Enabled' : 'Disabled'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Background Sync:</Text>
          <Text style={styles.infoValue}>
            {summary.backgroundSyncEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        {summary.nextScheduledSync && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Sync:</Text>
            <Text style={styles.infoValue}>{summary.nextScheduledSyncFormatted}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Helper functions
function getEntityIcon(entity) {
  const icons = {
    [SYNC_ENTITIES.FARMERS]: 'person-outline',
    [SYNC_ENTITIES.FIELDS]: 'grid-outline',
    [SYNC_ENTITIES.CROPS]: 'leaf-outline',
    [SYNC_ENTITIES.QUERIES]: 'chatbubble-outline',
    [SYNC_ENTITIES.IMAGES]: 'image-outline',
  };
  return icons[entity] || 'document-outline';
}

function formatEntityName(entity) {
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusRow: {
    marginBottom: 16,
  },
  pendingSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entityName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  entityCounts: {
    flexDirection: 'row',
    gap: 6,
  },
  countBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countBadgeWarning: {
    backgroundColor: '#eab308',
  },
  countBadgeDanger: {
    backgroundColor: '#ef4444',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default SyncStatusDashboard;

