// Query Repository
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.4 (Create QueryRepository with CRUD operations)

import { BaseRepository } from './BaseRepository';
import { Query } from '../models/Query';
import { TABLES } from '../../constants/DatabaseConstants';

export class QueryRepository extends BaseRepository {
  constructor() {
    super(TABLES.QUERIES, Query);
  }

  /**
   * Find queries by farmer ID
   */
  async findByFarmerId(farmerId, limit = 50) {
    return await this.findBy('farmer_id = ?', [farmerId], 'timestamp DESC').then(results => 
      results.slice(0, limit)
    );
  }

  /**
   * Find queries by type
   */
  async findByType(queryType) {
    return await this.findBy('query_type = ?', [queryType], 'timestamp DESC');
  }

  /**
   * Search queries by text
   */
  async searchByText(searchTerm, farmerId = null) {
    const where = farmerId
      ? 'query_text LIKE ? AND farmer_id = ?'
      : 'query_text LIKE ?';
    const params = farmerId
      ? [`%${searchTerm}%`, farmerId]
      : [`%${searchTerm}%`];
    
    return await this.findBy(where, params, 'timestamp DESC');
  }

  /**
   * Delete old queries (older than specified days)
   * Implements: Task 5.2 (Cleanup for old queries)
   */
  async deleteOlderThan(days) {
    const db = getDatabase();
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const query = `DELETE FROM ${this.tableName} WHERE timestamp < ?`;
      const result = await db.runAsync(query, [cutoffDate.toISOString()]);
      
      console.log(`[QueryRepository] Deleted ${result.changes} old queries`);
      return result.changes;
    } catch (error) {
      console.error('[QueryRepository] DeleteOlderThan failed:', error);
      throw error;
    }
  }

  /**
   * Get recent queries (last N queries)
   */
  async getRecent(limit = 10) {
    return await this.findAll('timestamp DESC', limit);
  }
}

// Need to import getDatabase here for deleteOlderThan
import { getDatabase } from '../config/db.config';

export default new QueryRepository();

