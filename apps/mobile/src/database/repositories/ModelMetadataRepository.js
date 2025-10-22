// Model Metadata Repository
// Story 1.3: Offline AI Model Storage
// Implements: Task 3 (Build model versioning system)

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';

/**
 * ModelMetadataRepository
 * Manages model metadata storage and retrieval
 * AC4: Model version tracking for future updates
 */
class ModelMetadataRepository {
  /**
   * Create or update model metadata
   * Implements: Task 3.2
   */
  async save(modelData) {
    const db = getDatabase();
    const {
      model_name,
      version,
      file_path,
      file_size_bytes,
      checksum,
      download_date,
      is_active = 0,
    } = modelData;

    try {
      // Check if model version already exists
      const existing = await this.findByNameAndVersion(model_name, version);

      const timestamp = new Date().toISOString();

      if (existing) {
        // Update existing record
        await db.runAsync(
          `UPDATE ${TABLES.MODEL_METADATA}
           SET file_path = ?,
               file_size_bytes = ?,
               checksum = ?,
               download_date = ?,
               is_active = ?,
               updated_at = ?
           WHERE model_name = ? AND version = ?`,
          [
            file_path,
            file_size_bytes,
            checksum,
            download_date || timestamp,
            is_active,
            timestamp,
            model_name,
            version,
          ]
        );

        return { ...existing, ...modelData, updated_at: timestamp };
      } else {
        // Insert new record
        const result = await db.runAsync(
          `INSERT INTO ${TABLES.MODEL_METADATA}
           (model_name, version, file_path, file_size_bytes, checksum, download_date, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            model_name,
            version,
            file_path,
            file_size_bytes,
            checksum,
            download_date || timestamp,
            is_active,
            timestamp,
            timestamp,
          ]
        );

        return {
          id: result.lastInsertRowId,
          ...modelData,
          created_at: timestamp,
          updated_at: timestamp,
        };
      }
    } catch (error) {
      console.error('[ModelMetadataRepository] Save failed:', error);
      throw error;
    }
  }

  /**
   * Find model by name and version
   * Implements: Task 3.3
   */
  async findByNameAndVersion(model_name, version) {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        `SELECT * FROM ${TABLES.MODEL_METADATA}
         WHERE model_name = ? AND version = ?`,
        [model_name, version]
      );

      return result || null;
    } catch (error) {
      console.error('[ModelMetadataRepository] Find by name and version failed:', error);
      throw error;
    }
  }

  /**
   * Get active model for a given model name
   * Implements: Task 3.2
   */
  async getActiveModel(model_name) {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        `SELECT * FROM ${TABLES.MODEL_METADATA}
         WHERE model_name = ? AND is_active = 1
         ORDER BY created_at DESC
         LIMIT 1`,
        [model_name]
      );

      return result || null;
    } catch (error) {
      console.error('[ModelMetadataRepository] Get active model failed:', error);
      throw error;
    }
  }

  /**
   * Set a model as active (and deactivate others for same model name)
   * Implements: Task 3.5, 3.6
   */
  async setActiveModel(model_name, version) {
    const db = getDatabase();

    try {
      // Deactivate all versions of this model
      await db.runAsync(
        `UPDATE ${TABLES.MODEL_METADATA}
         SET is_active = 0
         WHERE model_name = ?`,
        [model_name]
      );

      // Activate the specified version
      await db.runAsync(
        `UPDATE ${TABLES.MODEL_METADATA}
         SET is_active = 1, updated_at = ?
         WHERE model_name = ? AND version = ?`,
        [new Date().toISOString(), model_name, version]
      );

      return await this.findByNameAndVersion(model_name, version);
    } catch (error) {
      console.error('[ModelMetadataRepository] Set active model failed:', error);
      throw error;
    }
  }

  /**
   * Get all versions of a model
   * Implements: Task 3.4
   */
  async getAllVersions(model_name) {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync(
        `SELECT * FROM ${TABLES.MODEL_METADATA}
         WHERE model_name = ?
         ORDER BY created_at DESC`,
        [model_name]
      );

      return results || [];
    } catch (error) {
      console.error('[ModelMetadataRepository] Get all versions failed:', error);
      throw error;
    }
  }

  /**
   * Delete old model versions (keep only latest N versions)
   * Implements: Task 3.6
   */
  async deleteOldVersions(model_name, keepCount = 2) {
    const db = getDatabase();

    try {
      // Get all versions sorted by creation date
      const allVersions = await this.getAllVersions(model_name);

      if (allVersions.length <= keepCount) {
        console.log('[ModelMetadataRepository] No old versions to delete');
        return 0;
      }

      // Keep the latest N versions, delete the rest
      const versionsToDelete = allVersions.slice(keepCount);

      for (const version of versionsToDelete) {
        await db.runAsync(
          `DELETE FROM ${TABLES.MODEL_METADATA}
           WHERE id = ?`,
          [version.id]
        );
      }

      console.log(`[ModelMetadataRepository] Deleted ${versionsToDelete.length} old versions`);
      return versionsToDelete.length;
    } catch (error) {
      console.error('[ModelMetadataRepository] Delete old versions failed:', error);
      throw error;
    }
  }

  /**
   * Compare versions to check if update is needed
   * Implements: Task 3.3
   * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.replace('v', '').split('.').map(Number);
    const v2Parts = version2.replace('v', '').split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 > v2) return 1;
      if (v1 < v2) return -1;
    }

    return 0;
  }

  /**
   * Check if a newer version is available
   * Implements: Task 3.4
   */
  isUpdateAvailable(currentVersion, availableVersion) {
    return this.compareVersions(availableVersion, currentVersion) > 0;
  }

  /**
   * Get total storage used by all models
   * AC2: Monitor model storage limits
   */
  async getTotalStorageUsed() {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        `SELECT SUM(file_size_bytes) as total_bytes
         FROM ${TABLES.MODEL_METADATA}`
      );

      const totalBytes = result?.total_bytes || 0;
      const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

      return {
        bytes: totalBytes,
        mb: parseFloat(totalMB),
      };
    } catch (error) {
      console.error('[ModelMetadataRepository] Get total storage failed:', error);
      throw error;
    }
  }

  /**
   * Delete model metadata by id
   */
  async delete(id) {
    const db = getDatabase();

    try {
      await db.runAsync(
        `DELETE FROM ${TABLES.MODEL_METADATA} WHERE id = ?`,
        [id]
      );

      console.log('[ModelMetadataRepository] Deleted model metadata:', id);
    } catch (error) {
      console.error('[ModelMetadataRepository] Delete failed:', error);
      throw error;
    }
  }
}

export default new ModelMetadataRepository();
