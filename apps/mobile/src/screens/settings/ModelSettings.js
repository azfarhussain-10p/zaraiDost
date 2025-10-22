// Model Settings Screen
// Story 1.3: Offline AI Model Storage
// Implements: Task 6 (Create model management UI)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ModelManager from '../../services/ai/ModelManager';
import InferenceCacheRepository from '../../database/repositories/InferenceCacheRepository';

/**
 * ModelSettings Screen
 * Implements: Task 6
 * AC4: Model version tracking UI
 */
const ModelSettings = () => {
  const [modelStatus, setModelStatus] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    loadModelInfo();

    const unsubscribe = ModelManager.addListener(event => {
      if (event.event === 'status_changed') {
        loadModelInfo();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadModelInfo = async () => {
    try {
      const status = ModelManager.getStatus();
      const storage = await ModelManager.getStorageUsage();
      const stats = await InferenceCacheRepository.getStatistics();

      setModelStatus(status);
      setStorageUsage(storage);
      setCacheStats(stats);
    } catch (error) {
      console.error('[ModelSettings] Load failed:', error);
    }
  };

  const handleDownloadModel = async () => {
    try {
      setLoading(true);
      setDownloadProgress(0);

      const result = await ModelManager.downloadModel(progress => {
        setDownloadProgress(progress.progress * 100);
      });

      if (result.success) {
        Alert.alert('Success', 'Model downloaded successfully!');
        await loadModelInfo();
      } else {
        Alert.alert('Error', `Download failed: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setDownloadProgress(0);
    }
  };

  const handleCheckUpdates = async () => {
    setLoading(true);
    const result = await ModelManager.checkForUpdates();
    setLoading(false);

    if (result.updateAvailable) {
      Alert.alert(
        'Update Available',
        `New version ${result.latestVersion} is available. Download now?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: handleUpdateModel },
        ]
      );
    } else {
      Alert.alert('Up to Date', 'You have the latest model version.');
    }
  };

  const handleUpdateModel = async () => {
    setLoading(true);
    const result = await ModelManager.updateModel(progress => {
      setDownloadProgress(progress.progress * 100);
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Model updated successfully!');
      await loadModelInfo();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDeleteModel = () => {
    Alert.alert(
      'Delete Model',
      'Are you sure? You will need to re-download the model.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await ModelManager.deleteModel();
            if (result.success) {
              Alert.alert('Success', 'Model deleted');
              await loadModelInfo();
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    await InferenceCacheRepository.clearAll();
    Alert.alert('Success', 'Cache cleared');
    await loadModelInfo();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Model Settings</Text>

      {/* Model Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Status</Text>
        <InfoRow label="Status" value={modelStatus?.status || 'Unknown'} />
        <InfoRow label="Version" value={modelStatus?.version || 'N/A'} />
        <InfoRow label="Size" value={modelStatus?.fileSizeMB ? `${modelStatus.fileSizeMB} MB` : 'N/A'} />
      </View>

      {/* Storage Usage */}
      {storageUsage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <InfoRow label="Used" value={`${storageUsage.usedMB} MB`} />
          <InfoRow label="Limit" value={`${storageUsage.limitMB} MB`} />
          <InfoRow label="Usage" value={`${storageUsage.percentUsed}%`} />
        </View>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inference Cache</Text>
          <InfoRow label="Cached Results" value={cacheStats.total_entries} />
          <InfoRow label="Avg Time" value={`${Math.round(cacheStats.avg_inference_time_ms)}ms`} />
        </View>
      )}

      {/* Download Progress */}
      {loading && downloadProgress > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Downloading... {Math.round(downloadProgress)}%</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <ActionButton
          title={modelStatus?.model ? "Update Model" : "Download Model"}
          onPress={modelStatus?.model ? handleCheckUpdates : handleDownloadModel}
          disabled={loading}
          primary
        />
        {modelStatus?.model && (
          <>
            <ActionButton
              title="Check for Updates"
              onPress={handleCheckUpdates}
              disabled={loading}
            />
            <ActionButton
              title="Delete Model"
              onPress={handleDeleteModel}
              disabled={loading}
              destructive
            />
          </>
        )}
        <ActionButton
          title="Clear Cache"
          onPress={handleClearCache}
          disabled={loading}
        />
      </View>

      {loading && !downloadProgress && (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      )}
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ActionButton = ({ title, onPress, disabled, primary, destructive }) => (
  <TouchableOpacity
    style={[
      styles.button,
      primary && styles.buttonPrimary,
      destructive && styles.buttonDestructive,
      disabled && styles.buttonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.buttonText, (primary || destructive) && styles.buttonTextWhite]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  buttonDestructive: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextWhite: {
    color: 'white',
  },
  progressContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default ModelSettings;
