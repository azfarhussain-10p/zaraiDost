// Field Model
// Story 1.1: Local Data Storage Foundation

export class Field {
  constructor(data) {
    this.id = data.id;
    this.farmer_id = data.farmer_id;
    this.name = data.name;
    this.size_acres = data.size_acres || null;
    this.soil_type = data.soil_type || null;
    this.location_gps = data.location_gps || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.sync_status = data.sync_status || 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      farmer_id: this.farmer_id,
      name: this.name,
      size_acres: this.size_acres,
      soil_type: this.soil_type,
      location_gps: this.location_gps,
      created_at: this.created_at,
      updated_at: this.updated_at,
      sync_status: this.sync_status,
    };
  }

  static fromDatabase(row) {
    return new Field(row);
  }
}

