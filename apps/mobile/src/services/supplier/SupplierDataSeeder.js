// Supplier Data Seeder
// Story 3.5: Local Supplier Integration
// Utility to populate database with sample supplier data

import SupplierRepository from '../../database/repositories/SupplierRepository';
import { SAMPLE_SUPPLIERS, SAMPLE_SUPPLIER_PRODUCTS, SAMPLE_PRODUCT_ALTERNATIVES } from '../../constants/SupplierData';

/**
 * SupplierDataSeeder
 * Seeds the database with sample supplier data for development and testing
 */
class SupplierDataSeeder {
  constructor() {
    this.supplierRepo = new SupplierRepository();
  }

  /**
   * Seed all sample data
   * Populates suppliers, products, and alternatives
   */
  async seedAll() {
    try {
      console.log('[SupplierDataSeeder] Starting data seeding...');

      const results = {
        suppliers: 0,
        products: 0,
        alternatives: 0,
        errors: [],
      };

      // Seed suppliers
      try {
        await this.seedSuppliers();
        results.suppliers = SAMPLE_SUPPLIERS.length;
        console.log(`[SupplierDataSeeder] Seeded ${results.suppliers} suppliers`);
      } catch (error) {
        console.error('[SupplierDataSeeder] Error seeding suppliers:', error);
        results.errors.push({ type: 'suppliers', error: error.message });
      }

      // Seed supplier products
      try {
        await this.seedSupplierProducts();
        results.products = SAMPLE_SUPPLIER_PRODUCTS.length;
        console.log(`[SupplierDataSeeder] Seeded ${results.products} supplier products`);
      } catch (error) {
        console.error('[SupplierDataSeeder] Error seeding products:', error);
        results.errors.push({ type: 'products', error: error.message });
      }

      // Seed product alternatives
      try {
        await this.seedProductAlternatives();
        results.alternatives = SAMPLE_PRODUCT_ALTERNATIVES.length;
        console.log(`[SupplierDataSeeder] Seeded ${results.alternatives} product alternatives`);
      } catch (error) {
        console.error('[SupplierDataSeeder] Error seeding alternatives:', error);
        results.errors.push({ type: 'alternatives', error: error.message });
      }

      console.log('[SupplierDataSeeder] Data seeding complete:', results);
      return results;
    } catch (error) {
      console.error('[SupplierDataSeeder] Fatal error during seeding:', error);
      throw error;
    }
  }

  /**
   * Seed suppliers
   */
  async seedSuppliers() {
    const promises = SAMPLE_SUPPLIERS.map(async (supplier) => {
      try {
        return await this.supplierRepo.createSupplier(supplier);
      } catch (error) {
        // If supplier already exists, skip
        if (error.message && error.message.includes('UNIQUE')) {
          console.log(`[SupplierDataSeeder] Supplier ${supplier.id} already exists, skipping`);
          return null;
        }
        throw error;
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Seed supplier products (availability)
   */
  async seedSupplierProducts() {
    const promises = SAMPLE_SUPPLIER_PRODUCTS.map(async (sp) => {
      try {
        return await this.supplierRepo.addSupplierProduct(
          sp.supplierId,
          sp.productId,
          sp.availabilityStatus,
          sp.estimatedPricePkr
        );
      } catch (error) {
        console.error(`[SupplierDataSeeder] Error adding product ${sp.productId} to supplier ${sp.supplierId}:`, error);
        return null;
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Seed product alternatives
   */
  async seedProductAlternatives() {
    const promises = SAMPLE_PRODUCT_ALTERNATIVES.map(async (alt) => {
      try {
        return await this.supplierRepo.addProductAlternative(
          alt.productId,
          alt.alternativeProductId,
          alt.equivalenceType,
          alt.effectivenessRatio,
          alt.notes
        );
      } catch (error) {
        // If alternative already exists, skip
        if (error.message && error.message.includes('UNIQUE')) {
          console.log(`[SupplierDataSeeder] Alternative already exists, skipping`);
          return null;
        }
        console.error(`[SupplierDataSeeder] Error adding alternative:`, error);
        return null;
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Clear all supplier data
   * WARNING: This deletes all supplier-related data!
   */
  async clearAll() {
    try {
      console.log('[SupplierDataSeeder] Clearing all supplier data...');

      const db = this.supplierRepo.db;

      // Clear in reverse order of dependencies
      await db.runAsync('DELETE FROM product_alternatives');
      await db.runAsync('DELETE FROM supplier_products');
      await db.runAsync('DELETE FROM farmer_favorite_suppliers');
      await db.runAsync('DELETE FROM farmer_contributions');
      await db.runAsync('DELETE FROM supplier_contact_attempts');
      await db.runAsync('DELETE FROM suppliers');

      console.log('[SupplierDataSeeder] All supplier data cleared');
      return true;
    } catch (error) {
      console.error('[SupplierDataSeeder] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Re-seed data (clear and seed)
   */
  async reseed() {
    await this.clearAll();
    return await this.seedAll();
  }

  /**
   * Check if data is already seeded
   */
  async isSeeded() {
    try {
      const suppliers = await this.supplierRepo.getAll();
      return suppliers.length > 0;
    } catch (error) {
      console.error('[SupplierDataSeeder] Error checking seeded status:', error);
      return false;
    }
  }

  /**
   * Seed data if not already seeded
   */
  async seedIfNeeded() {
    const seeded = await this.isSeeded();

    if (!seeded) {
      console.log('[SupplierDataSeeder] No supplier data found, seeding...');
      return await this.seedAll();
    } else {
      console.log('[SupplierDataSeeder] Supplier data already exists, skipping seed');
      return { skipped: true };
    }
  }
}

export default SupplierDataSeeder;
