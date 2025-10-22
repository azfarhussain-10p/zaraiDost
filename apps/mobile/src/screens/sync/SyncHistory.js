// Sync History Screen
// Story 1.6: Network Status and Sync Monitoring
// Historical log of sync operations

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllSyncHistory,
  getSyncStatistics,
} from '../../database/repositories/SyncHistoryRepository';
import { formatBytes } from '../../services/monitoring/DataUsageTracker';
import { SYNC_OPERATION_STATUS } from '../../constants/SyncConstants';

const SyncHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const [historyData, stats] = await Promise.all([
        getAllSyncHistory(30),
        getSyncStatistics(),
      ]);

      setHistory(historyData);
      setStatistics(stats);
    } catch (error) {
      console.error('[SyncHistory] Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory(false);
  };

  const renderHistoryItem = ({ item }) => {
    const startDate = new Date(item.sync_start_time);
    const status = item.sync_status;
    const isSuccess = status === SYNC_OPERATION_STATUS.SUCCESS;
    const isPartial = status === SYNC_OPERATION_STATUS.PARTIAL;
    const isFailed = status === SYNC_OPERATION_STATUS.FAILED;

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.statusRow}>
            <Ionicons
              name={
                isSuccess
                  ? 'checkmark-circle'
                  : isPartial
                    ? 'warning'
                    : 'close-circle'
              }
              size={24}
              color={isSuccess ? '#22c55e' : isPartial ? '#eab308' : '#ef4444'}
            />
            <Text style={styles.dateText}>{startDate.toLocaleString()}</Text>
          </View>
          <View style={styles.connectionBadge}>
            <Ionicons
              name={item.connection_type === 'wifi' ? 'wifi' : 'cellular'}
              size={14}
              color="#6b7280"
            />
            <Text style={styles.connectionText}>
              {item.connection_type === 'wifi' ? 'WiFi' : 'Cellular'}
            </Text>
          </View>
        </View>

        <View style={styles.historyStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {(item.sync_duration_ms / 1000).toFixed(1)}s
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Records</Text>
            <Text style={styles.statValue}>{item.total_records_synced}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Upload</Text>
            <Text style={styles.statValue}>{formatBytes(item.data_uploaded_bytes)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Download</Text>
            <Text style={styles.statValue}>{formatBytes(item.data_downloaded_bytes)}</Text>
          </View>
        </View>

        {item.error_messages && item.error_messages.length > 0 && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>{item.error_messages[0]}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Statistics Header */}
      {statistics && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{statistics.totalSyncs}</Text>
              <Text style={styles.statsLabel}>Total Syncs</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: '#22c55e' }]}>
                {statistics.successfulSyncs}
              </Text>
              <Text style={styles.statsLabel}>Successful</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsValue, { color: '#ef4444' }]}>
                {statistics.failedSyncs}
              </Text>
              <Text style={styles.statsLabel}>Failed</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>
                {(statistics.averageDurationMs / 1000).toFixed(1)}s
              </Text>
              <Text style={styles.statsLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No sync history yet</Text>
          </View>
        }
        contentContainerStyle={history.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  errorSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default SyncHistory;

