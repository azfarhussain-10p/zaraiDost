// Sync Settings Screen
// Story 1.6: Network Status and Sync Monitoring
// Configure sync preferences including WiFi-only mode

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getSyncPreferences,
  updateSyncPreferences,
  resetSyncPreferences,
} from '../../database/repositories/SyncPreferencesRepository';
import { SYNC_FREQUENCY } from '../../constants/SyncConstants';

const SyncSettings = ({ navigation }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getSyncPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('[SyncSettings] Failed to load preferences:', error);
      Alert.alert('Error', 'Failed to load sync settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWiFiOnly = async (value) => {
    try {
      setSaving(true);
      await updateSyncPreferences({ wifi_only_mode: value });
      setPreferences((prev) => ({ ...prev, wifiOnlyMode: value }));
    } catch (error) {
      console.error('[SyncSettings] Failed to update WiFi-only mode:', error);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBackgroundSync = async (value) => {
    try {
      setSaving(true);
      await updateSyncPreferences({ background_sync_enabled: value });
      setPreferences((prev) => ({ ...prev, backgroundSyncEnabled: value }));
    } catch (error) {
      console.error('[SyncSettings] Failed to update background sync:', error);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutoImageUpload = async (value) => {
    try {
      setSaving(true);
      await updateSyncPreferences({ auto_image_upload: value });
      setPreferences((prev) => ({ ...prev, autoImageUpload: value }));
    } catch (error) {
      console.error('[SyncSettings] Failed to update auto image upload:', error);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLowBatterySkip = async (value) => {
    try {
      setSaving(true);
      await updateSyncPreferences({ low_battery_skip_sync: value });
      setPreferences((prev) => ({ ...prev, lowBatterySkipSync: value }));
    } catch (error) {
      console.error('[SyncSettings] Failed to update low battery skip:', error);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFrequencyChange = (hours) => {
    Alert.alert(
      'Change Sync Frequency',
      `Set sync frequency to ${getSyncFrequencyLabel(hours)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSaving(true);
              await updateSyncPreferences({ sync_frequency_hours: hours });
              setPreferences((prev) => ({ ...prev, syncFrequencyHours: hours }));
            } catch (error) {
              console.error('[SyncSettings] Failed to update frequency:', error);
              Alert.alert('Error', 'Failed to update setting');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all sync settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const defaults = await resetSyncPreferences();
              setPreferences(defaults);
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('[SyncSettings] Failed to reset settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleClearSyncHistory = () => {
    Alert.alert(
      'Clear Sync History',
      'This will delete all sync history records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear sync history
            Alert.alert('Info', 'Sync history clearing will be implemented');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Connection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>WiFi-Only Sync</Text>
            <Text style={styles.settingDescription}>
              Only sync when connected to WiFi to save cellular data
            </Text>
          </View>
          <Switch
            value={preferences.wifiOnlyMode}
            onValueChange={handleToggleWiFiOnly}
            disabled={saving}
            trackColor={{ false: '#d1d5db', true: '#60a5fa' }}
            thumbColor={preferences.wifiOnlyMode ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Automatic Sync Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic Sync</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Background Sync</Text>
            <Text style={styles.settingDescription}>
              Automatically sync in the background
            </Text>
          </View>
          <Switch
            value={preferences.backgroundSyncEnabled}
            onValueChange={handleToggleBackgroundSync}
            disabled={saving}
            trackColor={{ false: '#d1d5db', true: '#60a5fa' }}
            thumbColor={preferences.backgroundSyncEnabled ? '#3b82f6' : '#f3f4f6'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sync Frequency</Text>
            <Text style={styles.settingDescription}>
              Current: {getSyncFrequencyLabel(preferences.syncFrequencyHours)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>

        <View style={styles.frequencyOptions}>
          {[
            SYNC_FREQUENCY.EVERY_6_HOURS,
            SYNC_FREQUENCY.EVERY_12_HOURS,
            SYNC_FREQUENCY.EVERY_24_HOURS,
            SYNC_FREQUENCY.MANUAL,
          ].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyOption,
                preferences.syncFrequencyHours === freq && styles.frequencyOptionActive,
              ]}
              onPress={() => handleSyncFrequencyChange(freq)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.frequencyOptionText,
                  preferences.syncFrequencyHours === freq && styles.frequencyOptionTextActive,
                ]}
              >
                {getSyncFrequencyLabel(freq)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upload Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Image Upload</Text>
            <Text style={styles.settingDescription}>
              Automatically upload images when syncing
            </Text>
          </View>
          <Switch
            value={preferences.autoImageUpload}
            onValueChange={handleToggleAutoImageUpload}
            disabled={saving}
            trackColor={{ false: '#d1d5db', true: '#60a5fa' }}
            thumbColor={preferences.autoImageUpload ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Battery Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Battery Optimization</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Skip Sync on Low Battery</Text>
            <Text style={styles.settingDescription}>
              Don't sync when battery is below 20%
            </Text>
          </View>
          <Switch
            value={preferences.lowBatterySkipSync}
            onValueChange={handleToggleLowBatterySkip}
            disabled={saving}
            trackColor={{ false: '#d1d5db', true: '#60a5fa' }}
            thumbColor={preferences.lowBatterySkipSync ? '#3b82f6' : '#f3f4f6'}
          />
        </View>
      </View>

      {/* Advanced Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>

        <TouchableOpacity style={styles.actionRow} onPress={handleClearSyncHistory}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
          <Text style={styles.actionText}>Clear Sync History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleResetSettings}>
          <Ionicons name="refresh-outline" size={24} color="#f97316" />
          <Text style={styles.actionText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </ScrollView>
  );
};

function getSyncFrequencyLabel(hours) {
  switch (hours) {
    case SYNC_FREQUENCY.EVERY_6_HOURS:
      return 'Every 6 hours';
    case SYNC_FREQUENCY.EVERY_12_HOURS:
      return 'Every 12 hours';
    case SYNC_FREQUENCY.EVERY_24_HOURS:
      return 'Every 24 hours';
    case SYNC_FREQUENCY.MANUAL:
      return 'Manual only';
    default:
      return `Every ${hours} hours`;
  }
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
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  frequencyOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  savingOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SyncSettings;

