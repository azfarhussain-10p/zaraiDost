// SyncStatusBadge.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 5 (Sync status indicator component)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SYNC_STATUS } from '../../constants/ImageConstants';

/**
 * SyncStatusBadge
 *
 * Badge component for displaying sync status with icon and label.
 * Shows different colors and icons based on sync status.
 *
 * Props:
 * - status: Sync status ('pending', 'uploading', 'synced', 'failed', 'processing')
 * - compact: Whether to show compact version (icon only)
 * - size: Badge size ('small', 'medium', 'large')
 */
const SyncStatusBadge = ({ status = 'pending', compact = false, size = 'medium' }) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case SYNC_STATUS.PENDING:
        return {
          icon: 'time-outline',
          label: 'Pending',
          color: '#f59e0b',
          backgroundColor: '#fef3c7',
        };
      case SYNC_STATUS.UPLOADING:
        return {
          icon: 'cloud-upload-outline',
          label: 'Uploading',
          color: '#3b82f6',
          backgroundColor: '#dbeafe',
        };
      case SYNC_STATUS.SYNCED:
        return {
          icon: 'checkmark-circle',
          label: 'Synced',
          color: '#10b981',
          backgroundColor: '#d1fae5',
        };
      case SYNC_STATUS.FAILED:
        return {
          icon: 'alert-circle',
          label: 'Failed',
          color: '#ef4444',
          backgroundColor: '#fee2e2',
        };
      case SYNC_STATUS.PROCESSING:
        return {
          icon: 'refresh-outline',
          label: 'Processing',
          color: '#8b5cf6',
          backgroundColor: '#ede9fe',
        };
      default:
        return {
          icon: 'help-circle-outline',
          label: 'Unknown',
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
        };
    }
  };

  // Get size configuration
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 12,
          fontSize: 10,
          padding: 4,
          paddingHorizontal: 6,
        };
      case 'large':
        return {
          iconSize: 20,
          fontSize: 14,
          padding: 8,
          paddingHorizontal: 12,
        };
      case 'medium':
      default:
        return {
          iconSize: 16,
          fontSize: 12,
          padding: 6,
          paddingHorizontal: 10,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();

  if (compact) {
    // Compact version: Icon only
    return (
      <View
        style={[
          styles.compactBadge,
          {
            backgroundColor: statusConfig.backgroundColor,
            padding: sizeConfig.padding,
          },
        ]}
      >
        <Ionicons name={statusConfig.icon} size={sizeConfig.iconSize} color={statusConfig.color} />
      </View>
    );
  }

  // Full version: Icon + Label
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusConfig.backgroundColor,
          paddingVertical: sizeConfig.padding,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
      ]}
    >
      <Ionicons
        name={statusConfig.icon}
        size={sizeConfig.iconSize}
        color={statusConfig.color}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          {
            color: statusConfig.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {statusConfig.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  compactBadge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
});

export default SyncStatusBadge;
