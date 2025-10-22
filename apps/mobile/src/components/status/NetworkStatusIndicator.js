// Network Status Indicator Component
// Story 1.6: Network Status and Sync Monitoring
// Persistent indicator showing online/offline status

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentConnectionStatus,
  subscribeToConnectionChanges,
} from '../../services/monitoring/NetworkQualityMonitor';
import { CONNECTION_STATUS } from '../../constants/SyncConstants';

/**
 * Network Status Indicator Component
 * Shows connection type and status with color-coded badge
 * 
 * @param {Function} onPress - Optional callback when indicator is tapped
 * @param {boolean} showLabel - Whether to show text label (default: true)
 * @param {string} size - Size variant: 'small', 'medium', 'large' (default: 'medium')
 */
const NetworkStatusIndicator = ({ onPress, showLabel = true, size = 'medium' }) => {
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.UNKNOWN);

  useEffect(() => {
    // Get initial status
    const initialStatus = getCurrentConnectionStatus();
    setConnectionStatus(initialStatus);

    // Subscribe to status changes
    const unsubscribe = subscribeToConnectionChanges((newStatus) => {
      setConnectionStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getIconName = () => {
    if (connectionStatus.type === 'wifi') {
      return 'wifi';
    } else if (connectionStatus.type === 'cellular') {
      return 'cellular';
    } else if (connectionStatus.type === 'none') {
      return 'wifi-off';
    } else {
      return 'help-circle';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      case 'medium':
      default:
        return 24;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 12;
    }
  };

  const content = (
    <View style={[styles.container, styles[`container_${size}`]]}>
      <View style={[styles.badge, { backgroundColor: connectionStatus.color }]}>
        <Ionicons name={getIconName()} size={getIconSize()} color="#fff" />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: getTextSize() }]}>
          {connectionStatus.label}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  container_small: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  container_medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  container_large: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: 6,
    color: '#374151',
    fontWeight: '600',
  },
});

export default NetworkStatusIndicator;

