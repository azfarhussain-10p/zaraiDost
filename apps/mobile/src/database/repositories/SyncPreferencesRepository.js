// Sync Preferences Repository
// Story 1.6: Network Status and Sync Monitoring
// Provides CRUD operations for sync_preferences table

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { DEFAULT_SYNC_PREFERENCES } from '../../constants/SyncConstants';
import { Platform } from 'react-native';

/**
 * Get sync preferences (returns default user preferences)
 * @param {string} userId - User ID (default: 'default_user')
 * @returns {Promise<Object>} Sync preferences
 */
export async function getSyncPreferences(userId = 'default_user') {
  if (Platform.OS === 'web') {
    console.log('[SyncPreferencesRepository] Web platform - returning defaults');
    return DEFAULT_SYNC_PREFERENCES;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_PREFERENCES} 
       WHERE user_id = ? OR id = 1 
       ORDER BY id ASC 
       LIMIT 1`,
      [userId]
    );

    if (result) {
      return parsePreferencesRecord(result);
    }

    // Return defaults if no record exists
    return DEFAULT_SYNC_PREFERENCES;
  } catch (error) {
    console.error('[SyncPreferencesRepository] GetSyncPreferences failed:', error);
    throw error;
  }
}

/**
 * Update sync preferences
 * @param {Object} preferences - Preferences to update
 * @param {string} userId - User ID (default: 'default_user')
 * @returns {Promise<Object>} Updated preferences
 */
export async function updateSyncPreferences(preferences, userId = 'default_user') {
  if (Platform.OS === 'web') {
    console.log('[SyncPreferencesRepository] Web platform - returning updated prefs');
    return { ...DEFAULT_SYNC_PREFERENCES, ...preferences };
  }

  try {
    const db = await getDatabase();
    const {
      wifi_only_mode,
      background_sync_enabled,
      sync_frequency_hours,
      auto_image_upload,
      low_battery_skip_sync,
    } = preferences;

    // First, check if preferences exist
    const existing = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_PREFERENCES} WHERE user_id = ? OR id = 1 LIMIT 1`,
      [userId]
    );

    if (existing) {
      // Update existing preferences
      await db.runAsync(
        `UPDATE ${TABLES.SYNC_PREFERENCES} 
         SET 
           wifi_only_mode = COALESCE(?, wifi_only_mode),
           background_sync_enabled = COALESCE(?, background_sync_enabled),
           sync_frequency_hours = COALESCE(?, sync_frequency_hours),
           auto_image_upload = COALESCE(?, auto_image_upload),
           low_battery_skip_sync = COALESCE(?, low_battery_skip_sync),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          wifi_only_mode !== undefined ? (wifi_only_mode ? 1 : 0) : null,
          background_sync_enabled !== undefined ? (background_sync_enabled ? 1 : 0) : null,
          sync_frequency_hours !== undefined ? sync_frequency_hours : null,
          auto_image_upload !== undefined ? (auto_image_upload ? 1 : 0) : null,
          low_battery_skip_sync !== undefined ? (low_battery_skip_sync ? 1 : 0) : null,
          existing.id,
        ]
      );
    } else {
      // Insert new preferences
      await db.runAsync(
        `INSERT INTO ${TABLES.SYNC_PREFERENCES} (
          user_id, wifi_only_mode, background_sync_enabled, sync_frequency_hours,
          auto_image_upload, low_battery_skip_sync
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          wifi_only_mode ? 1 : 0,
          background_sync_enabled !== undefined ? (background_sync_enabled ? 1 : 0) : 1,
          sync_frequency_hours !== undefined ? sync_frequency_hours : 6,
          auto_image_upload !== undefined ? (auto_image_upload ? 1 : 0) : 1,
          low_battery_skip_sync !== undefined ? (low_battery_skip_sync ? 1 : 0) : 1,
        ]
      );
    }

    console.log('[SyncPreferencesRepository] Updated sync preferences');
    return await getSyncPreferences(userId);
  } catch (error) {
    console.error('[SyncPreferencesRepository] UpdateSyncPreferences failed:', error);
    throw error;
  }
}

/**
 * Set WiFi-only mode
 * @param {boolean} enabled - Enable/disable WiFi-only mode
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 */
export async function setWiFiOnlyMode(enabled, userId = 'default_user') {
  return updateSyncPreferences({ wifi_only_mode: enabled }, userId);
}

/**
 * Set background sync enabled
 * @param {boolean} enabled - Enable/disable background sync
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 */
export async function setBackgroundSyncEnabled(enabled, userId = 'default_user') {
  return updateSyncPreferences({ background_sync_enabled: enabled }, userId);
}

/**
 * Set sync frequency
 * @param {number} hours - Sync frequency in hours (-1 for manual only)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 */
export async function setSyncFrequency(hours, userId = 'default_user') {
  return updateSyncPreferences({ sync_frequency_hours: hours }, userId);
}

/**
 * Set auto image upload
 * @param {boolean} enabled - Enable/disable auto image upload
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 */
export async function setAutoImageUpload(enabled, userId = 'default_user') {
  return updateSyncPreferences({ auto_image_upload: enabled }, userId);
}

/**
 * Set low battery skip sync
 * @param {boolean} enabled - Enable/disable skip sync on low battery
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 */
export async function setLowBatterySkipSync(enabled, userId = 'default_user') {
  return updateSyncPreferences({ low_battery_skip_sync: enabled }, userId);
}

/**
 * Reset sync preferences to defaults
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Reset preferences
 */
export async function resetSyncPreferences(userId = 'default_user') {
  if (Platform.OS === 'web') {
    console.log('[SyncPreferencesRepository] Web platform - returning defaults');
    return DEFAULT_SYNC_PREFERENCES;
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLES.SYNC_PREFERENCES} 
       SET 
         wifi_only_mode = 0,
         background_sync_enabled = 1,
         sync_frequency_hours = 6,
         auto_image_upload = 1,
         low_battery_skip_sync = 1,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? OR id = 1`,
      [userId]
    );

    console.log('[SyncPreferencesRepository] Reset sync preferences to defaults');
    return await getSyncPreferences(userId);
  } catch (error) {
    console.error('[SyncPreferencesRepository] ResetSyncPreferences failed:', error);
    throw error;
  }
}

/**
 * Parse preferences record (convert SQLite booleans)
 * @param {Object} record - Raw database record
 * @returns {Object} Parsed record
 */
function parsePreferencesRecord(record) {
  return {
    id: record.id,
    user_id: record.user_id,
    wifiOnlyMode: Boolean(record.wifi_only_mode),
    backgroundSyncEnabled: Boolean(record.background_sync_enabled),
    syncFrequencyHours: record.sync_frequency_hours,
    autoImageUpload: Boolean(record.auto_image_upload),
    lowBatterySkipSync: Boolean(record.low_battery_skip_sync),
    updatedAt: record.updated_at,
  };
}

export default {
  getSyncPreferences,
  updateSyncPreferences,
  setWiFiOnlyMode,
  setBackgroundSyncEnabled,
  setSyncFrequency,
  setAutoImageUpload,
  setLowBatterySkipSync,
  resetSyncPreferences,
};

