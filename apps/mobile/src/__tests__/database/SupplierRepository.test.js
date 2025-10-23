// Tests for SupplierRepository
// Story 3.5: Local Supplier Integration

import SupplierRepository from '../../database/repositories/SupplierRepository';
import { initDatabase, closeDatabase, resetDatabase } from '../../database/config/db.config';
import { SUPPLIER_TYPES, AVAILABILITY_STATUS } from '../../constants/SupplierConstants';

describe('SupplierRepository', () => {
  let supplierRepo;

  beforeAll(async () => {
    await initDatabase();
    supplierRepo = new SupplierRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up suppliers table before each test
    const db = supplierRepo.db;
    await db.runAsync('DELETE FROM suppliers');
    await db.runAsync('DELETE FROM supplier_products');
  });

  describe('createSupplier', () => {
    it('should create a new supplier with all fields', async () => {
      const supplierData = {
        id: 'test-supplier-001',
        name: 'Test Agricultural Store',
        nameUr: 'ٹیسٹ زرعی سٹور',
        type: SUPPLIER_TYPES.SHOP,
        phone: '03001234567',
        whatsappNumber: '03001234567',
        email: 'test@example.com',
        address: 'Test Address, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
        businessHours: '9:00 AM - 6:00 PM',
        isVerified: true,
        rating: 4.5,
        totalRatings: 10,
      };

      const id = await supplierRepo.createSupplier(supplierData);
      expect(id).toBe('test-supplier-001');

      const supplier = await supplierRepo.getSupplierById(id);
      expect(supplier).toBeTruthy();
      expect(supplier.name).toBe('Test Agricultural Store');
      expect(supplier.isVerified).toBe(true);
      expect(supplier.rating).toBe(4.5);
    });

    it('should create a supplier with minimal fields', async () => {
      const supplierData = {
        id: 'test-supplier-002',
        name: 'Minimal Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Test Address',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
      };

      const id = await supplierRepo.createSupplier(supplierData);
      const supplier = await supplierRepo.getSupplierById(id);

      expect(supplier).toBeTruthy();
      expect(supplier.isVerified).toBe(false);
      expect(supplier.rating).toBe(0);
    });
  });

  describe('findNearestSuppliers', () => {
    beforeEach(async () => {
      // Create test suppliers at various distances from Lahore center
      await supplierRepo.createSupplier({
        id: 'nearby-001',
        name: 'Nearby Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Near Location',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497, // Very close to test location
        longitude: 74.3436,
      });

      await supplierRepo.createSupplier({
        id: 'faraway-001',
        name: 'Far Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Far Location',
        city: 'Karachi',
        province: 'Sindh',
        latitude: 24.8607, // Karachi - far from Lahore
        longitude: 67.0011,
      });
    });

    it('should find suppliers within radius', async () => {
      const results = await supplierRepo.findNearestSuppliers(31.5497, 74.3436, 50);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].distanceKm).toBeDefined();
      expect(results[0].distanceKm).toBeLessThan(50);
    });

    it('should sort suppliers by distance', async () => {
      const results = await supplierRepo.findNearestSuppliers(31.5497, 74.3436, 2000);

      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].distanceKm).toBeLessThanOrEqual(results[i + 1].distanceKm);
        }
      }
    });

    it('should exclude suppliers outside radius', async () => {
      const results = await supplierRepo.findNearestSuppliers(31.5497, 74.3436, 10);

      // Far store in Karachi should not be included
      const hasKarachiStore = results.some(s => s.city === 'Karachi');
      expect(hasKarachiStore).toBe(false);
    });
  });

  describe('Product Availability', () => {
    beforeEach(async () => {
      await supplierRepo.createSupplier({
        id: 'supplier-with-products',
        name: 'Test Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Test Address',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
      });
    });

    it('should add product to supplier', async () => {
      await supplierRepo.addSupplierProduct(
        'supplier-with-products',
        'product-001',
        AVAILABILITY_STATUS.IN_STOCK,
        1500
      );

      const availability = await supplierRepo.getProductAvailability(
        'supplier-with-products',
        'product-001'
      );

      expect(availability).toBeTruthy();
      expect(availability.availability_status).toBe(AVAILABILITY_STATUS.IN_STOCK);
      expect(availability.estimated_price_pkr).toBe(1500);
    });

    it('should update product availability', async () => {
      await supplierRepo.addSupplierProduct(
        'supplier-with-products',
        'product-001',
        AVAILABILITY_STATUS.IN_STOCK
      );

      await supplierRepo.updateProductAvailability(
        'supplier-with-products',
        'product-001',
        AVAILABILITY_STATUS.OUT_OF_STOCK,
        'farmer-001'
      );

      const availability = await supplierRepo.getProductAvailability(
        'supplier-with-products',
        'product-001'
      );

      expect(availability.availability_status).toBe(AVAILABILITY_STATUS.OUT_OF_STOCK);
      expect(availability.updated_by).toBe('farmer-001');
    });
  });

  describe('getSuppliersForProduct', () => {
    beforeEach(async () => {
      // Create suppliers
      await supplierRepo.createSupplier({
        id: 'supplier-001',
        name: 'Store 1',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Address 1',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
      });

      await supplierRepo.createSupplier({
        id: 'supplier-002',
        name: 'Store 2',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Address 2',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5600,
        longitude: 74.3500,
      });

      // Add same product to both suppliers
      await supplierRepo.addSupplierProduct('supplier-001', 'product-001', AVAILABILITY_STATUS.IN_STOCK);
      await supplierRepo.addSupplierProduct('supplier-002', 'product-001', AVAILABILITY_STATUS.LOW_STOCK);
    });

    it('should find suppliers carrying a product', async () => {
      const suppliers = await supplierRepo.getSuppliersForProduct(
        'product-001',
        31.5497,
        74.3436,
        50
      );

      expect(suppliers.length).toBeGreaterThanOrEqual(1);
      expect(suppliers[0].availabilityStatus).toBeDefined();
    });

    it('should prioritize in-stock suppliers', async () => {
      const suppliers = await supplierRepo.getSuppliersForProduct(
        'product-001',
        31.5497,
        74.3436,
        50
      );

      if (suppliers.length > 1) {
        const inStockIndex = suppliers.findIndex(s => s.availabilityStatus === AVAILABILITY_STATUS.IN_STOCK);
        const lowStockIndex = suppliers.findIndex(s => s.availabilityStatus === AVAILABILITY_STATUS.LOW_STOCK);

        if (inStockIndex !== -1 && lowStockIndex !== -1) {
          expect(inStockIndex).toBeLessThan(lowStockIndex);
        }
      }
    });
  });

  describe('Alternative Products', () => {
    it('should add product alternative', async () => {
      await supplierRepo.addProductAlternative(
        'product-001',
        'product-002',
        'same_ingredient',
        0.95,
        'Similar fungicide'
      );

      const alternatives = await supplierRepo.getAlternativeProducts('product-001');

      expect(alternatives.length).toBe(1);
      expect(alternatives[0].alternative_product_id).toBe('product-002');
      expect(alternatives[0].equivalence_type).toBe('same_ingredient');
      expect(alternatives[0].effectiveness_ratio).toBe(0.95);
    });

    it('should get all alternatives for a product', async () => {
      await supplierRepo.addProductAlternative('product-001', 'product-002', 'same_ingredient', 1.0);
      await supplierRepo.addProductAlternative('product-001', 'product-003', 'similar_effect', 0.85);

      const alternatives = await supplierRepo.getAlternativeProducts('product-001');

      expect(alternatives.length).toBe(2);
      // Should be sorted by effectiveness
      expect(alternatives[0].effectiveness_ratio).toBeGreaterThanOrEqual(alternatives[1].effectiveness_ratio);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(async () => {
      await supplierRepo.createSupplier({
        id: 'agri-store-001',
        name: 'Green Valley Agricultural Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Main Market, Lahore',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
        isVerified: true,
      });
    });

    it('should search suppliers by name', async () => {
      const results = await supplierRepo.searchSuppliersByName('Green Valley');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Green Valley');
    });

    it('should search suppliers by city', async () => {
      const results = await supplierRepo.searchSuppliersByName('Lahore');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should get verified suppliers only', async () => {
      await supplierRepo.createSupplier({
        id: 'unverified-001',
        name: 'Unverified Store',
        type: SUPPLIER_TYPES.SHOP,
        address: 'Test',
        city: 'Lahore',
        province: 'Punjab',
        latitude: 31.5497,
        longitude: 74.3436,
        isVerified: false,
      });

      const verified = await supplierRepo.getVerifiedSuppliers();

      expect(verified.every(s => s.isVerified)).toBe(true);
    });
  });
});
