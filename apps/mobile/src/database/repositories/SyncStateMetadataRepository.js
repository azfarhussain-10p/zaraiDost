// Sync State Metadata Repository
// Story 1.6: Network Status and Sync Monitoring
// Provides CRUD operations for sync_state_metadata table

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { SYNC_STATE } from '../../constants/SyncConstants';
import { Platform } from 'react-native';

/**
 * Get current sync state metadata
 * @returns {Promise<Object>} Sync state metadata
 */
export async function getSyncStateMetadata() {
  if (Platform.OS === 'web') {
    console.log('[SyncStateMetadataRepository] Web platform - returning defaults');
    return {
      id: 1,
      lastSuccessfulSync: null,
      lastSyncAttempt: null,
      lastSyncDurationMs: null,
      nextScheduledSync: null,
      syncEnabled: true,
      currentStatus: SYNC_STATE.IDLE,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_STATE_METADATA} 
       WHERE id = 1 
       LIMIT 1`
    );

    if (result) {
      return parseMetadataRecord(result);
    }

    // Return defaults if no record exists
    return {
      id: 1,
      lastSuccessfulSync: null,
      lastSyncAttempt: null,
      lastSyncDurationMs: null,
      nextScheduledSync: null,
      syncEnabled: true,
      currentStatus: SYNC_STATE.IDLE,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SyncStateMetadataRepository] GetSyncStateMetadata failed:', error);
    throw error;
  }
}

/**
 * Update sync state metadata
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} Updated metadata
 */
export async function updateSyncStateMetadata(metadata) {
  if (Platform.OS === 'web') {
    console.log('[SyncStateMetadataRepository] Web platform - returning updated metadata');
    const current = await getSyncStateMetadata();
    return { ...current, ...metadata };
  }

  try {
    const db = await getDatabase();
    const {
      last_successful_sync,
      last_sync_attempt,
      last_sync_duration_ms,
      next_scheduled_sync,
      sync_enabled,
      current_status,
    } = metadata;

    await db.runAsync(
      `UPDATE ${TABLES.SYNC_STATE_METADATA} 
       SET 
         last_successful_sync = COALESCE(?, last_successful_sync),
         last_sync_attempt = COALESCE(?, last_sync_attempt),
         last_sync_duration_ms = COALESCE(?, last_sync_duration_ms),
         next_scheduled_sync = COALESCE(?, next_scheduled_sync),
         sync_enabled = COALESCE(?, sync_enabled),
         current_status = COALESCE(?, current_status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [
        last_successful_sync !== undefined ? last_successful_sync : null,
        last_sync_attempt !== undefined ? last_sync_attempt : null,
        last_sync_duration_ms !== undefined ? last_sync_duration_ms : null,
        next_scheduled_sync !== undefined ? next_scheduled_sync : null,
        sync_enabled !== undefined ? (sync_enabled ? 1 : 0) : null,
        current_status !== undefined ? current_status : null,
      ]
    );

    console.log('[SyncStateMetadataRepository] Updated sync state metadata');
    return await getSyncStateMetadata();
  } catch (error) {
    console.error('[SyncStateMetadataRepository] UpdateSyncStateMetadata failed:', error);
    throw error;
  }
}

/**
 * Set current sync status
 * @param {string} status - Sync status (idle, syncing, synced, failed, paused)
 * @returns {Promise<Object>} Updated metadata
 */
export async function setSyncStatus(status) {
  return updateSyncStateMetadata({ current_status: status });
}

/**
 * Set last successful sync timestamp
 * @param {string} timestamp - ISO timestamp
 * @param {number} durationMs - Sync duration in milliseconds
 * @returns {Promise<Object>} Updated metadata
 */
export async function setLastSuccessfulSync(timestamp, durationMs) {
  return updateSyncStateMetadata({
    last_successful_sync: timestamp,
    last_sync_attempt: timestamp,
    last_sync_duration_ms: durationMs,
    current_status: SYNC_STATE.SYNCED,
  });
}

/**
 * Set last sync attempt timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<Object>} Updated metadata
 */
export async function setLastSyncAttempt(timestamp) {
  return updateSyncStateMetadata({
    last_sync_attempt: timestamp,
  });
}

/**
 * Set next scheduled sync timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<Object>} Updated metadata
 */
export async function setNextScheduledSync(timestamp) {
  return updateSyncStateMetadata({
    next_scheduled_sync: timestamp,
  });
}

/**
 * Enable/disable sync
 * @param {boolean} enabled - Enable/disable sync
 * @returns {Promise<Object>} Updated metadata
 */
export async function setSyncEnabled(enabled) {
  return updateSyncStateMetadata({
    sync_enabled: enabled,
    current_status: enabled ? SYNC_STATE.IDLE : SYNC_STATE.PAUSED,
  });
}

/**
 * Mark sync as started
 * @returns {Promise<Object>} Updated metadata
 */
export async function markSyncStarted() {
  const timestamp = new Date().toISOString();
  return updateSyncStateMetadata({
    last_sync_attempt: timestamp,
    current_status: SYNC_STATE.SYNCING,
  });
}

/**
 * Mark sync as completed successfully
 * @param {number} durationMs - Sync duration in milliseconds
 * @returns {Promise<Object>} Updated metadata
 */
export async function markSyncCompleted(durationMs) {
  const timestamp = new Date().toISOString();
  return updateSyncStateMetadata({
    last_successful_sync: timestamp,
    last_sync_duration_ms: durationMs,
    current_status: SYNC_STATE.SYNCED,
  });
}

/**
 * Mark sync as failed
 * @returns {Promise<Object>} Updated metadata
 */
export async function markSyncFailed() {
  return updateSyncStateMetadata({
    current_status: SYNC_STATE.FAILED,
  });
}

/**
 * Reset sync state metadata
 * @returns {Promise<Object>} Reset metadata
 */
export async function resetSyncStateMetadata() {
  if (Platform.OS === 'web') {
    console.log('[SyncStateMetadataRepository] Web platform - returning defaults');
    return {
      id: 1,
      lastSuccessfulSync: null,
      lastSyncAttempt: null,
      lastSyncDurationMs: null,
      nextScheduledSync: null,
      syncEnabled: true,
      currentStatus: SYNC_STATE.IDLE,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE ${TABLES.SYNC_STATE_METADATA} 
       SET 
         last_successful_sync = NULL,
         last_sync_attempt = NULL,
         last_sync_duration_ms = NULL,
         next_scheduled_sync = NULL,
         sync_enabled = 1,
         current_status = 'idle',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    );

    console.log('[SyncStateMetadataRepository] Reset sync state metadata');
    return await getSyncStateMetadata();
  } catch (error) {
    console.error('[SyncStateMetadataRepository] ResetSyncStateMetadata failed:', error);
    throw error;
  }
}

/**
 * Get time since last successful sync (in seconds)
 * @returns {Promise<number|null>} Seconds since last sync, or null if never synced
 */
export async function getTimeSinceLastSync() {
  const metadata = await getSyncStateMetadata();

  if (!metadata.lastSuccessfulSync) {
    return null;
  }

  const lastSync = new Date(metadata.lastSuccessfulSync);
  const now = new Date();
  const diffMs = now - lastSync;

  return Math.floor(diffMs / 1000); // Convert to seconds
}

/**
 * Check if sync is overdue based on frequency setting
 * @param {number} frequencyHours - Sync frequency in hours
 * @returns {Promise<boolean>} True if sync is overdue
 */
export async function isSyncOverdue(frequencyHours) {
  const timeSinceLastSync = await getTimeSinceLastSync();

  if (timeSinceLastSync === null) {
    return true; // Never synced, so overdue
  }

  const frequencySeconds = frequencyHours * 3600;
  return timeSinceLastSync > frequencySeconds;
}

/**
 * Parse metadata record (convert SQLite booleans)
 * @param {Object} record - Raw database record
 * @returns {Object} Parsed record
 */
function parseMetadataRecord(record) {
  return {
    id: record.id,
    lastSuccessfulSync: record.last_successful_sync,
    lastSyncAttempt: record.last_sync_attempt,
    lastSyncDurationMs: record.last_sync_duration_ms,
    nextScheduledSync: record.next_scheduled_sync,
    syncEnabled: Boolean(record.sync_enabled),
    currentStatus: record.current_status,
    updatedAt: record.updated_at,
  };
}

export default {
  getSyncStateMetadata,
  updateSyncStateMetadata,
  setSyncStatus,
  setLastSuccessfulSync,
  setLastSyncAttempt,
  setNextScheduledSync,
  setSyncEnabled,
  markSyncStarted,
  markSyncCompleted,
  markSyncFailed,
  resetSyncStateMetadata,
  getTimeSinceLastSync,
  isSyncOverdue,
};

