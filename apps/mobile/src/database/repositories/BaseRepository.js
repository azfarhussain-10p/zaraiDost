// Base Repository Pattern
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.6 (Generic base repository class for common operations)

import { getDatabase } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Repository class with common CRUD operations
 * All specific repositories extend this class
 */
export class BaseRepository {
  constructor(tableName, ModelClass) {
    this.tableName = tableName;
    this.ModelClass = ModelClass;
  }

  /**
   * Create a new record
   * Returns the created record with generated ID
   */
  async create(data) {
    const db = getDatabase();
    
    try {
      // Generate UUID if not provided
      if (!data.id) {
        data.id = uuidv4();
      }

      // Set timestamps
      const now = new Date().toISOString();
      data.created_at = data.created_at || now;
      data.updated_at = now;
      data.sync_status = data.sync_status || 'pending';

      // Build INSERT query dynamically
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => data[key]);

      const query = `
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders})
      `;

      await db.runAsync(query, values);

      return this.ModelClass.fromDatabase(data);
    } catch (error) {
      console.error(`[${this.tableName}] Create failed:`, error);
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const db = getDatabase();
    
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const row = await db.getFirstAsync(query, [id]);
      
      return row ? this.ModelClass.fromDatabase(row) : null;
    } catch (error) {
      console.error(`[${this.tableName}] FindById failed:`, error);
      throw error;
    }
  }

  /**
   * Find all records
   */
  async findAll(orderBy = 'created_at DESC', limit = null) {
    const db = getDatabase();
    
    try {
      let query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`;
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      
      const rows = await db.getAllAsync(query);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error(`[${this.tableName}] FindAll failed:`, error);
      throw error;
    }
  }

  /**
   * Find records by condition
   */
  async findBy(where, params = [], orderBy = 'created_at DESC') {
    const db = getDatabase();
    
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${where}
        ORDER BY ${orderBy}
      `;
      
      const rows = await db.getAllAsync(query, params);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error(`[${this.tableName}] FindBy failed:`, error);
      throw error;
    }
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const db = getDatabase();
    
    try {
      // Update timestamp
      data.updated_at = new Date().toISOString();
      data.sync_status = 'pending'; // Mark as pending sync

      // Build UPDATE query dynamically
      const keys = Object.keys(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = [...keys.map(key => data[key]), id];

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = ?
      `;

      const result = await db.runAsync(query, values);
      
      if (result.changes === 0) {
        throw new Error(`Record with id ${id} not found`);
      }

      return await this.findById(id);
    } catch (error) {
      console.error(`[${this.tableName}] Update failed:`, error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    const db = getDatabase();
    
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await db.runAsync(query, [id]);
      
      return result.changes > 0;
    } catch (error) {
      console.error(`[${this.tableName}] Delete failed:`, error);
      throw error;
    }
  }

  /**
   * Count all records
   */
  async count(where = '1=1', params = []) {
    const db = getDatabase();
    
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`;
      const result = await db.getFirstAsync(query, params);
      return result?.count || 0;
    } catch (error) {
      console.error(`[${this.tableName}] Count failed:`, error);
      throw error;
    }
  }

  /**
   * Find records pending sync
   */
  async findPendingSync() {
    return await this.findBy('sync_status = ?', ['pending']);
  }

  /**
   * Mark record as synced
   */
  async markAsSynced(id) {
    return await this.update(id, { sync_status: 'synced' });
  }
}

