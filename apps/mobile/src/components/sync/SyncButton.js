// Sync Button Component
// Story 1.2: Background Synchronization Service
// Implements: Task 5.1 (Manual sync trigger button)

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SyncService from '../../services/sync/SyncService';
import NetworkMonitor from '../../services/sync/NetworkMonitor';

/**
 * SyncButton Component
 * Allows user to manually trigger sync operation
 */
const SyncButton = ({ style, onSyncComplete, variant = 'primary' }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    // Check network connection
    if (!NetworkMonitor.isNetworkAvailable()) {
      Alert.alert(
        'No Connection',
        'Please connect to the internet to sync your data.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSyncing(true);

    try {
      // Get pending count before sync
      const pendingBefore = await SyncService.getPendingCount();

      if (pendingBefore.total === 0) {
        Alert.alert(
          'Already Synced',
          'All your data is already synced with the server.',
          [{ text: 'OK' }]
        );
        setIsSyncing(false);
        return;
      }

      // Trigger manual sync with high priority
      const result = await SyncService.triggerManualSync();

      if (result.success) {
        const message = result.totalSynced > 0
          ? `Successfully synced ${result.totalSynced} item${result.totalSynced > 1 ? 's' : ''}.`
          : 'All data is up to date.';

        Alert.alert('Sync Complete', message, [{ text: 'OK' }]);

        // Callback for parent component
        if (onSyncComplete) {
          onSyncComplete(result);
        }
      } else {
        Alert.alert(
          'Sync Failed',
          result.error || 'An error occurred while syncing. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[SyncButton] Sync error:', error);
      Alert.alert(
        'Sync Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const getButtonStyle = () => {
    if (variant === 'secondary') {
      return [styles.button, styles.buttonSecondary, style];
    }
    if (variant === 'outline') {
      return [styles.button, styles.buttonOutline, style];
    }
    return [styles.button, styles.buttonPrimary, style];
  };

  const getTextStyle = () => {
    if (variant === 'outline') {
      return [styles.buttonText, styles.buttonTextOutline];
    }
    return styles.buttonText;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleSync}
      disabled={isSyncing}
      activeOpacity={0.8}
    >
      {isSyncing ? (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
          <Text style={getTextStyle()}>Syncing...</Text>
        </>
      ) : (
        <Text style={getTextStyle()}>↻ Sync Now</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#4CAF50',
  },
  spinner: {
    marginRight: 8,
  },
});

export default SyncButton;
