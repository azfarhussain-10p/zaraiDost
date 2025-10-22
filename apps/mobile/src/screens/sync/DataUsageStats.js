// Data Usage Stats Screen
// Story 1.6: Network Status and Sync Monitoring
// Display bandwidth usage statistics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getComprehensiveUsageStats,
  projectMonthlyUsage,
} from '../../services/monitoring/DataUsageTracker';

const DataUsageStats = () => {
  const [stats, setStats] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const usageStats = await getComprehensiveUsageStats();
      setStats(usageStats);

      if (usageStats.month) {
        const proj = projectMonthlyUsage(usageStats.month);
        setProjection(proj);
      }
    } catch (error) {
      console.error('[DataUsageStats] Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Today's Usage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Usage</Text>
        <View style={styles.usageBreakdown}>
          <UsageRow
            icon="wifi"
            label="WiFi"
            value={stats.today.wifi.totalFormatted}
            color="#22c55e"
          />
          <UsageRow
            icon="cellular"
            label="Cellular"
            value={stats.today.cellular.totalFormatted}
            color="#f97316"
          />
          <View style={styles.divider} />
          <UsageRow
            icon="stats-chart"
            label="Total"
            value={stats.today.totalFormatted}
            color="#3b82f6"
            bold
          />
        </View>
      </View>

      {/* This Week */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <View style={styles.usageBreakdown}>
          <UsageRow
            icon="wifi"
            label="WiFi"
            value={stats.week.wifi.totalFormatted}
            color="#22c55e"
          />
          <UsageRow
            icon="cellular"
            label="Cellular"
            value={stats.week.cellular.totalFormatted}
            color="#f97316"
          />
          <View style={styles.divider} />
          <UsageRow
            icon="stats-chart"
            label="Total"
            value={stats.week.totalFormatted}
            color="#3b82f6"
            bold
          />
        </View>
      </View>

      {/* This Month */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Month</Text>
        <View style={styles.usageBreakdown}>
          <UsageRow
            icon="wifi"
            label="WiFi"
            value={stats.month.wifi.totalFormatted}
            color="#22c55e"
          />
          <UsageRow
            icon="cellular"
            label="Cellular"
            value={stats.month.cellular.totalFormatted}
            color="#f97316"
          />
          <View style={styles.divider} />
          <UsageRow
            icon="stats-chart"
            label="Total"
            value={stats.month.totalFormatted}
            color="#3b82f6"
            bold
          />
        </View>

        {stats.month.estimatedCost && (
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Estimated cellular cost:</Text>
            <Text style={styles.costValue}>{stats.month.estimatedCost}</Text>
          </View>
        )}
      </View>

      {/* Monthly Projection */}
      {projection && projection.daysRemaining > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Projection</Text>
          <View style={styles.projectionInfo}>
            <Text style={styles.projectionText}>
              Based on current usage, you're projected to use{' '}
              <Text style={styles.projectionValue}>{projection.projectedFormatted}</Text> this
              month.
            </Text>
            <Text style={styles.projectionSubtext}>
              {projection.daysRemaining} days remaining in month
            </Text>
          </View>

          {projection.likelyToExceedLimit && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#f97316" />
              <Text style={styles.warningText}>
                You may exceed the recommended monthly limit. Consider enabling WiFi-only sync.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Warnings */}
      {stats.warnings && stats.warnings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Warnings</Text>
          {stats.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={warning.level === 'critical' ? '#ef4444' : '#f97316'}
              />
              <Text style={styles.warningItemText}>{warning.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* All-Time Usage */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>All-Time Usage</Text>
        <View style={styles.usageBreakdown}>
          <UsageRow
            icon="wifi"
            label="WiFi"
            value={stats.allTime.wifiFormatted}
            color="#22c55e"
          />
          <UsageRow
            icon="cellular"
            label="Cellular"
            value={stats.allTime.cellularFormatted}
            color="#f97316"
          />
          <View style={styles.divider} />
          <UsageRow
            icon="stats-chart"
            label="Total"
            value={stats.allTime.totalFormatted}
            color="#3b82f6"
            bold
          />
        </View>
      </View>
    </ScrollView>
  );
};

const UsageRow = ({ icon, label, value, color, bold = false }) => (
  <View style={styles.usageRow}>
    <View style={styles.usageLabel}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.usageLabelText, bold && styles.usageLabelTextBold]}>{label}</Text>
    </View>
    <Text style={[styles.usageValue, { color }, bold && styles.usageValueBold]}>{value}</Text>
  </View>
);

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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  usageBreakdown: {
    gap: 8,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  usageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageLabelText: {
    fontSize: 16,
    color: '#374151',
  },
  usageLabelTextBold: {
    fontWeight: '600',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  usageValueBold: {
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  costRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  projectionInfo: {
    paddingVertical: 8,
  },
  projectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  projectionValue: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  projectionSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#c2410c',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 8,
  },
  warningItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default DataUsageStats;

