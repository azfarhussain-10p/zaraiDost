// Crop Model
// Story 1.1: Local Data Storage Foundation

export class Crop {
  constructor(data) {
    this.id = data.id;
    this.field_id = data.field_id;
    this.crop_type = data.crop_type;
    this.planting_date = data.planting_date || null;
    this.expected_harvest_date = data.expected_harvest_date || null;
    this.status = data.status || 'planted';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.sync_status = data.sync_status || 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      field_id: this.field_id,
      crop_type: this.crop_type,
      planting_date: this.planting_date,
      expected_harvest_date: this.expected_harvest_date,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      sync_status: this.sync_status,
    };
  }

  static fromDatabase(row) {
    return new Crop(row);
  }
}

