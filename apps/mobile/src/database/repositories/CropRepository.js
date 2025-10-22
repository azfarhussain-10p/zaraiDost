// Crop Repository
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.3 (Create CropRepository with CRUD operations)

import { BaseRepository } from './BaseRepository';
import { Crop } from '../models/Crop';
import { TABLES } from '../../constants/DatabaseConstants';
import { getDatabase } from '../config/db.config';

export class CropRepository extends BaseRepository {
  constructor() {
    super(TABLES.CROPS, Crop);
  }

  /**
   * Find crops by field ID
   */
  async findByFieldId(fieldId) {
    return await this.findBy('field_id = ?', [fieldId], 'planting_date DESC');
  }

  /**
   * Find crops by type
   */
  async findByCropType(cropType) {
    return await this.findBy('crop_type = ?', [cropType]);
  }

  /**
   * Find crops by status
   */
  async findByStatus(status) {
    return await this.findBy('status = ?', [status]);
  }

  /**
   * Find active crops (planted or growing)
   */
  async findActiveCrops() {
    return await this.findBy("status IN ('planted', 'growing')", []);
  }

  /**
   * Get crops for a farmer (via fields)
   */
  async findByFarmerId(farmerId) {
    const db = getDatabase();
    
    try {
      const query = `
        SELECT c.* FROM ${TABLES.CROPS} c
        INNER JOIN ${TABLES.FIELDS} f ON c.field_id = f.id
        WHERE f.farmer_id = ?
        ORDER BY c.created_at DESC
      `;
      
      const rows = await db.getAllAsync(query, [farmerId]);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error('[CropRepository] FindByFarmerId failed:', error);
      throw error;
    }
  }

  /**
   * Update crop status
   */
  async updateStatus(cropId, status) {
    return await this.update(cropId, { status });
  }
}

export default new CropRepository();

