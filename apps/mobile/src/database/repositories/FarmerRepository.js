// Farmer Repository
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.1 (Create FarmerRepository with CRUD operations)

import { BaseRepository } from './BaseRepository';
import { Farmer } from '../models/Farmer';
import { TABLES } from '../../constants/DatabaseConstants';
import { getDatabase } from '../config/db.config';

export class FarmerRepository extends BaseRepository {
  constructor() {
    super(TABLES.FARMERS, Farmer);
  }

  /**
   * Find farmer by phone number
   */
  async findByPhone(phone) {
    const farmers = await this.findBy('phone = ?', [phone]);
    return farmers.length > 0 ? farmers[0] : null;
  }

  /**
   * Find farmers by language preference
   */
  async findByLanguage(language) {
    return await this.findBy('language_preference = ?', [language]);
  }

  /**
   * Get farmer statistics
   */
  async getStatistics(farmerId) {
    const db = getDatabase();
    
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM ${TABLES.FIELDS} WHERE farmer_id = ?) as field_count,
          (SELECT COUNT(*) FROM ${TABLES.CROPS} c 
           INNER JOIN ${TABLES.FIELDS} f ON c.field_id = f.id 
           WHERE f.farmer_id = ?) as crop_count,
          (SELECT COUNT(*) FROM ${TABLES.QUERIES} WHERE farmer_id = ?) as query_count
      `;
      
      return await db.getFirstAsync(query, [farmerId, farmerId, farmerId]);
    } catch (error) {
      console.error('[FarmerRepository] GetStatistics failed:', error);
      throw error;
    }
  }
}

export default new FarmerRepository();

