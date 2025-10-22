// Farmer Model
// Story 1.1: Local Data Storage Foundation

export class Farmer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone || null;
    this.location = data.location || null;
    this.language_preference = data.language_preference || 'ur';
    this.organic_preference = data.organic_preference || 0;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.sync_status = data.sync_status || 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      location: this.location,
      language_preference: this.language_preference,
      organic_preference: this.organic_preference,
      created_at: this.created_at,
      updated_at: this.updated_at,
      sync_status: this.sync_status,
    };
  }

  static fromDatabase(row) {
    return new Farmer(row);
  }
}

