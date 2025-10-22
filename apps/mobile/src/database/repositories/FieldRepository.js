// Field Repository
// Story 1.1: Local Data Storage Foundation
// Implements: Task 3.2 (Create FieldRepository with CRUD operations)

import { BaseRepository } from './BaseRepository';
import { Field } from '../models/Field';
import { TABLES } from '../../constants/DatabaseConstants';

export class FieldRepository extends BaseRepository {
  constructor() {
    super(TABLES.FIELDS, Field);
  }

  /**
   * Find all fields for a farmer
   */
  async findByFarmerId(farmerId) {
    return await this.findBy('farmer_id = ?', [farmerId], 'name ASC');
  }

  /**
   * Find fields by soil type
   */
  async findBySoilType(soilType) {
    return await this.findBy('soil_type = ?', [soilType]);
  }

  /**
   * Get total acreage for a farmer
   */
  async getTotalAcreage(farmerId) {
    const fields = await this.findByFarmerId(farmerId);
    return fields.reduce((total, field) => total + (field.size_acres || 0), 0);
  }
}

export default new FieldRepository();

