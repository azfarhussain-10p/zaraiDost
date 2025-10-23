// Availability Tracker Service
// Story 3.5: Local Supplier Integration
// Tracks and manages product availability at suppliers

import SupplierRepository from '../../database/repositories/SupplierRepository';
import { getDatabase } from '../../database/config/db.config';
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_CONFIDENCE,
  STALENESS_THRESHOLDS,
} from '../../constants/SupplierConstants';

/**
 * Availability Tracker Service
 * Manages product availability tracking and crowdsourced updates
 *
 * Implements:
 * - AC4: Product availability status when known
 */
class AvailabilityTracker {
  constructor() {
    this.supplierRepo = new SupplierRepository();
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async _initDB() {
    if (!this.db) {
      this.db = getDatabase();
    }
  }

  /**
   * Update product availability at a supplier
   * AC4: Product availability status tracking
   *
   * @param {string} supplierId - Supplier ID
   * @param {string} productId - Product ID
   * @param {string} status - Availability status
   * @param {string} farmerId - Farmer who provided update
   * @param {number} estimatedPrice - Optional price in PKR
   * @returns {boolean} Success status
   */
  async updateAvailability(supplierId, productId, status, farmerId = 'admin', estimatedPrice = null) {
    await this._initDB();

    try {
      await this.supplierRepo.updateProductAvailability(
        supplierId,
        productId,
        status,
        farmerId,
        estimatedPrice
      );

      // Record farmer contribution for gamification
      if (farmerId !== 'admin') {
        await this._recordContribution(farmerId, 'availability_update', `${supplierId}-${productId}`);
      }

      console.log(`[AvailabilityTracker] Updated ${productId} at ${supplierId} to ${status}`);
      return true;
    } catch (error) {
      console.error('[AvailabilityTracker] Failed to update availability:', error);
      return false;
    }
  }

  /**
   * Get availability confidence score
   * Based on how recent the data is
   *
   * @param {number} lastUpdated - Timestamp of last update
   * @returns {object} Confidence level and age in days
   */
  getAvailabilityConfidence(lastUpdated) {
    if (!lastUpdated) {
      return {
        level: AVAILABILITY_CONFIDENCE.UNKNOWN,
        daysOld: null,
        isStale: true,
      };
    }

    const now = Date.now();
    const daysOld = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

    let level;
    let isStale = false;

    if (daysOld <= STALENESS_THRESHOLDS.FRESH) {
      level = AVAILABILITY_CONFIDENCE.HIGH;
    } else if (daysOld <= STALENESS_THRESHOLDS.MODERATE) {
      level = AVAILABILITY_CONFIDENCE.MEDIUM;
    } else {
      level = AVAILABILITY_CONFIDENCE.LOW;
      isStale = daysOld > STALENESS_THRESHOLDS.STALE;
    }

    return {
      level,
      daysOld,
      isStale,
    };
  }

  /**
   * Get stale availability records
   * Returns suppliers with outdated availability data
   */
  async getStaleAvailabilityRecords(thresholdDays = STALENESS_THRESHOLDS.MODERATE) {
    await this._initDB();

    const thresholdTimestamp = Date.now() - (thresholdDays * 24 * 60 * 60 * 1000);

    const query = `
      SELECT
        sp.*,
        s.name as supplier_name,
        s.city
      FROM supplier_products sp
      INNER JOIN suppliers s ON sp.supplier_id = s.id
      WHERE sp.last_updated < ? OR sp.last_updated IS NULL
      ORDER BY sp.last_updated ASC
    `;

    return await this.db.getAllAsync(query, [thresholdTimestamp]);
  }

  /**
   * Get availability statistics for a supplier
   */
  async getSupplierAvailabilityStats(supplierId) {
    await this._initDB();

    const query = `
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN availability_status = 'in_stock' THEN 1 ELSE 0 END) as in_stock,
        SUM(CASE WHEN availability_status = 'low_stock' THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN availability_status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN availability_status = 'unknown' THEN 1 ELSE 0 END) as unknown,
        AVG(CASE WHEN last_updated IS NOT NULL
          THEN (? - last_updated) / (1000.0 * 60 * 60 * 24)
          ELSE NULL END) as avg_days_since_update
      FROM supplier_products
      WHERE supplier_id = ?
    `;

    return await this.db.getFirstAsync(query, [Date.now(), supplierId]);
  }

  /**
   * Get farmer's contribution stats
   */
  async getFarmerContributions(farmerId) {
    await this._initDB();

    const query = `
      SELECT
        contribution_type,
        COUNT(*) as count,
        SUM(points) as total_points
      FROM farmer_contributions
      WHERE farmer_id = ?
      GROUP BY contribution_type
    `;

    return await this.db.getAllAsync(query, [farmerId]);
  }

  /**
   * Record farmer contribution for data updates
   */
  async _recordContribution(farmerId, contributionType, referenceId = null) {
    await this._initDB();

    const id = `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO farmer_contributions (
        id, farmer_id, contribution_type, reference_id, points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [
      id,
      farmerId,
      contributionType,
      referenceId,
      1, // 1 point per contribution
      Date.now(),
    ]);
  }

  /**
   * Batch update multiple products' availability
   */
  async batchUpdateAvailability(updates) {
    const promises = updates.map(update =>
      this.updateAvailability(
        update.supplierId,
        update.productId,
        update.status,
        update.farmerId,
        update.estimatedPrice
      )
    );

    return await Promise.all(promises);
  }

  /**
   * Get products with unknown availability
   */
  async getProductsWithUnknownAvailability(supplierId = null) {
    await this._initDB();

    let query;
    let params;

    if (supplierId) {
      query = `
        SELECT * FROM supplier_products
        WHERE availability_status = 'unknown'
          AND supplier_id = ?
      `;
      params = [supplierId];
    } else {
      query = `
        SELECT sp.*, s.name as supplier_name, s.city
        FROM supplier_products sp
        INNER JOIN suppliers s ON sp.supplier_id = s.id
        WHERE sp.availability_status = 'unknown'
        ORDER BY s.rating DESC
      `;
      params = [];
    }

    return await this.db.getAllAsync(query, params);
  }
}

export default AvailabilityTracker;
