// Health Check Repository
// Story 3.1: Image Capture and Upload Interface
// Manages health check sessions and their associated images

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { HEALTH_CHECK_STATUS } from '../../constants/ImageQualityConstants';

/**
 * HealthCheckRepository - CRUD operations for health_checks table
 * 
 * A health check represents a single crop disease detection session
 * with 1-5 associated images
 */
class HealthCheckRepository {
  /**
   * Create a new health check session
   * @param {Object} healthCheckData - Health check details
   * @returns {Promise<Object>} Created health check
   */
  static async create(healthCheckData) {
    const db = await getDatabase();

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const {
      farmerId,
      fieldId = null,
      cropId = null,
      cropType,
      description = null,
      locationLatitude = null,
      locationLongitude = null,
      locationAccuracy = null,
    } = healthCheckData;

    await db.runAsync(
      `INSERT INTO ${TABLES.HEALTH_CHECKS} 
      (id, farmer_id, field_id, crop_id, crop_type, description, 
       location_latitude, location_longitude, location_accuracy, 
       status, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        farmerId,
        fieldId,
        cropId,
        cropType,
        description,
        locationLatitude,
        locationLongitude,
        locationAccuracy,
        HEALTH_CHECK_STATUS.PENDING,
        timestamp,
        timestamp,
        'pending',
      ]
    );

    return await this.findById(id);
  }

  /**
   * Find health check by ID
   * @param {string} id - Health check UUID
   * @returns {Promise<Object|null>} Health check or null
   */
  static async findById(id) {
    const db = await getDatabase();

    const healthCheck = await db.getFirstAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} WHERE id = ?`,
      [id]
    );

    return healthCheck || null;
  }

  /**
   * Get all health checks for a farmer
   * @param {string} farmerId - Farmer UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Health checks
   */
  static async findByFarmer(farmerId, options = {}) {
    const db = await getDatabase();
    const { limit = 50, offset = 0, status = null } = options;

    let query = `SELECT * FROM ${TABLES.HEALTH_CHECKS} WHERE farmer_id = ?`;
    const params = [farmerId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const healthChecks = await db.getAllAsync(query, params);
    return healthChecks || [];
  }

  /**
   * Get recent health checks (last 30 days)
   * @param {string} farmerId - Farmer UUID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Health checks
   */
  static async getRecent(farmerId, days = 30) {
    const db = await getDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    const healthChecks = await db.getAllAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} 
       WHERE farmer_id = ? AND created_at >= ?
       ORDER BY created_at DESC`,
      [farmerId, cutoffISO]
    );

    return healthChecks || [];
  }

  /**
   * Update health check status
   * @param {string} id - Health check UUID
   * @param {string} status - New status
   * @returns {Promise<boolean>} Success indicator
   */
  static async updateStatus(id, status) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      [status, new Date().toISOString(), id]
    );

    return true;
  }

  /**
   * Update image count for a health check
   * @param {string} id - Health check UUID
   * @param {number} count - New image count
   * @returns {Promise<boolean>} Success indicator
   */
  static async updateImageCount(id, count) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET image_count = ?, updated_at = ?
       WHERE id = ?`,
      [count, new Date().toISOString(), id]
    );

    return true;
  }

  /**
   * Increment image count for a health check
   * @param {string} id - Health check UUID
   * @returns {Promise<number>} New image count
   */
  static async incrementImageCount(id) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET image_count = image_count + 1, updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), id]
    );

    const healthCheck = await this.findById(id);
    return healthCheck ? healthCheck.image_count : 0;
  }

  /**
   * Save on-device analysis result
   * @param {string} id - Health check UUID
   * @param {Object} result - Analysis result (will be JSON stringified)
   * @returns {Promise<boolean>} Success indicator
   */
  static async saveOnDeviceResult(id, result) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET on_device_result = ?, 
           status = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        JSON.stringify(result),
        HEALTH_CHECK_STATUS.COMPLETED,
        new Date().toISOString(),
        id,
      ]
    );

    return true;
  }

  /**
   * Save cloud analysis result
   * @param {string} id - Health check UUID
   * @param {Object} result - Cloud analysis result
   * @returns {Promise<boolean>} Success indicator
   */
  static async saveCloudResult(id, result) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET cloud_result = ?, updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(result), new Date().toISOString(), id]
    );

    return true;
  }

  /**
   * Get health checks pending sync
   * @returns {Promise<Array>} Health checks with pending sync status
   */
  static async getPendingSync() {
    const db = await getDatabase();

    const healthChecks = await db.getAllAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} 
       WHERE sync_status = 'pending'
       ORDER BY created_at ASC
       LIMIT 100`
    );

    return healthChecks || [];
  }

  /**
   * Update sync status
   * @param {string} id - Health check UUID
   * @param {string} syncStatus - 'pending', 'synced', 'failed'
   * @returns {Promise<boolean>} Success indicator
   */
  static async updateSyncStatus(id, syncStatus) {
    const db = await getDatabase();

    await db.runAsync(
      `UPDATE ${TABLES.HEALTH_CHECKS} 
       SET sync_status = ?, updated_at = ?
       WHERE id = ?`,
      [syncStatus, new Date().toISOString(), id]
    );

    return true;
  }

  /**
   * Get health checks by field
   * @param {string} fieldId - Field UUID
   * @returns {Promise<Array>} Health checks
   */
  static async findByField(fieldId) {
    const db = await getDatabase();

    const healthChecks = await db.getAllAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} 
       WHERE field_id = ?
       ORDER BY created_at DESC`,
      [fieldId]
    );

    return healthChecks || [];
  }

  /**
   * Get health checks by crop
   * @param {string} cropId - Crop UUID
   * @returns {Promise<Array>} Health checks
   */
  static async findByCrop(cropId) {
    const db = await getDatabase();

    const healthChecks = await db.getAllAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} 
       WHERE crop_id = ?
       ORDER BY created_at DESC`,
      [cropId]
    );

    return healthChecks || [];
  }

  /**
   * Get health check statistics for a farmer
   * @param {string} farmerId - Farmer UUID
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(farmerId) {
    const db = await getDatabase();

    const stats = await db.getFirstAsync(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'analyzing' THEN 1 ELSE 0 END) as analyzing,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(image_count) as total_images
       FROM ${TABLES.HEALTH_CHECKS}
       WHERE farmer_id = ?`,
      [farmerId]
    );

    return stats || {
      total: 0,
      completed: 0,
      pending: 0,
      analyzing: 0,
      failed: 0,
      total_images: 0,
    };
  }

  /**
   * Delete a health check (and cascade delete images)
   * @param {string} id - Health check UUID
   * @returns {Promise<boolean>} Success indicator
   */
  static async delete(id) {
    const db = await getDatabase();

    // Note: Foreign key ON DELETE CASCADE will handle image deletion
    await db.runAsync(
      `DELETE FROM ${TABLES.HEALTH_CHECKS} WHERE id = ?`,
      [id]
    );

    return true;
  }

  /**
   * Get health check with images (joined query)
   * @param {string} id - Health check UUID
   * @returns {Promise<Object|null>} Health check with images array
   */
  static async getWithImages(id) {
    const db = await getDatabase();

    const healthCheck = await this.findById(id);
    if (!healthCheck) return null;

    const images = await db.getAllAsync(
      `SELECT * FROM ${TABLES.IMAGES} 
       WHERE health_check_id = ?
       ORDER BY image_sequence ASC`,
      [id]
    );

    return {
      ...healthCheck,
      images: images || [],
    };
  }

  /**
   * Search health checks by crop type
   * @param {string} farmerId - Farmer UUID
   * @param {string} cropType - Crop type ID
   * @returns {Promise<Array>} Health checks
   */
  static async searchByCropType(farmerId, cropType) {
    const db = await getDatabase();

    const healthChecks = await db.getAllAsync(
      `SELECT * FROM ${TABLES.HEALTH_CHECKS} 
       WHERE farmer_id = ? AND crop_type = ?
       ORDER BY created_at DESC`,
      [farmerId, cropType]
    );

    return healthChecks || [];
  }
}

export default HealthCheckRepository;

