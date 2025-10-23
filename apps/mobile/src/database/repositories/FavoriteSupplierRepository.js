// Favorite Supplier Repository
// Story 3.5: Local Supplier Integration
// Database operations for farmer's favorite suppliers

import BaseRepository from './BaseRepository';
import { FAVORITE_LIMITS } from '../../constants/SupplierConstants';

/**
 * Favorite Supplier Repository
 * Handles all database operations for farmer favorites
 *
 * Implements:
 * - AC7: User can mark suppliers as favorites
 */
class FavoriteSupplierRepository extends BaseRepository {
  constructor() {
    super('farmer_favorite_suppliers');
  }

  /**
   * Add a supplier to farmer's favorites
   * AC7: Mark suppliers as favorites
   */
  async addFavorite(farmerId, supplierId, notes = null) {
    // Check if already at limit
    const count = await this.getFavoriteCount(farmerId);
    if (count >= FAVORITE_LIMITS.MAX_FAVORITES) {
      throw new Error('FAVORITE_LIMIT_REACHED');
    }

    const query = `
      INSERT OR REPLACE INTO farmer_favorite_suppliers (
        farmer_id, supplier_id, notes, created_at
      ) VALUES (?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [farmerId, supplierId, notes, Date.now()]);
    return true;
  }

  /**
   * Remove a supplier from farmer's favorites
   * AC7: Manage favorites
   */
  async removeFavorite(farmerId, supplierId) {
    const query = `
      DELETE FROM farmer_favorite_suppliers
      WHERE farmer_id = ? AND supplier_id = ?
    `;

    const result = await this.db.runAsync(query, [farmerId, supplierId]);
    return result.changes > 0;
  }

  /**
   * Check if supplier is in farmer's favorites
   * AC7: Check favorite status
   */
  async isFavorite(farmerId, supplierId) {
    const query = `
      SELECT 1 FROM farmer_favorite_suppliers
      WHERE farmer_id = ? AND supplier_id = ?
    `;

    const result = await this.db.getFirstAsync(query, [farmerId, supplierId]);
    return result !== null;
  }

  /**
   * Get all favorite suppliers for a farmer
   * AC7: Retrieve favorites list
   */
  async getFavorites(farmerId, includeSupplierDetails = true) {
    if (!includeSupplierDetails) {
      const query = `
        SELECT * FROM farmer_favorite_suppliers
        WHERE farmer_id = ?
        ORDER BY created_at DESC
      `;

      return await this.db.getAllAsync(query, [farmerId]);
    }

    // Join with suppliers table to get full details
    const query = `
      SELECT
        ffs.*,
        s.id as supplier_id,
        s.name,
        s.type,
        s.phone,
        s.whatsapp_number,
        s.email,
        s.address,
        s.city,
        s.province,
        s.latitude,
        s.longitude,
        s.business_hours,
        s.is_verified,
        s.rating,
        s.total_ratings
      FROM farmer_favorite_suppliers ffs
      INNER JOIN suppliers s ON ffs.supplier_id = s.id
      WHERE ffs.farmer_id = ?
      ORDER BY ffs.created_at DESC
    `;

    const favorites = await this.db.getAllAsync(query, [farmerId]);
    return favorites.map(f => this._formatFavorite(f));
  }

  /**
   * Get favorite suppliers with location distance
   * AC7: Favorites sorted by distance
   */
  async getFavoritesWithDistance(farmerId, latitude, longitude) {
    const query = `
      SELECT
        ffs.*,
        s.*,
        (
          2 * 6371 * asin(
            sqrt(
              pow(sin(radians((s.latitude - ?) / 2)), 2) +
              cos(radians(?)) * cos(radians(s.latitude)) *
              pow(sin(radians((s.longitude - ?) / 2)), 2)
            )
          )
        ) AS distance_km
      FROM farmer_favorite_suppliers ffs
      INNER JOIN suppliers s ON ffs.supplier_id = s.id
      WHERE ffs.farmer_id = ?
      ORDER BY distance_km ASC
    `;

    const favorites = await this.db.getAllAsync(query, [latitude, latitude, longitude, farmerId]);
    return favorites.map(f => this._formatFavorite(f));
  }

  /**
   * Get favorite count for a farmer
   * AC7: Track favorites count
   */
  async getFavoriteCount(farmerId) {
    const query = `
      SELECT COUNT(*) as count
      FROM farmer_favorite_suppliers
      WHERE farmer_id = ?
    `;

    const result = await this.db.getFirstAsync(query, [farmerId]);
    return result?.count || 0;
  }

  /**
   * Update notes for a favorite supplier
   * AC7: Manage favorite details
   */
  async updateNotes(farmerId, supplierId, notes) {
    const query = `
      UPDATE farmer_favorite_suppliers
      SET notes = ?
      WHERE farmer_id = ? AND supplier_id = ?
    `;

    await this.db.runAsync(query, [notes, farmerId, supplierId]);
    return true;
  }

  /**
   * Get favorite suppliers by product
   * Returns favorite suppliers that carry a specific product
   */
  async getFavoritesByProduct(farmerId, productId) {
    const query = `
      SELECT
        ffs.*,
        s.*,
        sp.availability_status,
        sp.estimated_price_pkr
      FROM farmer_favorite_suppliers ffs
      INNER JOIN suppliers s ON ffs.supplier_id = s.id
      INNER JOIN supplier_products sp ON s.id = sp.supplier_id
      WHERE ffs.farmer_id = ?
        AND sp.product_id = ?
      ORDER BY sp.availability_status = 'in_stock' DESC, s.rating DESC
    `;

    const favorites = await this.db.getAllAsync(query, [farmerId, productId]);
    return favorites.map(f => this._formatFavorite(f));
  }

  /**
   * Get favorite suppliers by city
   */
  async getFavoritesByCity(farmerId, city) {
    const query = `
      SELECT
        ffs.*,
        s.*
      FROM farmer_favorite_suppliers ffs
      INNER JOIN suppliers s ON ffs.supplier_id = s.id
      WHERE ffs.farmer_id = ? AND s.city = ?
      ORDER BY s.rating DESC
    `;

    const favorites = await this.db.getAllAsync(query, [farmerId, city]);
    return favorites.map(f => this._formatFavorite(f));
  }

  /**
   * Get most popular favorite suppliers (across all farmers)
   * Social proof: Show which suppliers are favorited most
   */
  async getMostPopularSuppliers(limit = 10) {
    const query = `
      SELECT
        s.*,
        COUNT(ffs.farmer_id) as favorite_count
      FROM suppliers s
      LEFT JOIN farmer_favorite_suppliers ffs ON s.id = ffs.supplier_id
      GROUP BY s.id
      HAVING favorite_count > 0
      ORDER BY favorite_count DESC, s.rating DESC
      LIMIT ?
    `;

    const suppliers = await this.db.getAllAsync(query, [limit]);
    return suppliers.map(s => ({
      ...s,
      isVerified: s.is_verified === 1,
      favoriteCount: s.favorite_count || 0,
    }));
  }

  /**
   * Bulk add favorites (for sync)
   */
  async batchAddFavorites(farmerId, supplierIds) {
    const promises = supplierIds.map(supplierId =>
      this.addFavorite(farmerId, supplierId)
    );
    return await Promise.all(promises);
  }

  /**
   * Clear all favorites for a farmer
   */
  async clearAllFavorites(farmerId) {
    const query = `
      DELETE FROM farmer_favorite_suppliers
      WHERE farmer_id = ?
    `;

    const result = await this.db.runAsync(query, [farmerId]);
    return result.changes;
  }

  /**
   * Format favorite object
   */
  _formatFavorite(favorite) {
    if (!favorite) return null;

    return {
      ...favorite,
      isVerified: favorite.is_verified === 1,
      createdAt: favorite.created_at,
      distanceKm: favorite.distance_km || null,
    };
  }
}

export default FavoriteSupplierRepository;
