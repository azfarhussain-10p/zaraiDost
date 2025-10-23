// Supplier Repository
// Story 3.5: Local Supplier Integration
// Database operations for suppliers and product availability

import BaseRepository from './BaseRepository';
import { AVAILABILITY_STATUS, SEARCH_CONFIG } from '../../constants/SupplierConstants';

/**
 * Supplier Repository
 * Handles all database operations for suppliers
 *
 * Implements:
 * - AC1: Supplier database operations
 * - AC2: Location-based queries
 * - AC3: Contact information retrieval
 * - AC4: Product availability management
 * - AC5: Alternative product lookups
 */
class SupplierRepository extends BaseRepository {
  constructor() {
    super('suppliers');
  }

  /**
   * Create a new supplier
   * AC1: Supplier database
   */
  async createSupplier(supplierData) {
    const {
      id,
      name,
      nameUr = null,
      type,
      phone = null,
      whatsappNumber = null,
      email = null,
      address,
      addressUr = null,
      city,
      cityUr = null,
      province,
      provinceUr = null,
      latitude,
      longitude,
      businessHours = null,
      isVerified = false,
      verifiedAt = null,
      rating = 0.0,
      totalRatings = 0,
    } = supplierData;

    const query = `
      INSERT INTO suppliers (
        id, name, type, phone, whatsapp_number, email,
        address, city, province, latitude, longitude,
        business_hours, is_verified, verified_at,
        rating, total_ratings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = Date.now();
    const params = [
      id,
      name,
      type,
      phone,
      whatsappNumber,
      email,
      address,
      city,
      province,
      latitude,
      longitude,
      businessHours,
      isVerified ? 1 : 0,
      verifiedAt,
      rating,
      totalRatings,
      now,
      now,
    ];

    await this.db.runAsync(query, params);
    return id;
  }

  /**
   * Get supplier by ID
   * AC1, AC3: Retrieve supplier with contact info
   */
  async getSupplierById(supplierId) {
    const query = `
      SELECT * FROM suppliers WHERE id = ?
    `;

    const supplier = await this.db.getFirstAsync(query, [supplierId]);
    return supplier ? this._formatSupplier(supplier) : null;
  }

  /**
   * Find nearest suppliers to a location
   * AC2: Nearest suppliers based on farmer location
   *
   * Uses Haversine formula for distance calculation
   * SQLite doesn't have native geospatial functions
   */
  async findNearestSuppliers(latitude, longitude, radiusKm = SEARCH_CONFIG.DEFAULT_RADIUS_KM, limit = SEARCH_CONFIG.MAX_RESULTS) {
    // Haversine formula in SQLite
    // distance = 2 * R * asin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
    // R = Earth's radius in km (6371)

    const query = `
      SELECT *,
        (
          2 * 6371 * asin(
            sqrt(
              pow(sin(radians((latitude - ?) / 2)), 2) +
              cos(radians(?)) * cos(radians(latitude)) *
              pow(sin(radians((longitude - ?) / 2)), 2)
            )
          )
        ) AS distance_km
      FROM suppliers
      WHERE (
        2 * 6371 * asin(
          sqrt(
            pow(sin(radians((latitude - ?) / 2)), 2) +
            cos(radians(?)) * cos(radians(latitude)) *
            pow(sin(radians((longitude - ?) / 2)), 2)
          )
        )
      ) <= ?
      ORDER BY distance_km ASC
      LIMIT ?
    `;

    const params = [
      latitude, latitude, longitude,  // For distance calculation
      latitude, latitude, longitude,  // For WHERE clause
      radiusKm,
      limit,
    ];

    const suppliers = await this.db.getAllAsync(query, params);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Get suppliers by city
   * AC2: Location-based supplier search
   */
  async getSuppliersByCity(city, limit = SEARCH_CONFIG.MAX_RESULTS) {
    const query = `
      SELECT * FROM suppliers
      WHERE city = ?
      ORDER BY rating DESC, total_ratings DESC
      LIMIT ?
    `;

    const suppliers = await this.db.getAllAsync(query, [city, limit]);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Get suppliers by province
   */
  async getSuppliersByProvince(province, limit = SEARCH_CONFIG.MAX_RESULTS) {
    const query = `
      SELECT * FROM suppliers
      WHERE province = ?
      ORDER BY rating DESC, total_ratings DESC
      LIMIT ?
    `;

    const suppliers = await this.db.getAllAsync(query, [province, limit]);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Get suppliers carrying a specific product
   * AC1: Link suppliers to products
   */
  async getSuppliersForProduct(productId, latitude = null, longitude = null, radiusKm = SEARCH_CONFIG.DEFAULT_RADIUS_KM) {
    let query;
    let params;

    if (latitude !== null && longitude !== null) {
      // Location-based search with distance
      query = `
        SELECT s.*,
          sp.availability_status,
          sp.estimated_price_pkr,
          sp.last_updated,
          (
            2 * 6371 * asin(
              sqrt(
                pow(sin(radians((s.latitude - ?) / 2)), 2) +
                cos(radians(?)) * cos(radians(s.latitude)) *
                pow(sin(radians((s.longitude - ?) / 2)), 2)
              )
            )
          ) AS distance_km
        FROM suppliers s
        INNER JOIN supplier_products sp ON s.id = sp.supplier_id
        WHERE sp.product_id = ?
          AND sp.availability_status != 'out_of_stock'
          AND (
            2 * 6371 * asin(
              sqrt(
                pow(sin(radians((s.latitude - ?) / 2)), 2) +
                cos(radians(?)) * cos(radians(s.latitude)) *
                pow(sin(radians((s.longitude - ?) / 2)), 2)
              )
            )
          ) <= ?
        ORDER BY sp.availability_status = 'in_stock' DESC, distance_km ASC
        LIMIT ?
      `;

      params = [
        latitude, latitude, longitude,  // For distance calc
        productId,
        latitude, latitude, longitude,  // For WHERE clause
        radiusKm,
        SEARCH_CONFIG.MAX_RESULTS,
      ];
    } else {
      // Simple search without location
      query = `
        SELECT s.*,
          sp.availability_status,
          sp.estimated_price_pkr,
          sp.last_updated
        FROM suppliers s
        INNER JOIN supplier_products sp ON s.id = sp.supplier_id
        WHERE sp.product_id = ?
          AND sp.availability_status != 'out_of_stock'
        ORDER BY sp.availability_status = 'in_stock' DESC, s.rating DESC
        LIMIT ?
      `;

      params = [productId, SEARCH_CONFIG.MAX_RESULTS];
    }

    const suppliers = await this.db.getAllAsync(query, params);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Update supplier rating
   */
  async updateRating(supplierId, newRating) {
    const query = `
      UPDATE suppliers
      SET rating = (
        SELECT (rating * total_ratings + ?) / (total_ratings + 1)
        FROM suppliers
        WHERE id = ?
      ),
      total_ratings = total_ratings + 1,
      updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [newRating, supplierId, Date.now(), supplierId]);
  }

  /**
   * Add product to supplier
   * AC1, AC4: Link products with availability
   */
  async addSupplierProduct(supplierId, productId, availability = AVAILABILITY_STATUS.UNKNOWN, estimatedPricePkr = null) {
    const query = `
      INSERT OR REPLACE INTO supplier_products (
        supplier_id, product_id, availability_status,
        last_updated, updated_by, estimated_price_pkr
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      supplierId,
      productId,
      availability,
      Date.now(),
      'admin',
      estimatedPricePkr,
    ];

    await this.db.runAsync(query, params);
  }

  /**
   * Update product availability
   * AC4: Product availability status tracking
   */
  async updateProductAvailability(supplierId, productId, availabilityStatus, farmerId = 'admin', estimatedPricePkr = null) {
    const query = `
      UPDATE supplier_products
      SET availability_status = ?,
          last_updated = ?,
          updated_by = ?
          ${estimatedPricePkr !== null ? ', estimated_price_pkr = ?' : ''}
      WHERE supplier_id = ? AND product_id = ?
    `;

    const params = estimatedPricePkr !== null
      ? [availabilityStatus, Date.now(), farmerId, estimatedPricePkr, supplierId, productId]
      : [availabilityStatus, Date.now(), farmerId, supplierId, productId];

    await this.db.runAsync(query, params);
  }

  /**
   * Get product availability at supplier
   * AC4: Check availability status
   */
  async getProductAvailability(supplierId, productId) {
    const query = `
      SELECT * FROM supplier_products
      WHERE supplier_id = ? AND product_id = ?
    `;

    return await this.db.getFirstAsync(query, [supplierId, productId]);
  }

  /**
   * Get alternative products
   * AC5: Alternative products suggested if primary unavailable
   */
  async getAlternativeProducts(productId) {
    const query = `
      SELECT pa.*, tp.name as alternative_name
      FROM product_alternatives pa
      LEFT JOIN treatment_products tp ON pa.alternative_product_id = tp.id
      WHERE pa.product_id = ?
      ORDER BY pa.effectiveness_ratio DESC
    `;

    return await this.db.getAllAsync(query, [productId]);
  }

  /**
   * Add product alternative
   * AC5: Configure alternative products
   */
  async addProductAlternative(productId, alternativeProductId, equivalenceType, effectivenessRatio = 1.0, notes = null) {
    const query = `
      INSERT OR REPLACE INTO product_alternatives (
        product_id, alternative_product_id, equivalence_type,
        effectiveness_ratio, notes
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [productId, alternativeProductId, equivalenceType, effectivenessRatio, notes]);
  }

  /**
   * Get all verified suppliers
   */
  async getVerifiedSuppliers(limit = SEARCH_CONFIG.MAX_RESULTS) {
    const query = `
      SELECT * FROM suppliers
      WHERE is_verified = 1
      ORDER BY rating DESC, total_ratings DESC
      LIMIT ?
    `;

    const suppliers = await this.db.getAllAsync(query, [limit]);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Search suppliers by name
   */
  async searchSuppliersByName(searchTerm, limit = SEARCH_CONFIG.MAX_RESULTS) {
    const query = `
      SELECT * FROM suppliers
      WHERE name LIKE ? OR city LIKE ? OR address LIKE ?
      ORDER BY is_verified DESC, rating DESC
      LIMIT ?
    `;

    const term = `%${searchTerm}%`;
    const suppliers = await this.db.getAllAsync(query, [term, term, term, limit]);
    return suppliers.map(s => this._formatSupplier(s));
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(supplierId) {
    const queries = {
      totalProducts: 'SELECT COUNT(*) as count FROM supplier_products WHERE supplier_id = ?',
      inStockProducts: 'SELECT COUNT(*) as count FROM supplier_products WHERE supplier_id = ? AND availability_status = "in_stock"',
      totalFavorites: 'SELECT COUNT(*) as count FROM farmer_favorite_suppliers WHERE supplier_id = ?',
    };

    const [totalProducts, inStockProducts, totalFavorites] = await Promise.all([
      this.db.getFirstAsync(queries.totalProducts, [supplierId]),
      this.db.getFirstAsync(queries.inStockProducts, [supplierId]),
      this.db.getFirstAsync(queries.totalFavorites, [supplierId]),
    ]);

    return {
      totalProducts: totalProducts?.count || 0,
      inStockProducts: inStockProducts?.count || 0,
      totalFavorites: totalFavorites?.count || 0,
    };
  }

  /**
   * Batch insert suppliers (for seeding/sync)
   */
  async batchInsertSuppliers(suppliers) {
    const promises = suppliers.map(supplier => this.createSupplier(supplier));
    return await Promise.all(promises);
  }

  /**
   * Batch insert supplier products
   */
  async batchInsertSupplierProducts(supplierProducts) {
    const promises = supplierProducts.map(sp =>
      this.addSupplierProduct(sp.supplierId, sp.productId, sp.availabilityStatus, sp.estimatedPricePkr)
    );
    return await Promise.all(promises);
  }

  /**
   * Format supplier object
   * Converts database integers to booleans, etc.
   */
  _formatSupplier(supplier) {
    if (!supplier) return null;

    return {
      ...supplier,
      isVerified: supplier.is_verified === 1,
      latitude: supplier.latitude || null,
      longitude: supplier.longitude || null,
      rating: supplier.rating || 0,
      totalRatings: supplier.total_ratings || 0,
      distanceKm: supplier.distance_km || null,
    };
  }
}

export default SupplierRepository;
