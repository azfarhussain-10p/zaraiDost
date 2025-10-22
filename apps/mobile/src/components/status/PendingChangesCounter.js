// Pending Changes Counter Component
// Story 1.6: Network Status and Sync Monitoring
// Badge showing number of items pending sync

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPendingChanges } from '../../services/monitoring/SyncStateManager';

/**
 * Pending Changes Counter Component
 * Shows badge with number of pending changes
 * 
 * @param {Function} onPress - Callback when counter is tapped
 * @param {number} refreshInterval - Auto-refresh interval in ms (default: 30000)
 * @param {string} variant - Display variant: 'badge', 'full', 'minimal' (default: 'badge')
 */
const PendingChangesCounter = ({
  onPress,
  refreshInterval = 30000,
  variant = 'badge',
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial count
    loadPendingCount();

    // Set up auto-refresh
    const intervalId = setInterval(() => {
      loadPendingCount();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  const loadPendingCount = async () => {
    try {
      const changes = await getPendingChanges();
      setPendingCount(changes.total);
      setError(null);
    } catch (err) {
      console.error('[PendingChangesCounter] Failed to load pending count:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && pendingCount === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6b7280" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
        </View>
      );
    }

    if (pendingCount === 0) {
      // Don't show anything if no pending changes
      if (variant === 'badge') {
        return null;
      }

      // For full variant, show "All synced" message
      if (variant === 'full') {
        return (
          <View style={styles.syncedContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.syncedText}>All synced</Text>
          </View>
        );
      }
    }

    switch (variant) {
      case 'full':
        return (
          <View style={styles.fullContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatCount(pendingCount)}</Text>
            </View>
            <Text style={styles.label}>
              {pendingCount === 1 ? 'item to sync' : 'items to sync'}
            </Text>
          </View>
        );

      case 'minimal':
        return (
          <View style={styles.minimalContainer}>
            <Ionicons name="cloud-upload-outline" size={20} color="#f97316" />
            <Text style={styles.minimalText}>{pendingCount}</Text>
          </View>
        );

      case 'badge':
      default:
        return (
          <View style={styles.badgeOnly}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatCount(pendingCount)}</Text>
            </View>
          </View>
        );
    }
  };

  const content = renderContent();

  if (!content) {
    return null;
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

/**
 * Format count for display (show 9+ for counts > 9)
 * @param {number} count - Count to format
 * @returns {string} Formatted count
 */
function formatCount(count) {
  if (count > 99) {
    return '99+';
  }
  if (count > 9) {
    return '9+';
  }
  return count.toString();
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 8,
  },
  errorContainer: {
    padding: 8,
  },
  syncedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  syncedText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
  },
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  minimalText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  badgeOnly: {
    padding: 4,
  },
  badge: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
  },
});

export default PendingChangesCounter;

