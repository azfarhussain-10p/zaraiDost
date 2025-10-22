// Query Model
// Story 1.1: Local Data Storage Foundation

export class Query {
  constructor(data) {
    this.id = data.id;
    this.farmer_id = data.farmer_id;
    this.query_text = data.query_text;
    this.response_text = data.response_text || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.query_type = data.query_type || 'general';
    this.confidence_score = data.confidence_score || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.sync_status = data.sync_status || 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      farmer_id: this.farmer_id,
      query_text: this.query_text,
      response_text: this.response_text,
      timestamp: this.timestamp,
      query_type: this.query_type,
      confidence_score: this.confidence_score,
      created_at: this.created_at,
      sync_status: this.sync_status,
    };
  }

  static fromDatabase(row) {
    return new Query(row);
  }
}

