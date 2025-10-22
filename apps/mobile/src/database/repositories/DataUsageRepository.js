// Data Usage Repository
// Story 1.6: Network Status and Sync Monitoring
// Provides CRUD operations for data_usage table

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { Platform } from 'react-native';

/**
 * Create a new data usage entry
 * @param {Object} usageData - Data usage information
 * @returns {Promise<Object>} Created data usage record
 */
export async function createDataUsage(usageData) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - skipping database operation');
    return { id: 'mock-usage-' + Date.now(), ...usageData };
  }

  try {
    const db = await getDatabase();
    const {
      id,
      date,
      connection_type,
      sync_operation_id,
      bytes_uploaded,
      bytes_downloaded,
      total_bytes,
      entity_breakdown,
    } = usageData;

    await db.runAsync(
      `INSERT INTO ${TABLES.DATA_USAGE} (
        id, date, connection_type, sync_operation_id,
        bytes_uploaded, bytes_downloaded, total_bytes, entity_breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        date,
        connection_type,
        sync_operation_id,
        bytes_uploaded || 0,
        bytes_downloaded || 0,
        total_bytes || (bytes_uploaded + bytes_downloaded),
        JSON.stringify(entity_breakdown || {}),
      ]
    );

    console.log('[DataUsageRepository] Created data usage entry:', id);
    return await getDataUsageById(id);
  } catch (error) {
    console.error('[DataUsageRepository] CreateDataUsage failed:', error);
    throw error;
  }
}

/**
 * Get data usage by ID
 * @param {string} id - Data usage ID
 * @returns {Promise<Object|null>} Data usage record
 */
export async function getDataUsageById(id) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning null');
    return null;
  }

  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.DATA_USAGE} WHERE id = ?`,
      [id]
    );

    return result ? parseDataUsageRecord(result) : null;
  } catch (error) {
    console.error('[DataUsageRepository] GetDataUsageById failed:', error);
    throw error;
  }
}

/**
 * Get all data usage records
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Array of data usage records
 */
export async function getAllDataUsage(limit = 100) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.DATA_USAGE} 
       ORDER BY date DESC 
       LIMIT ?`,
      [limit]
    );

    return results.map(parseDataUsageRecord);
  } catch (error) {
    console.error('[DataUsageRepository] GetAllDataUsage failed:', error);
    throw error;
  }
}

/**
 * Get data usage by connection type
 * @param {string} connectionType - 'wifi' or 'cellular'
 * @param {number} limit - Number of records
 * @returns {Promise<Array>} Filtered data usage records
 */
export async function getDataUsageByConnectionType(connectionType, limit = 100) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.DATA_USAGE} 
       WHERE connection_type = ? 
       ORDER BY date DESC 
       LIMIT ?`,
      [connectionType, limit]
    );

    return results.map(parseDataUsageRecord);
  } catch (error) {
    console.error('[DataUsageRepository] GetDataUsageByConnectionType failed:', error);
    throw error;
  }
}

/**
 * Get data usage within a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Data usage records in range
 */
export async function getDataUsageByDateRange(startDate, endDate) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty array');
    return [];
  }

  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      `SELECT * FROM ${TABLES.DATA_USAGE} 
       WHERE date BETWEEN ? AND ? 
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    return results.map(parseDataUsageRecord);
  } catch (error) {
    console.error('[DataUsageRepository] GetDataUsageByDateRange failed:', error);
    throw error;
  }
}

/**
 * Get daily data usage statistics
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Daily statistics
 */
export async function getDailyDataUsage(date) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty stats');
    return { wifi: { upload: 0, download: 0 }, cellular: { upload: 0, download: 0 } };
  }

  try {
    const db = await getDatabase();
    const stats = await db.getAllAsync(
      `SELECT 
        connection_type,
        SUM(bytes_uploaded) as totalUploaded,
        SUM(bytes_downloaded) as totalDownloaded,
        SUM(total_bytes) as totalBytes
       FROM ${TABLES.DATA_USAGE} 
       WHERE date = ? 
       GROUP BY connection_type`,
      [date]
    );

    const result = {
      wifi: { upload: 0, download: 0, total: 0 },
      cellular: { upload: 0, download: 0, total: 0 },
    };

    stats.forEach((stat) => {
      const type = stat.connection_type === 'wifi' ? 'wifi' : 'cellular';
      result[type] = {
        upload: stat.totalUploaded || 0,
        download: stat.totalDownloaded || 0,
        total: stat.totalBytes || 0,
      };
    });

    return result;
  } catch (error) {
    console.error('[DataUsageRepository] GetDailyDataUsage failed:', error);
    throw error;
  }
}

/**
 * Get weekly data usage statistics
 * @param {string} startDate - Week start date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weekly statistics
 */
export async function getWeeklyDataUsage(startDate) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty stats');
    return { wifi: { upload: 0, download: 0 }, cellular: { upload: 0, download: 0 } };
  }

  try {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const db = await getDatabase();
    const stats = await db.getAllAsync(
      `SELECT 
        connection_type,
        SUM(bytes_uploaded) as totalUploaded,
        SUM(bytes_downloaded) as totalDownloaded,
        SUM(total_bytes) as totalBytes
       FROM ${TABLES.DATA_USAGE} 
       WHERE date BETWEEN ? AND ? 
       GROUP BY connection_type`,
      [startDate, endDate.toISOString().split('T')[0]]
    );

    const result = {
      wifi: { upload: 0, download: 0, total: 0 },
      cellular: { upload: 0, download: 0, total: 0 },
    };

    stats.forEach((stat) => {
      const type = stat.connection_type === 'wifi' ? 'wifi' : 'cellular';
      result[type] = {
        upload: stat.totalUploaded || 0,
        download: stat.totalDownloaded || 0,
        total: stat.totalBytes || 0,
      };
    });

    return result;
  } catch (error) {
    console.error('[DataUsageRepository] GetWeeklyDataUsage failed:', error);
    throw error;
  }
}

/**
 * Get monthly data usage statistics
 * @param {string} yearMonth - Month in YYYY-MM format
 * @returns {Promise<Object>} Monthly statistics
 */
export async function getMonthlyDataUsage(yearMonth) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty stats');
    return { wifi: { upload: 0, download: 0 }, cellular: { upload: 0, download: 0 }, total: 0 };
  }

  try {
    const db = await getDatabase();
    const stats = await db.getAllAsync(
      `SELECT 
        connection_type,
        SUM(bytes_uploaded) as totalUploaded,
        SUM(bytes_downloaded) as totalDownloaded,
        SUM(total_bytes) as totalBytes
       FROM ${TABLES.DATA_USAGE} 
       WHERE date LIKE ? 
       GROUP BY connection_type`,
      [`${yearMonth}%`]
    );

    const result = {
      wifi: { upload: 0, download: 0, total: 0 },
      cellular: { upload: 0, download: 0, total: 0 },
      total: 0,
    };

    stats.forEach((stat) => {
      const type = stat.connection_type === 'wifi' ? 'wifi' : 'cellular';
      result[type] = {
        upload: stat.totalUploaded || 0,
        download: stat.totalDownloaded || 0,
        total: stat.totalBytes || 0,
      };
      result.total += stat.totalBytes || 0;
    });

    return result;
  } catch (error) {
    console.error('[DataUsageRepository] GetMonthlyDataUsage failed:', error);
    throw error;
  }
}

/**
 * Get total data usage statistics
 * @returns {Promise<Object>} Total statistics
 */
export async function getTotalDataUsage() {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - returning empty stats');
    return { wifi: 0, cellular: 0, total: 0 };
  }

  try {
    const db = await getDatabase();
    const stats = await db.getAllAsync(
      `SELECT 
        connection_type,
        SUM(total_bytes) as totalBytes
       FROM ${TABLES.DATA_USAGE} 
       GROUP BY connection_type`
    );

    const result = { wifi: 0, cellular: 0, total: 0 };

    stats.forEach((stat) => {
      const type = stat.connection_type === 'wifi' ? 'wifi' : 'cellular';
      result[type] = stat.totalBytes || 0;
      result.total += stat.totalBytes || 0;
    });

    return result;
  } catch (error) {
    console.error('[DataUsageRepository] GetTotalDataUsage failed:', error);
    throw error;
  }
}

/**
 * Delete data usage older than specified days
 * @param {number} days - Number of days to retain
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteOldDataUsage(days = 90) {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - skipping cleanup');
    return 0;
  }

  try {
    const db = await getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db.runAsync(
      `DELETE FROM ${TABLES.DATA_USAGE} 
       WHERE date < ?`,
      [cutoffDate.toISOString().split('T')[0]]
    );

    console.log(`[DataUsageRepository] Deleted ${result.changes} old records`);
    return result.changes;
  } catch (error) {
    console.error('[DataUsageRepository] DeleteOldDataUsage failed:', error);
    throw error;
  }
}

/**
 * Delete all data usage records
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteAllDataUsage() {
  if (Platform.OS === 'web') {
    console.log('[DataUsageRepository] Web platform - skipping cleanup');
    return 0;
  }

  try {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM ${TABLES.DATA_USAGE}`);

    console.log(`[DataUsageRepository] Deleted all ${result.changes} records`);
    return result.changes;
  } catch (error) {
    console.error('[DataUsageRepository] DeleteAllDataUsage failed:', error);
    throw error;
  }
}

/**
 * Parse data usage record (deserialize JSON fields)
 * @param {Object} record - Raw database record
 * @returns {Object} Parsed record
 */
function parseDataUsageRecord(record) {
  return {
    ...record,
    entity_breakdown: record.entity_breakdown ? JSON.parse(record.entity_breakdown) : {},
  };
}

export default {
  createDataUsage,
  getDataUsageById,
  getAllDataUsage,
  getDataUsageByConnectionType,
  getDataUsageByDateRange,
  getDailyDataUsage,
  getWeeklyDataUsage,
  getMonthlyDataUsage,
  getTotalDataUsage,
  deleteOldDataUsage,
  deleteAllDataUsage,
};

