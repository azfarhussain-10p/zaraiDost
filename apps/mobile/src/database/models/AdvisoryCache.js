// AdvisoryCache Model
// Story 1.5: Offline Weather and Advisory Cache

export class AdvisoryCache {
  constructor(data) {
    this.id = data.id;
    this.advisory_type = data.advisory_type;
    this.title = data.title;
    this.content = data.content;
    this.priority = data.priority || 'normal';
    this.applicable_crops = data.applicable_crops || null;
    this.location_scope = data.location_scope || null;
    this.valid_from = data.valid_from || null;
    this.valid_until = data.valid_until || null;
    this.is_critical = data.is_critical || 0;
    this.data_source = data.data_source || null;
    this.last_updated = data.last_updated || new Date().toISOString();
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      advisory_type: this.advisory_type,
      title: this.title,
      content: this.content,
      priority: this.priority,
      applicable_crops: this.applicable_crops,
      location_scope: this.location_scope,
      valid_from: this.valid_from,
      valid_until: this.valid_until,
      is_critical: this.is_critical,
      data_source: this.data_source,
      last_updated: this.last_updated,
      created_at: this.created_at,
    };
  }

  static fromDatabase(row) {
    return new AdvisoryCache(row);
  }

  /**
   * Get parsed crops array
   */
  getApplicableCropsArray() {
    if (!this.applicable_crops) return [];
    try {
      return JSON.parse(this.applicable_crops);
    } catch (error) {
      console.error('Error parsing applicable_crops:', error);
      return [];
    }
  }

  /**
   * Set applicable crops from array
   */
  setApplicableCrops(cropsArray) {
    this.applicable_crops = JSON.stringify(cropsArray);
  }

  /**
   * Check if advisory is currently valid
   */
  isValid() {
    const now = new Date().toISOString().split('T')[0];

    // If no validity dates, assume always valid
    if (!this.valid_from && !this.valid_until) return true;

    // Check if we're within the validity period
    const isAfterValidFrom = !this.valid_from || now >= this.valid_from;
    const isBeforeValidUntil = !this.valid_until || now <= this.valid_until;

    return isAfterValidFrom && isBeforeValidUntil;
  }

  /**
   * Check if advisory has expired
   */
  isExpired() {
    if (!this.valid_until) return false;
    const now = new Date().toISOString().split('T')[0];
    return now > this.valid_until;
  }

  /**
   * Get days until expiration
   */
  getDaysUntilExpiration() {
    if (!this.valid_until) return null;

    const now = new Date();
    const expiry = new Date(this.valid_until);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get priority badge color
   */
  getPriorityColor() {
    const colors = {
      critical: '#EF4444', // red-500
      high: '#F97316', // orange-500
      normal: '#3B82F6', // blue-500
      low: '#6B7280', // gray-500
    };
    return colors[this.priority] || colors.normal;
  }

  /**
   * Check if advisory is critical
   */
  isCritical() {
    return this.is_critical === 1 || this.priority === 'critical';
  }
}
