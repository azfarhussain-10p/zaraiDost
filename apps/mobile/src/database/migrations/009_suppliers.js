// Database Migration 009: Suppliers
// Story 3.5: Local Supplier Integration
// Creates tables for supplier data, product availability, favorites, and alternatives

/**
 * Run migration 009
 * Creates:
 * - suppliers: Local supplier information with location
 * - supplier_products: Product availability at each supplier
 * - farmer_favorite_suppliers: Farmer's favorite suppliers
 * - product_alternatives: Alternative product mappings
 *
 * Implements:
 * - AC1: Supplier database linked to treatment recommendations
 * - AC2: Nearest suppliers based on location (latitude/longitude)
 * - AC3: Supplier contact information
 * - AC4: Product availability tracking
 * - AC5: Alternative products
 * - AC7: Favorite suppliers
 */
export const runMigration009 = async (db) => {
  console.log('[Migration 009] Creating supplier tables...');

  try {
    // Create suppliers table
    // AC1, AC2, AC3: Supplier database with location and contact info
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        phone TEXT,
        whatsapp_number TEXT,
        email TEXT,
        address TEXT NOT NULL,
        city TEXT,
        province TEXT,
        latitude REAL,
        longitude REAL,
        business_hours TEXT,
        is_verified INTEGER DEFAULT 0,
        verified_at INTEGER,
        rating REAL DEFAULT 0.0,
        total_ratings INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    console.log('[Migration 009] Suppliers table created');

    // Create indexes for efficient location-based queries
    // AC2: Enable nearest supplier search
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
      CREATE INDEX IF NOT EXISTS idx_suppliers_province ON suppliers(province);
      CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
      CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(latitude, longitude);
    `);

    console.log('[Migration 009] Supplier indexes created');

    // Create supplier_products table
    // AC1, AC4: Link products to suppliers with availability
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS supplier_products (
        supplier_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        availability_status TEXT DEFAULT 'unknown',
        last_updated INTEGER,
        updated_by TEXT,
        estimated_price_pkr INTEGER,
        notes TEXT,
        PRIMARY KEY (supplier_id, product_id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES treatment_products(id) ON DELETE CASCADE
      );
    `);

    console.log('[Migration 009] Supplier products table created');

    // Create index for availability queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_supplier_products_availability
        ON supplier_products(availability_status);
      CREATE INDEX IF NOT EXISTS idx_supplier_products_product
        ON supplier_products(product_id);
    `);

    console.log('[Migration 009] Supplier products indexes created');

    // Create farmer_favorite_suppliers table
    // AC7: User can mark suppliers as favorites
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farmer_favorite_suppliers (
        farmer_id TEXT NOT NULL,
        supplier_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (farmer_id, supplier_id),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
      );
    `);

    console.log('[Migration 009] Farmer favorite suppliers table created');

    // Create indexes for favorites
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_favorite_suppliers_farmer
        ON farmer_favorite_suppliers(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_favorite_suppliers_supplier
        ON farmer_favorite_suppliers(supplier_id);
    `);

    console.log('[Migration 009] Favorite suppliers indexes created');

    // Create product_alternatives table
    // AC5: Alternative products suggested if primary unavailable
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS product_alternatives (
        product_id TEXT NOT NULL,
        alternative_product_id TEXT NOT NULL,
        equivalence_type TEXT NOT NULL,
        effectiveness_ratio REAL DEFAULT 1.0,
        notes TEXT,
        PRIMARY KEY (product_id, alternative_product_id),
        FOREIGN KEY (product_id) REFERENCES treatment_products(id) ON DELETE CASCADE,
        FOREIGN KEY (alternative_product_id) REFERENCES treatment_products(id) ON DELETE CASCADE
      );
    `);

    console.log('[Migration 009] Product alternatives table created');

    // Create indexes for alternative lookups
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_product_alternatives_product
        ON product_alternatives(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_alternatives_alternative
        ON product_alternatives(alternative_product_id);
      CREATE INDEX IF NOT EXISTS idx_product_alternatives_type
        ON product_alternatives(equivalence_type);
    `);

    console.log('[Migration 009] Product alternatives indexes created');

    // Create farmer_contributions table for tracking data updates
    // Supports crowdsourced availability updates
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farmer_contributions (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        contribution_type TEXT NOT NULL,
        reference_id TEXT,
        points INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
      );
    `);

    console.log('[Migration 009] Farmer contributions table created');

    // Create index for contribution tracking
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_farmer_contributions_farmer
        ON farmer_contributions(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_farmer_contributions_type
        ON farmer_contributions(contribution_type);
    `);

    console.log('[Migration 009] Farmer contributions indexes created');

    // Create contact_attempts table for analytics
    // AC6: Track supplier contact attempts
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS supplier_contact_attempts (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        supplier_id TEXT NOT NULL,
        contact_method TEXT NOT NULL,
        contact_intent TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
      );
    `);

    console.log('[Migration 009] Supplier contact attempts table created');

    // Create indexes for analytics
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_contact_attempts_farmer
        ON supplier_contact_attempts(farmer_id);
      CREATE INDEX IF NOT EXISTS idx_contact_attempts_supplier
        ON supplier_contact_attempts(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_contact_attempts_method
        ON supplier_contact_attempts(contact_method);
    `);

    console.log('[Migration 009] Contact attempts indexes created');

    console.log('[Migration 009] All supplier tables created successfully');
  } catch (error) {
    console.error('[Migration 009] Error creating supplier tables:', error);
    throw error;
  }
};

export default {
  runMigration009,
};
