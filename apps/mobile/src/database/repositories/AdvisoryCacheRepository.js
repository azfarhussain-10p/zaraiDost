// AdvisoryCacheRepository
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 1 (Advisory cache storage and retrieval)

import { BaseRepository } from './BaseRepository';
import { AdvisoryCache } from '../models/AdvisoryCache';
import { TABLES } from '../../constants/DatabaseConstants';
import { RETENTION, ADVISORY_TYPES } from '../../constants/CacheConstants';
import { getDatabase } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for managing advisory cache data
 * Handles storage, retrieval, and cleanup of farming advisories
 */
export class AdvisoryCacheRepository extends BaseRepository {
  constructor() {
    super(TABLES.ADVISORIES_CACHE, AdvisoryCache);
  }

  /**
   * Save advisory data
   * Inserts or replaces existing advisory
   */
  async saveAdvisory(advisoryData) {
    const db = getDatabase();

    try {
      const id = advisoryData.id || uuidv4();
      const now = new Date().toISOString();

      const data = {
        id,
        advisory_type: advisoryData.advisory_type,
        title: advisoryData.title,
        content: advisoryData.content,
        priority: advisoryData.priority || 'normal',
        applicable_crops: advisoryData.applicable_crops,
        location_scope: advisoryData.location_scope,
        valid_from: advisoryData.valid_from,
        valid_until: advisoryData.valid_until,
        is_critical: advisoryData.is_critical || 0,
        data_source: advisoryData.data_source,
        last_updated: now,
        created_at: advisoryData.created_at || now,
      };

      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => data[key]);

      const query = `
        INSERT OR REPLACE INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders})
      `;

      await db.runAsync(query, values);

      return this.findById(id);
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Save advisory failed:', error);
      throw error;
    }
  }

  /**
   * Get advisories by type
   */
  async getAdvisoriesByType(advisoryType, limit = RETENTION.ADVISORIES_PER_TYPE) {
    const db = getDatabase();

    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE advisory_type = ?
        ORDER BY is_critical DESC, priority DESC, valid_until DESC
        LIMIT ?
      `;

      const rows = await db.getAllAsync(query, [advisoryType, limit]);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get advisories by type failed:', error);
      throw error;
    }
  }

  /**
   * Get all valid (non-expired) advisories
   */
  async getValidAdvisories(advisoryType = null) {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE (valid_until IS NULL OR valid_until >= ?)
      `;

      const params = [today];

      if (advisoryType) {
        query += ' AND advisory_type = ?';
        params.push(advisoryType);
      }

      query += ' ORDER BY is_critical DESC, priority DESC, valid_until DESC';

      const rows = await db.getAllAsync(query, params);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get valid advisories failed:', error);
      throw error;
    }
  }

  /**
   * Get critical advisories
   */
  async getCriticalAdvisories() {
    return await this.findBy(
      'is_critical = 1 OR priority = ?',
      ['critical'],
      'valid_until DESC'
    );
  }

  /**
   * Get advisories for specific crops
   */
  async getAdvisoriesForCrops(crops) {
    const db = getDatabase();

    try {
      // Build query to search for any of the crops in the JSON array
      const cropConditions = crops.map(() => 'applicable_crops LIKE ?').join(' OR ');
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${cropConditions}
        ORDER BY is_critical DESC, priority DESC, valid_until DESC
      `;

      const params = crops.map(crop => `%"${crop}"%`);
      const rows = await db.getAllAsync(query, params);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get advisories for crops failed:', error);
      throw error;
    }
  }

  /**
   * Delete expired advisories
   */
  async deleteExpiredAdvisories() {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    try {
      const query = `
        DELETE FROM ${this.tableName}
        WHERE valid_until IS NOT NULL
          AND valid_until < ?
          AND is_critical = 0
      `;

      const result = await db.runAsync(query, [today]);

      console.log(`[AdvisoryCacheRepository] Deleted ${result.changes} expired advisories`);

      return result.changes;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Delete expired advisories failed:', error);
      throw error;
    }
  }

  /**
   * Delete low-priority advisories to free up space
   * Keeps critical advisories and recent high-priority ones
   */
  async deleteLowPriorityAdvisories(keepCount = 3) {
    const db = getDatabase();

    try {
      // Delete low-priority advisories, keeping only the most recent ones
      const query = `
        DELETE FROM ${this.tableName}
        WHERE priority = 'low'
          AND id NOT IN (
            SELECT id FROM ${this.tableName}
            WHERE priority = 'low'
            ORDER BY last_updated DESC
            LIMIT ?
          )
      `;

      const result = await db.runAsync(query, [keepCount]);

      console.log(
        `[AdvisoryCacheRepository] Deleted ${result.changes} low-priority advisories`
      );

      return result.changes;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Delete low-priority advisories failed:', error);
      throw error;
    }
  }

  /**
   * Enforce retention limits per advisory type
   * Keep only the most recent N advisories per type
   */
  async enforceRetentionLimits() {
    const db = getDatabase();
    let totalDeleted = 0;

    try {
      // For each advisory type, keep only the most recent N advisories
      const types = [
        ADVISORY_TYPES.IRRIGATION,
        ADVISORY_TYPES.MARKET,
        ADVISORY_TYPES.CLIMATE,
      ];

      for (const type of types) {
        const query = `
          DELETE FROM ${this.tableName}
          WHERE advisory_type = ?
            AND is_critical = 0
            AND id NOT IN (
              SELECT id FROM ${this.tableName}
              WHERE advisory_type = ?
              ORDER BY last_updated DESC
              LIMIT ?
            )
        `;

        const result = await db.runAsync(query, [
          type,
          type,
          RETENTION.ADVISORIES_PER_TYPE,
        ]);

        totalDeleted += result.changes;
      }

      console.log(
        `[AdvisoryCacheRepository] Enforced retention limits, deleted ${totalDeleted} advisories`
      );

      return totalDeleted;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Enforce retention limits failed:', error);
      throw error;
    }
  }

  /**
   * Get last updated timestamp for a specific advisory type
   */
  async getLastUpdated(advisoryType) {
    const db = getDatabase();

    try {
      const query = `
        SELECT MAX(last_updated) as last_updated
        FROM ${this.tableName}
        WHERE advisory_type = ?
      `;

      const result = await db.getFirstAsync(query, [advisoryType]);
      return result?.last_updated || null;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get last updated failed:', error);
      throw error;
    }
  }

  /**
   * Get total cache size for advisory data (approximate, in bytes)
   */
  async getCacheSize() {
    const db = getDatabase();

    try {
      const query = `
        SELECT SUM(
          LENGTH(title) +
          LENGTH(content) +
          LENGTH(COALESCE(applicable_crops, '')) +
          LENGTH(COALESCE(data_source, '')) +
          100
        ) as total_size
        FROM ${this.tableName}
      `;

      const result = await db.getFirstAsync(query);
      return result?.total_size || 0;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get cache size failed:', error);
      throw error;
    }
  }

  /**
   * Clear all advisories cache
   */
  async clearCache(advisoryType = null) {
    const db = getDatabase();

    try {
      let query = `DELETE FROM ${this.tableName}`;
      const params = [];

      if (advisoryType) {
        query += ' WHERE advisory_type = ?';
        params.push(advisoryType);
      }

      const result = await db.runAsync(query, params);

      console.log(
        `[AdvisoryCacheRepository] Cleared ${result.changes} advisory records` +
          (advisoryType ? ` for type ${advisoryType}` : '')
      );

      return result.changes;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Get count of advisories by type
   */
  async getCountByType(advisoryType) {
    return await this.count('advisory_type = ?', [advisoryType]);
  }

  /**
   * Get all advisory types with counts
   */
  async getAdvisoryStats() {
    const db = getDatabase();

    try {
      const query = `
        SELECT
          advisory_type,
          COUNT(*) as count,
          SUM(CASE WHEN is_critical = 1 THEN 1 ELSE 0 END) as critical_count,
          MAX(last_updated) as last_updated
        FROM ${this.tableName}
        GROUP BY advisory_type
      `;

      const rows = await db.getAllAsync(query);
      return rows;
    } catch (error) {
      console.error('[AdvisoryCacheRepository] Get advisory stats failed:', error);
      throw error;
    }
  }
}

export default new AdvisoryCacheRepository();
