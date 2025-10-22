// Sync State Manager Service
// Story 1.6: Network Status and Sync Monitoring
// Centralized service for tracking comprehensive sync state

import { getDatabase } from '../../database/config/db.config';
import { TABLES, SYNC_STATUS } from '../../constants/DatabaseConstants';
import {
  getSyncStateMetadata,
  updateSyncStateMetadata,
  markSyncStarted,
  markSyncCompleted,
  markSyncFailed,
  getTimeSinceLastSync,
} from '../../database/repositories/SyncStateMetadataRepository';
import { getSyncPreferences } from '../../database/repositories/SyncPreferencesRepository';
import { SYNC_STATE, SYNC_ENTITIES } from '../../constants/SyncConstants';
import { Platform } from 'react-native';

/**
 * Get comprehensive sync state including pending changes
 * @returns {Promise<Object>} Complete sync state
 */
export async function getSyncState() {
  try {
    const [metadata, preferences, pendingChanges] = await Promise.all([
      getSyncStateMetadata(),
      getSyncPreferences(),
      getPendingChanges(),
    ]);

    const timeSinceLastSync = await getTimeSinceLastSync();

    return {
      // Metadata
      lastSuccessfulSync: metadata.lastSuccessfulSync,
      lastSyncAttempt: metadata.lastSyncAttempt,
      lastSyncDurationMs: metadata.lastSyncDurationMs,
      nextScheduledSync: metadata.nextScheduledSync,
      syncEnabled: metadata.syncEnabled,
      currentStatus: metadata.currentStatus,

      // Pending changes
      pendingChanges: pendingChanges.total,
      pendingChangesByEntity: pendingChanges.byEntity,

      // Preferences
      wifiOnlyMode: preferences.wifiOnlyMode,
      backgroundSyncEnabled: preferences.backgroundSyncEnabled,
      syncFrequencyHours: preferences.syncFrequencyHours,

      // Derived
      timeSinceLastSyncSeconds: timeSinceLastSync,
      hasPendingChanges: pendingChanges.total > 0,
    };
  } catch (error) {
    console.error('[SyncStateManager] GetSyncState failed:', error);
    throw error;
  }
}

/**
 * Get count of pending changes across all entities
 * @returns {Promise<Object>} Pending changes breakdown
 */
export async function getPendingChanges() {
  if (Platform.OS === 'web') {
    console.log('[SyncStateManager] Web platform - returning zero pending changes');
    return {
      total: 0,
      byEntity: {
        [SYNC_ENTITIES.FARMERS]: { new: 0, updated: 0, deleted: 0 },
        [SYNC_ENTITIES.FIELDS]: { new: 0, updated: 0, deleted: 0 },
        [SYNC_ENTITIES.CROPS]: { new: 0, updated: 0, deleted: 0 },
        [SYNC_ENTITIES.QUERIES]: { new: 0, updated: 0, deleted: 0 },
        [SYNC_ENTITIES.IMAGES]: { new: 0, updated: 0, deleted: 0 },
      },
    };
  }

  try {
    const db = await getDatabase();

    // Count pending changes by entity and type
    const entities = [
      SYNC_ENTITIES.FARMERS,
      SYNC_ENTITIES.FIELDS,
      SYNC_ENTITIES.CROPS,
      SYNC_ENTITIES.QUERIES,
      SYNC_ENTITIES.IMAGES,
    ];

    const result = {
      total: 0,
      byEntity: {},
    };

    for (const entity of entities) {
      const counts = await db.getFirstAsync(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN sync_status = '${SYNC_STATUS.PENDING}' AND created_at = updated_at THEN 1 ELSE 0 END) as new,
           SUM(CASE WHEN sync_status = '${SYNC_STATUS.PENDING}' AND created_at != updated_at THEN 1 ELSE 0 END) as updated,
           SUM(CASE WHEN sync_status = '${SYNC_STATUS.FAILED}' THEN 1 ELSE 0 END) as deleted
         FROM ${TABLES[entity.toUpperCase()]}
         WHERE sync_status IN ('${SYNC_STATUS.PENDING}', '${SYNC_STATUS.FAILED}')`
      );

      const entityCounts = {
        new: counts?.new || 0,
        updated: counts?.updated || 0,
        deleted: counts?.deleted || 0,
      };

      result.byEntity[entity] = entityCounts;
      result.total += (counts?.total || 0);
    }

    return result;
  } catch (error) {
    console.error('[SyncStateManager] GetPendingChanges failed:', error);
    throw error;
  }
}

/**
 * Get pending changes count for a specific entity
 * @param {string} entityType - Entity type (farmers, fields, crops, queries, images)
 * @returns {Promise<Object>} Pending changes for entity
 */
export async function getPendingChangesByEntity(entityType) {
  if (Platform.OS === 'web') {
    console.log('[SyncStateManager] Web platform - returning zero');
    return { new: 0, updated: 0, deleted: 0, total: 0 };
  }

  try {
    const db = await getDatabase();
    const tableName = TABLES[entityType.toUpperCase()];

    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const counts = await db.getFirstAsync(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN sync_status = '${SYNC_STATUS.PENDING}' AND created_at = updated_at THEN 1 ELSE 0 END) as new,
         SUM(CASE WHEN sync_status = '${SYNC_STATUS.PENDING}' AND created_at != updated_at THEN 1 ELSE 0 END) as updated,
         SUM(CASE WHEN sync_status = '${SYNC_STATUS.FAILED}' THEN 1 ELSE 0 END) as deleted
       FROM ${tableName}
       WHERE sync_status IN ('${SYNC_STATUS.PENDING}', '${SYNC_STATUS.FAILED}')`
    );

    return {
      new: counts?.new || 0,
      updated: counts?.updated || 0,
      deleted: counts?.deleted || 0,
      total: counts?.total || 0,
    };
  } catch (error) {
    console.error('[SyncStateManager] GetPendingChangesByEntity failed:', error);
    throw error;
  }
}

/**
 * Update sync state when sync starts
 * @returns {Promise<Object>} Updated state
 */
export async function onSyncStart() {
  try {
    console.log('[SyncStateManager] Sync started');
    return await markSyncStarted();
  } catch (error) {
    console.error('[SyncStateManager] OnSyncStart failed:', error);
    throw error;
  }
}

/**
 * Update sync state when sync completes successfully
 * @param {number} durationMs - Sync duration in milliseconds
 * @param {Object} syncResults - Results of sync operation
 * @returns {Promise<Object>} Updated state
 */
export async function onSyncComplete(durationMs, syncResults = {}) {
  try {
    console.log('[SyncStateManager] Sync completed successfully');
    await markSyncCompleted(durationMs);

    // Calculate next scheduled sync
    const preferences = await getSyncPreferences();
    if (preferences.backgroundSyncEnabled && preferences.syncFrequencyHours > 0) {
      const nextSync = new Date();
      nextSync.setHours(nextSync.getHours() + preferences.syncFrequencyHours);
      await updateSyncStateMetadata({
        next_scheduled_sync: nextSync.toISOString(),
      });
    }

    return await getSyncState();
  } catch (error) {
    console.error('[SyncStateManager] OnSyncComplete failed:', error);
    throw error;
  }
}

/**
 * Update sync state when sync fails
 * @param {Error} error - Sync error
 * @returns {Promise<Object>} Updated state
 */
export async function onSyncFail(error) {
  try {
    console.error('[SyncStateManager] Sync failed:', error.message);
    await markSyncFailed();
    return await getSyncState();
  } catch (err) {
    console.error('[SyncStateManager] OnSyncFail failed:', err);
    throw err;
  }
}

/**
 * Check if sync is needed based on pending changes and schedule
 * @returns {Promise<boolean>} True if sync is needed
 */
export async function isSyncNeeded() {
  try {
    const state = await getSyncState();

    // If sync is disabled, no sync needed
    if (!state.syncEnabled) {
      return false;
    }

    // If there are pending changes, sync is needed
    if (state.hasPendingChanges) {
      return true;
    }

    // Check if scheduled sync is overdue
    if (state.nextScheduledSync) {
      const nextSync = new Date(state.nextScheduledSync);
      const now = new Date();
      if (now >= nextSync) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[SyncStateManager] IsSyncNeeded failed:', error);
    return false;
  }
}

/**
 * Get human-readable sync status message
 * @returns {Promise<string>} Status message
 */
export async function getSyncStatusMessage() {
  try {
    const state = await getSyncState();

    switch (state.currentStatus) {
      case SYNC_STATE.SYNCING:
        return 'Syncing...';

      case SYNC_STATE.SYNCED:
        if (state.timeSinceLastSyncSeconds !== null) {
          return formatTimeSinceSync(state.timeSinceLastSyncSeconds);
        }
        return 'Synced';

      case SYNC_STATE.FAILED:
        return 'Sync failed';

      case SYNC_STATE.PAUSED:
        return 'Sync paused';

      case SYNC_STATE.IDLE:
      default:
        if (state.hasPendingChanges) {
          return `${state.pendingChanges} item(s) to sync`;
        }
        if (state.lastSuccessfulSync) {
          return formatTimeSinceSync(state.timeSinceLastSyncSeconds);
        }
        return 'Not synced yet';
    }
  } catch (error) {
    console.error('[SyncStateManager] GetSyncStatusMessage failed:', error);
    return 'Unknown status';
  }
}

/**
 * Format time since last sync into human-readable string
 * @param {number} seconds - Seconds since last sync
 * @returns {string} Formatted time
 */
function formatTimeSinceSync(seconds) {
  if (seconds === null) {
    return 'Never synced';
  }

  if (seconds < 60) {
    return 'Synced just now';
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `Synced ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `Synced ${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(seconds / 86400);
  return `Synced ${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Get detailed sync summary for display
 * @returns {Promise<Object>} Detailed sync summary
 */
export async function getSyncSummary() {
  try {
    const state = await getSyncState();
    const statusMessage = await getSyncStatusMessage();

    return {
      status: state.currentStatus,
      statusMessage,
      lastSync: state.lastSuccessfulSync,
      lastSyncFormatted: state.lastSuccessfulSync
        ? new Date(state.lastSuccessfulSync).toLocaleString()
        : 'Never',
      pendingChanges: state.pendingChanges,
      pendingByEntity: state.pendingChangesByEntity,
      hasPendingChanges: state.hasPendingChanges,
      syncEnabled: state.syncEnabled,
      wifiOnlyMode: state.wifiOnlyMode,
      backgroundSyncEnabled: state.backgroundSyncEnabled,
      nextScheduledSync: state.nextScheduledSync,
      nextScheduledSyncFormatted: state.nextScheduledSync
        ? new Date(state.nextScheduledSync).toLocaleString()
        : 'Not scheduled',
    };
  } catch (error) {
    console.error('[SyncStateManager] GetSyncSummary failed:', error);
    throw error;
  }
}

export default {
  getSyncState,
  getPendingChanges,
  getPendingChangesByEntity,
  onSyncStart,
  onSyncComplete,
  onSyncFail,
  isSyncNeeded,
  getSyncStatusMessage,
  getSyncSummary,
};

