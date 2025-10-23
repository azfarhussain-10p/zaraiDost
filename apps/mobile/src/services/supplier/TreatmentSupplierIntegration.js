// Treatment-Supplier Integration
// Stories 3.4 & 3.5 Integration
// Connects treatment recommendations with supplier search

import SupplierSearchService from './SupplierSearchService';
import { SEARCH_RADIUS } from '../../constants/SupplierConstants';

/**
 * TreatmentSupplierIntegration
 * Integrates treatment recommendations with supplier search
 *
 * Integration between:
 * - Story 3.4: Treatment Recommendations Engine
 * - Story 3.5: Local Supplier Integration
 */
class TreatmentSupplierIntegration {
  constructor() {
    this.searchService = new SupplierSearchService();
  }

  /**
   * Find suppliers for a recommended treatment
   * Connects treatment recommendations to local suppliers
   *
   * @param {object} treatment - Treatment object from Story 3.4
   * @param {object} farmerLocation - Farmer's GPS location
   * @param {string} farmerId - Farmer ID
   * @param {number} radiusKm - Search radius (default: 50km)
   * @returns {object} Treatment with supplier information
   */
  async findSuppliersForTreatment(treatment, farmerLocation, farmerId, radiusKm = SEARCH_RADIUS.FAR) {
    try {
      // For now, we'll search using the treatment ID as product ID
      // In a full implementation, this would map to actual product IDs
      const productId = `product-${treatment.id.split('-')[1]}`.substring(0, 12);

      const suppliers = await this.searchService.findSuppliersForProduct(
        productId,
        farmerLocation,
        radiusKm,
        farmerId
      );

      return {
        treatment,
        suppliers: suppliers || [],
        nearestSupplier: suppliers && suppliers.length > 0 ? suppliers[0] : null,
        totalSuppliersFound: suppliers ? suppliers.length : 0,
        searchRadius: radiusKm,
      };
    } catch (error) {
      console.error('[TreatmentSupplierIntegration] Error finding suppliers for treatment:', error);
      return {
        treatment,
        suppliers: [],
        nearestSupplier: null,
        totalSuppliersFound: 0,
        error: error.message,
      };
    }
  }

  /**
   * Find suppliers for multiple treatments
   * Useful when showing a list of treatment options
   *
   * @param {Array} treatments - Array of treatment objects
   * @param {object} farmerLocation - Farmer's GPS location
   * @param {string} farmerId - Farmer ID
   * @returns {Array} Treatments with supplier information
   */
  async findSuppliersForTreatments(treatments, farmerLocation, farmerId) {
    const promises = treatments.map(treatment =>
      this.findSuppliersForTreatment(treatment, farmerLocation, farmerId)
    );

    return await Promise.all(promises);
  }

  /**
   * Get treatment availability summary
   * Shows which treatments are available nearby
   *
   * @param {Array} treatments - Array of treatment objects
   * @param {object} farmerLocation - Farmer's GPS location
   * @param {string} farmerId - Farmer ID
   * @returns {object} Availability summary
   */
  async getTreatmentAvailabilitySummary(treatments, farmerLocation, farmerId) {
    const treatmentsWithSuppliers = await this.findSuppliersForTreatments(
      treatments,
      farmerLocation,
      farmerId
    );

    const summary = {
      totalTreatments: treatments.length,
      availableLocally: 0,
      availableWithinExtendedRadius: 0,
      notAvailable: 0,
      treatments: treatmentsWithSuppliers,
    };

    treatmentsWithSuppliers.forEach(item => {
      if (item.totalSuppliersFound > 0) {
        const nearestDistance = item.nearestSupplier?.distanceKm || Infinity;
        if (nearestDistance <= SEARCH_RADIUS.FAR) {
          summary.availableLocally++;
        } else if (nearestDistance <= SEARCH_RADIUS.VERY_FAR) {
          summary.availableWithinExtendedRadius++;
        }
      } else {
        summary.notAvailable++;
      }
    });

    return summary;
  }

  /**
   * Get best treatment option based on supplier availability
   * Considers both treatment effectiveness and supplier proximity
   *
   * @param {Array} treatments - Array of treatment objects (sorted by effectiveness)
   * @param {object} farmerLocation - Farmer's GPS location
   * @param {string} farmerId - Farmer ID
   * @returns {object} Best treatment considering availability
   */
  async getBestAvailableTreatment(treatments, farmerLocation, farmerId) {
    const treatmentsWithSuppliers = await this.findSuppliersForTreatments(
      treatments,
      farmerLocation,
      farmerId
    );

    // Score treatments based on effectiveness + availability
    const scored = treatmentsWithSuppliers.map(item => {
      const effectivenessScore = item.treatment.effectivenessRating || 0.5;
      const availabilityScore = item.totalSuppliersFound > 0 ? 1 : 0;
      const proximityScore = item.nearestSupplier
        ? Math.max(0, 1 - (item.nearestSupplier.distanceKm / 100)) // Normalize distance
        : 0;

      const totalScore = (
        effectivenessScore * 0.5 +  // 50% weight on effectiveness
        availabilityScore * 0.3 +    // 30% weight on availability
        proximityScore * 0.2          // 20% weight on proximity
      );

      return {
        ...item,
        scores: {
          effectiveness: effectivenessScore,
          availability: availabilityScore,
          proximity: proximityScore,
          total: totalScore,
        },
      };
    });

    // Sort by total score
    scored.sort((a, b) => b.scores.total - a.scores.total);

    return {
      recommended: scored[0] || null,
      allOptions: scored,
    };
  }

  /**
   * Navigation helper: Navigate to supplier list for treatment
   * Helper method for UI integration
   *
   * @param {object} navigation - React Navigation object
   * @param {object} treatment - Treatment object
   * @param {string} farmerId - Farmer ID
   */
  navigateToSuppliersForTreatment(navigation, treatment, farmerId) {
    const productId = `product-${treatment.id.split('-')[1]}`.substring(0, 12);

    navigation.navigate('SupplierList', {
      productId,
      farmerId,
      treatmentName: treatment.nameEn,
    });
  }
}

export default TreatmentSupplierIntegration;
