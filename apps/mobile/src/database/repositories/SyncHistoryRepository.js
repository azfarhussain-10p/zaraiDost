// Sync History Repository
// Story 1.6: Network Status and Sync Monitoring
// Provides CRUD operations for sync_history table

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { SYNC_HISTORY_LIMITS } from '../../constants/SyncConstants';
import { Platform } from 'react-native';

/**
 * Create a new sync history entry
 * @param {Object} syncData - Sync operation data
 * @returns {Promise<Object>} Created sync history record
 */
export async function createSyncHistory(syncData) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - skipping database operation');
    return { id: 'mock-sync-' + Date.now(), ...syncData };
  }

  try {
    const db = await getDatabase();
    const {
      id,
      sync_start_time,
      sync_end_time,
      sync_duration_ms,
      sync_status,
      connection_type,
      entities_synced,
      total_records_synced,
      total_records_failed,
      data_uploaded_bytes,
      data_downloaded_bytes,
      error_messages,
      sync_trigger,
    } = syncData;

    await db.runAsync(
      `INSERT INTO ${TABLES.SYNC_HISTORY} (
        id, sync_start_time, sync_end_time, sync_duration_ms, sync_status,
        connection_type, entities_synced, total_records_synced, total_records_failed,
        data_uploaded_bytes, data_downloaded_bytes, error_messages, sync_trigger
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sync_start_time,
        sync_end_time,
        sync_duration_ms,
        sync_status,
        connection_type,
        JSON.stringify(entities_synced),
        total_records_synced || 0,
        total_records_failed || 0,
        data_uploaded_bytes || 0,
        data_downloaded_bytes || 0,
        JSON.stringify(error_messages || []),
        sync_trigger,
      ]
    );

    console.log('[SyncHistoryRepository] Created sync history:', id);
    return await getSyncHistoryById(id);
  } catch (error) {
    console.error('[SyncHistoryRepository] CreateSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Get sync history by ID
 * @param {string} id - Sync history ID
 * @returns {Promise<Object|null>} Sync history record
 */
export async function getSyncHistoryById(id) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning mock data');
    return null;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} WHERE id = ?`,
      [id]
    );

    if (result) {
      return parseSyncHistoryRecord(result);
    }

    return null;
  } catch (error) {
    console.error('[SyncHistoryRepository] GetSyncHistoryById failed:', error);
    throw error;
  }
}

/**
 * Get all sync history records (limited to MAX_ENTRIES)
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of sync history records
 */
export async function getAllSyncHistory(limit = SYNC_HISTORY_LIMITS.MAX_ENTRIES) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} 
       ORDER BY sync_start_time DESC 
       LIMIT ?`,
      [limit]
    );

    return results.map(parseSyncHistoryRecord);
  } catch (error) {
    console.error('[SyncHistoryRepository] GetAllSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Get sync history filtered by status
 * @param {string} status - Sync status (success, failed, partial)
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Filtered sync history records
 */
export async function getSyncHistoryByStatus(status, limit = SYNC_HISTORY_LIMITS.MAX_ENTRIES) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} 
       WHERE sync_status = ? 
       ORDER BY sync_start_time DESC 
       LIMIT ?`,
      [status, limit]
    );

    return results.map(parseSyncHistoryRecord);
  } catch (error) {
    console.error('[SyncHistoryRepository] GetSyncHistoryByStatus failed:', error);
    throw error;
  }
}

/**
 * Get sync history within a date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} Sync history records in range
 */
export async function getSyncHistoryByDateRange(startDate, endDate) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} 
       WHERE sync_start_time BETWEEN ? AND ? 
       ORDER BY sync_start_time DESC`,
      [startDate, endDate]
    );

    return results.map(parseSyncHistoryRecord);
  } catch (error) {
    console.error('[SyncHistoryRepository] GetSyncHistoryByDateRange failed:', error);
    throw error;
  }
}

/**
 * Get the most recent sync history record
 * @returns {Promise<Object|null>} Most recent sync history
 */
export async function getLastSyncHistory() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning null');
    return null;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} 
       ORDER BY sync_start_time DESC 
       LIMIT 1`
    );

    return result ? parseSyncHistoryRecord(result) : null;
  } catch (error) {
    console.error('[SyncHistoryRepository] GetLastSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Get last successful sync
 * @returns {Promise<Object|null>} Last successful sync record
 */
export async function getLastSuccessfulSync() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning null');
    return null;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.SYNC_HISTORY} 
       WHERE sync_status = 'success' 
       ORDER BY sync_start_time DESC 
       LIMIT 1`
    );

    return result ? parseSyncHistoryRecord(result) : null;
  } catch (error) {
    console.error('[SyncHistoryRepository] GetLastSuccessfulSync failed:', error);
    throw error;
  }
}

/**
 * Count total sync history records
 * @returns {Promise<number>} Total count
 */
export async function countSyncHistory() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning 0');
    return 0;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM ${TABLES.SYNC_HISTORY}`
    );

    return result?.count || 0;
  } catch (error) {
    console.error('[SyncHistoryRepository] CountSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Delete sync history older than specified days
 * @param {number} days - Number of days to retain
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteOldSyncHistory(days = SYNC_HISTORY_LIMITS.AUTO_CLEANUP_DAYS) {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - skipping cleanup');
    return 0;
  }

  try {
    const db = await getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db.runAsync(
      `DELETE FROM ${TABLES.SYNC_HISTORY} 
       WHERE sync_start_time < ?`,
      [cutoffDate.toISOString()]
    );

    console.log(`[SyncHistoryRepository] Deleted ${result.changes} old records`);
    return result.changes;
  } catch (error) {
    console.error('[SyncHistoryRepository] DeleteOldSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Delete excess sync history (keep only MAX_ENTRIES most recent)
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteExcessSyncHistory() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - skipping cleanup');
    return 0;
  }

  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      `DELETE FROM ${TABLES.SYNC_HISTORY} 
       WHERE id NOT IN (
         SELECT id FROM ${TABLES.SYNC_HISTORY} 
         ORDER BY sync_start_time DESC 
         LIMIT ?
       )`,
      [SYNC_HISTORY_LIMITS.MAX_ENTRIES]
    );

    console.log(`[SyncHistoryRepository] Deleted ${result.changes} excess records`);
    return result.changes;
  } catch (error) {
    console.error('[SyncHistoryRepository] DeleteExcessSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Delete all sync history
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteAllSyncHistory() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - skipping cleanup');
    return 0;
  }

  try {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM ${TABLES.SYNC_HISTORY}`);

    console.log(`[SyncHistoryRepository] Deleted all ${result.changes} records`);
    return result.changes;
  } catch (error) {
    console.error('[SyncHistoryRepository] DeleteAllSyncHistory failed:', error);
    throw error;
  }
}

/**
 * Get sync statistics
 * @returns {Promise<Object>} Sync statistics
 */
export async function getSyncStatistics() {
  if (Platform.OS === 'web') {
    console.log('[SyncHistoryRepository] Web platform - returning empty stats');
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      partialSyncs: 0,
      averageDurationMs: 0,
      totalDataUploaded: 0,
      totalDataDownloaded: 0,
    };
  }

  try {
    const db = await getDatabase();
    const stats = await db.getFirstAsync(`
      SELECT 
        COUNT(*) as totalSyncs,
        SUM(CASE WHEN sync_status = 'success' THEN 1 ELSE 0 END) as successfulSyncs,
        SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END) as failedSyncs,
        SUM(CASE WHEN sync_status = 'partial' THEN 1 ELSE 0 END) as partialSyncs,
        AVG(sync_duration_ms) as averageDurationMs,
        SUM(data_uploaded_bytes) as totalDataUploaded,
        SUM(data_downloaded_bytes) as totalDataDownloaded
      FROM ${TABLES.SYNC_HISTORY}
    `);

    return {
      totalSyncs: stats.totalSyncs || 0,
      successfulSyncs: stats.successfulSyncs || 0,
      failedSyncs: stats.failedSyncs || 0,
      partialSyncs: stats.partialSyncs || 0,
      averageDurationMs: Math.round(stats.averageDurationMs || 0),
      totalDataUploaded: stats.totalDataUploaded || 0,
      totalDataDownloaded: stats.totalDataDownloaded || 0,
    };
  } catch (error) {
    console.error('[SyncHistoryRepository] GetSyncStatistics failed:', error);
    throw error;
  }
}

/**
 * Parse sync history record (deserialize JSON fields)
 * @param {Object} record - Raw database record
 * @returns {Object} Parsed record
 */
function parseSyncHistoryRecord(record) {
  return {
    ...record,
    entities_synced: record.entities_synced ? JSON.parse(record.entities_synced) : {},
    error_messages: record.error_messages ? JSON.parse(record.error_messages) : [],
  };
}

export default {
  createSyncHistory,
  getSyncHistoryById,
  getAllSyncHistory,
  getSyncHistoryByStatus,
  getSyncHistoryByDateRange,
  getLastSyncHistory,
  getLastSuccessfulSync,
  countSyncHistory,
  deleteOldSyncHistory,
  deleteExcessSyncHistory,
  deleteAllSyncHistory,
  getSyncStatistics,
};

