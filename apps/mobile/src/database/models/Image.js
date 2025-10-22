// Image Model
// Story 1.1: Local Data Storage Foundation

export class Image {
  constructor(data) {
    this.id = data.id;
    this.crop_id = data.crop_id || null;
    this.local_file_path = data.local_file_path;
    this.remote_url = data.remote_url || null;
    this.analysis_result_json = data.analysis_result_json || null;
    this.confidence_score = data.confidence_score || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.created_at = data.created_at || new Date().toISOString();
    this.sync_status = data.sync_status || 'pending';
  }

  toJSON() {
    return {
      id: this.id,
      crop_id: this.crop_id,
      local_file_path: this.local_file_path,
      remote_url: this.remote_url,
      analysis_result_json: this.analysis_result_json,
      confidence_score: this.confidence_score,
      timestamp: this.timestamp,
      created_at: this.created_at,
      sync_status: this.sync_status,
    };
  }

  getAnalysisResult() {
    if (this.analysis_result_json) {
      try {
        return JSON.parse(this.analysis_result_json);
      } catch (error) {
        console.error('[Image] Failed to parse analysis result:', error);
        return null;
      }
    }
    return null;
  }

  static fromDatabase(row) {
    return new Image(row);
  }
}

