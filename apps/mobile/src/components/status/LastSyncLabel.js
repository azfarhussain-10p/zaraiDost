// Last Sync Label Component
// Story 1.6: Network Status and Sync Monitoring
// Displays human-readable last sync timestamp

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSyncStateMetadata } from '../../database/repositories/SyncStateMetadataRepository';
import { SYNC_STATE } from '../../constants/SyncConstants';

/**
 * Last Sync Label Component
 * Shows "Synced X minutes/hours ago" with icon
 * 
 * @param {number} refreshInterval - Auto-refresh interval in ms (default: 60000)
 * @param {string} variant - Display variant: 'full', 'compact' (default: 'full')
 * @param {string} iconPosition - Icon position: 'left', 'right', 'none' (default: 'left')
 */
const LastSyncLabel = ({
  refreshInterval = 60000,
  variant = 'full',
  iconPosition = 'left',
}) => {
  const [syncText, setSyncText] = useState('Loading...');
  const [syncStatus, setSyncStatus] = useState(SYNC_STATE.IDLE);
  const [iconName, setIconName] = useState('time-outline');
  const [iconColor, setIconColor] = useState('#6b7280');

  useEffect(() => {
    // Load initial state
    loadSyncState();

    // Set up auto-refresh
    const intervalId = setInterval(() => {
      loadSyncState();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  const loadSyncState = async () => {
    try {
      const metadata = await getSyncStateMetadata();

      // Update sync status
      setSyncStatus(metadata.currentStatus);

      // Update text based on status
      if (metadata.currentStatus === SYNC_STATE.SYNCING) {
        setSyncText('Syncing...');
        setIconName('sync-outline');
        setIconColor('#3b82f6');
        return;
      }

      if (metadata.currentStatus === SYNC_STATE.FAILED) {
        setSyncText('Sync failed');
        setIconName('alert-circle-outline');
        setIconColor('#ef4444');
        return;
      }

      if (!metadata.lastSuccessfulSync) {
        setSyncText('Not synced yet');
        setIconName('cloud-outline');
        setIconColor('#9ca3af');
        return;
      }

      // Calculate time since last sync
      const lastSync = new Date(metadata.lastSuccessfulSync);
      const now = new Date();
      const diffSeconds = Math.floor((now - lastSync) / 1000);

      const text = formatTimeSinceSync(diffSeconds);
      setSyncText(text);

      // Set icon based on how recent the sync was
      if (diffSeconds < 300) {
        // < 5 minutes
        setIconName('checkmark-circle');
        setIconColor('#22c55e');
      } else if (diffSeconds < 3600) {
        // < 1 hour
        setIconName('time-outline');
        setIconColor('#6b7280');
      } else {
        // > 1 hour
        setIconName('time-outline');
        setIconColor('#9ca3af');
      }
    } catch (error) {
      console.error('[LastSyncLabel] Failed to load sync state:', error);
      setSyncText('Error loading sync state');
      setIconName('alert-circle-outline');
      setIconColor('#ef4444');
    }
  };

  const formatTimeSinceSync = (seconds) => {
    if (seconds < 60) {
      return 'Synced just now';
    }

    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `Synced ${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }

    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `Synced ${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(seconds / 86400);
    return `Synced ${days} day${days > 1 ? 's' : ''} ago`;
  };

  const renderIcon = () => {
    if (iconPosition === 'none') {
      return null;
    }

    return <Ionicons name={iconName} size={variant === 'compact' ? 14 : 16} color={iconColor} />;
  };

  return (
    <View style={[styles.container, variant === 'compact' && styles.compactContainer]}>
      {iconPosition === 'left' && renderIcon()}
      <Text style={[styles.text, variant === 'compact' && styles.compactText]}>{syncText}</Text>
      {iconPosition === 'right' && renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactContainer: {
    gap: 4,
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
  },
  compactText: {
    fontSize: 12,
  },
});

export default LastSyncLabel;

