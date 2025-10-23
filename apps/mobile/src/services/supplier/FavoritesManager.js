// Favorites Manager Service
// Story 3.5: Local Supplier Integration
// Manages farmer's favorite suppliers

import FavoriteSupplierRepository from '../../database/repositories/FavoriteSupplierRepository';
import {
  FAVORITE_LIMITS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from '../../constants/SupplierConstants';

/**
 * Favorites Manager Service
 * High-level service for managing supplier favorites
 *
 * Implements:
 * - AC7: User can mark suppliers as favorites
 */
class FavoritesManager {
  constructor() {
    this.favoriteRepo = new FavoriteSupplierRepository();
  }

  /**
   * Add supplier to favorites
   * AC7: Mark suppliers as favorites
   */
  async addFavorite(farmerId, supplierId, notes = null) {
    try {
      // Check if already at limit
      const count = await this.favoriteRepo.getFavoriteCount(farmerId);

      if (count >= FAVORITE_LIMITS.MAX_FAVORITES) {
        return {
          success: false,
          error: 'FAVORITE_LIMIT_REACHED',
          message: ERROR_MESSAGES.FAVORITE_LIMIT_REACHED.en,
        };
      }

      // Show warning if approaching limit
      if (count >= FAVORITE_LIMITS.SHOW_WARNING_AT) {
        console.warn(`[FavoritesManager] Farmer ${farmerId} approaching favorites limit (${count}/${FAVORITE_LIMITS.MAX_FAVORITES})`);
      }

      await this.favoriteRepo.addFavorite(farmerId, supplierId, notes);

      return {
        success: true,
        message: SUCCESS_MESSAGES.FAVORITE_ADDED.en,
        count: count + 1,
      };
    } catch (error) {
      console.error('[FavoritesManager] Failed to add favorite:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add favorite',
      };
    }
  }

  /**
   * Remove supplier from favorites
   * AC7: Manage favorites
   */
  async removeFavorite(farmerId, supplierId) {
    try {
      const removed = await this.favoriteRepo.removeFavorite(farmerId, supplierId);

      if (!removed) {
        return {
          success: false,
          message: 'Supplier not in favorites',
        };
      }

      const count = await this.favoriteRepo.getFavoriteCount(farmerId);

      return {
        success: true,
        message: SUCCESS_MESSAGES.FAVORITE_REMOVED.en,
        count,
      };
    } catch (error) {
      console.error('[FavoritesManager] Failed to remove favorite:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to remove favorite',
      };
    }
  }

  /**
   * Toggle favorite status
   * AC7: Add/remove favorites
   */
  async toggleFavorite(farmerId, supplierId, notes = null) {
    const isFavorite = await this.favoriteRepo.isFavorite(farmerId, supplierId);

    if (isFavorite) {
      return await this.removeFavorite(farmerId, supplierId);
    } else {
      return await this.addFavorite(farmerId, supplierId, notes);
    }
  }

  /**
   * Check if supplier is favorite
   */
  async isFavorite(farmerId, supplierId) {
    return await this.favoriteRepo.isFavorite(farmerId, supplierId);
  }

  /**
   * Get all favorites
   * AC7: Retrieve favorites list
   */
  async getFavorites(farmerId) {
    return await this.favoriteRepo.getFavorites(farmerId, true);
  }

  /**
   * Get favorites with distance
   */
  async getFavoritesWithDistance(farmerId, location) {
    const { latitude, longitude } = location;
    return await this.favoriteRepo.getFavoritesWithDistance(farmerId, latitude, longitude);
  }

  /**
   * Get favorites for a specific product
   */
  async getFavoritesForProduct(farmerId, productId) {
    return await this.favoriteRepo.getFavoritesByProduct(farmerId, productId);
  }

  /**
   * Get favorites by city
   */
  async getFavoritesByCity(farmerId, city) {
    return await this.favoriteRepo.getFavoritesByCity(farmerId, city);
  }

  /**
   * Update favorite notes
   */
  async updateNotes(farmerId, supplierId, notes) {
    try {
      await this.favoriteRepo.updateNotes(farmerId, supplierId, notes);
      return {
        success: true,
        message: 'Notes updated',
      };
    } catch (error) {
      console.error('[FavoritesManager] Failed to update notes:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get favorite count
   */
  async getFavoriteCount(farmerId) {
    return await this.favoriteRepo.getFavoriteCount(farmerId);
  }

  /**
   * Check if approaching limit
   */
  async isApproachingLimit(farmerId) {
    const count = await this.favoriteRepo.getFavoriteCount(farmerId);
    return count >= FAVORITE_LIMITS.SHOW_WARNING_AT;
  }

  /**
   * Get remaining favorite slots
   */
  async getRemainingSlots(farmerId) {
    const count = await this.favoriteRepo.getFavoriteCount(farmerId);
    return Math.max(0, FAVORITE_LIMITS.MAX_FAVORITES - count);
  }

  /**
   * Get most popular suppliers
   * Social proof for recommendations
   */
  async getMostPopularSuppliers(limit = 10) {
    return await this.favoriteRepo.getMostPopularSuppliers(limit);
  }
}

export default FavoritesManager;
