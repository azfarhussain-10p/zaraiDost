// Supplier Search Service
// Story 3.5: Local Supplier Integration
// Intelligent supplier search with location-based queries

import SupplierRepository from '../../database/repositories/SupplierRepository';
import FavoriteSupplierRepository from '../../database/repositories/FavoriteSupplierRepository';
import {
  SEARCH_CONFIG,
  SEARCH_RADIUS,
  SORT_OPTIONS,
  AVAILABILITY_STATUS,
} from '../../constants/SupplierConstants';

/**
 * Supplier Search Service
 * Provides intelligent supplier search functionality
 *
 * Implements:
 * - AC1: Supplier database linked to treatment recommendations
 * - AC2: Nearest suppliers based on location
 * - AC4: Product availability filtering
 * - AC5: Alternative products when primary unavailable
 */
class SupplierSearchService {
  constructor() {
    this.supplierRepo = new SupplierRepository();
    this.favoriteRepo = new FavoriteSupplierRepository();
  }

  /**
   * Find nearest suppliers for a treatment product
   * AC1, AC2: Location-based supplier search
   *
   * @param {string} productId - Treatment product ID
   * @param {object} farmerLocation - { latitude, longitude }
   * @param {number} radiusKm - Search radius in kilometers
   * @param {string} farmerId - Optional farmer ID for favorites
   * @returns {Array} Suppliers carrying the product, sorted by distance
   */
  async findSuppliersForProduct(productId, farmerLocation, radiusKm = SEARCH_CONFIG.DEFAULT_RADIUS_KM, farmerId = null) {
    const { latitude, longitude } = farmerLocation;

    // Get suppliers for product within radius
    let suppliers = await this.supplierRepo.getSuppliersForProduct(
      productId,
      latitude,
      longitude,
      radiusKm
    );

    // If no suppliers found and auto-expand is enabled, try larger radius
    if (suppliers.length === 0 && SEARCH_CONFIG.AUTO_EXPAND_RADIUS) {
      const expandedRadius = radiusKm * SEARCH_CONFIG.EXPANSION_MULTIPLIER;
      if (expandedRadius <= SEARCH_CONFIG.MAX_RADIUS_KM) {
        console.log(`[SupplierSearch] No suppliers found, expanding radius to ${expandedRadius}km`);
        suppliers = await this.supplierRepo.getSuppliersForProduct(
          productId,
          latitude,
          longitude,
          expandedRadius
        );
      }
    }

    // If farmer ID provided, mark favorites
    if (farmerId && suppliers.length > 0) {
      suppliers = await this._markFavorites(suppliers, farmerId);
    }

    return suppliers;
  }

  /**
   * Find nearest suppliers (general search)
   * AC2: Nearest suppliers based on farmer location
   */
  async findNearestSuppliers(farmerLocation, radiusKm = SEARCH_CONFIG.DEFAULT_RADIUS_KM, farmerId = null) {
    const { latitude, longitude } = farmerLocation;

    let suppliers = await this.supplierRepo.findNearestSuppliers(
      latitude,
      longitude,
      radiusKm
    );

    // Auto-expand if needed
    if (suppliers.length === 0 && SEARCH_CONFIG.AUTO_EXPAND_RADIUS) {
      const expandedRadius = Math.min(
        radiusKm * SEARCH_CONFIG.EXPANSION_MULTIPLIER,
        SEARCH_CONFIG.MAX_RADIUS_KM
      );

      if (expandedRadius > radiusKm) {
        suppliers = await this.supplierRepo.findNearestSuppliers(
          latitude,
          longitude,
          expandedRadius
        );
      }
    }

    // Mark favorites
    if (farmerId && suppliers.length > 0) {
      suppliers = await this._markFavorites(suppliers, farmerId);
    }

    return suppliers;
  }

  /**
   * Get suppliers for treatment (all products in treatment)
   * AC1: Link suppliers to treatment recommendations
   */
  async getSuppliersForTreatment(treatmentId, productIds, farmerLocation, farmerId = null) {
    const { latitude, longitude } = farmerLocation;

    // Find suppliers for each product
    const allSuppliers = await Promise.all(
      productIds.map(productId =>
        this.supplierRepo.getSuppliersForProduct(
          productId,
          latitude,
          longitude,
          SEARCH_CONFIG.DEFAULT_RADIUS_KM
        )
      )
    );

    // Flatten and deduplicate
    const uniqueSuppliers = this._deduplicateSuppliers(allSuppliers.flat());

    // Mark favorites
    if (farmerId && uniqueSuppliers.length > 0) {
      return await this._markFavorites(uniqueSuppliers, farmerId);
    }

    return uniqueSuppliers;
  }

  /**
   * Find alternative products when primary is unavailable
   * AC5: Alternative products suggested if primary unavailable
   */
  async findAlternativesWithSuppliers(productId, farmerLocation, radiusKm = SEARCH_CONFIG.DEFAULT_RADIUS_KM) {
    const { latitude, longitude } = farmerLocation;

    // Get alternative products
    const alternatives = await this.supplierRepo.getAlternativeProducts(productId);

    if (alternatives.length === 0) {
      return [];
    }

    // For each alternative, find suppliers
    const alternativesWithSuppliers = await Promise.all(
      alternatives.map(async (alt) => {
        const suppliers = await this.supplierRepo.getSuppliersForProduct(
          alt.alternative_product_id,
          latitude,
          longitude,
          radiusKm
        );

        return {
          ...alt,
          suppliers: suppliers.filter(s => s.availabilityStatus !== AVAILABILITY_STATUS.OUT_OF_STOCK),
          availableCount: suppliers.filter(s => s.availabilityStatus === AVAILABILITY_STATUS.IN_STOCK).length,
        };
      })
    );

    // Filter out alternatives with no suppliers
    return alternativesWithSuppliers.filter(alt => alt.suppliers.length > 0);
  }

  /**
   * Search suppliers by name or location
   */
  async searchSuppliers(searchTerm, farmerId = null) {
    let suppliers = await this.supplierRepo.searchSuppliersByName(searchTerm);

    if (farmerId && suppliers.length > 0) {
      suppliers = await this._markFavorites(suppliers, farmerId);
    }

    return suppliers;
  }

  /**
   * Get suppliers by city
   */
  async getSuppliersByCity(city, farmerId = null) {
    let suppliers = await this.supplierRepo.getSuppliersByCity(city);

    if (farmerId && suppliers.length > 0) {
      suppliers = await this._markFavorites(suppliers, farmerId);
    }

    return suppliers;
  }

  /**
   * Get verified suppliers only
   */
  async getVerifiedSuppliers(farmerId = null) {
    let suppliers = await this.supplierRepo.getVerifiedSuppliers();

    if (farmerId && suppliers.length > 0) {
      suppliers = await this._markFavorites(suppliers, farmerId);
    }

    return suppliers;
  }

  /**
   * Sort suppliers by various criteria
   */
  sortSuppliers(suppliers, sortBy = SORT_OPTIONS.DISTANCE) {
    const sorted = [...suppliers];

    switch (sortBy) {
      case SORT_OPTIONS.DISTANCE:
        sorted.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
        break;

      case SORT_OPTIONS.RATING:
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;

      case SORT_OPTIONS.AVAILABILITY:
        sorted.sort((a, b) => {
          const statusOrder = {
            [AVAILABILITY_STATUS.IN_STOCK]: 0,
            [AVAILABILITY_STATUS.LOW_STOCK]: 1,
            [AVAILABILITY_STATUS.SEASONAL]: 2,
            [AVAILABILITY_STATUS.UNKNOWN]: 3,
            [AVAILABILITY_STATUS.OUT_OF_STOCK]: 4,
          };
          return (statusOrder[a.availabilityStatus] || 3) - (statusOrder[b.availabilityStatus] || 3);
        });
        break;

      case SORT_OPTIONS.FAVORITES_FIRST:
        sorted.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return (a.distanceKm || Infinity) - (b.distanceKm || Infinity);
        });
        break;

      default:
        // Default to distance
        sorted.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
    }

    return sorted;
  }

  /**
   * Filter suppliers by availability status
   */
  filterByAvailability(suppliers, statusFilter = [AVAILABILITY_STATUS.IN_STOCK, AVAILABILITY_STATUS.LOW_STOCK]) {
    return suppliers.filter(s => statusFilter.includes(s.availabilityStatus));
  }

  /**
   * Filter suppliers by verification status
   */
  filterByVerification(suppliers, verifiedOnly = false) {
    if (!verifiedOnly) return suppliers;
    return suppliers.filter(s => s.isVerified);
  }

  /**
   * Deduplicate suppliers
   * Remove duplicate suppliers from merged lists
   */
  _deduplicateSuppliers(suppliers) {
    const seen = new Set();
    return suppliers.filter(supplier => {
      if (seen.has(supplier.id)) {
        return false;
      }
      seen.add(supplier.id);
      return true;
    });
  }

  /**
   * Mark favorite suppliers for a farmer
   */
  async _markFavorites(suppliers, farmerId) {
    const favorites = await this.favoriteRepo.getFavorites(farmerId, false);
    const favoriteIds = new Set(favorites.map(f => f.supplier_id));

    return suppliers.map(supplier => ({
      ...supplier,
      isFavorite: favoriteIds.has(supplier.id),
    }));
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Utility method for custom distance calculations
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
      Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in kilometers
  }

  /**
   * Convert degrees to radians
   */
  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }
}

export default SupplierSearchService;
