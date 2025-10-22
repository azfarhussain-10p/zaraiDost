// Database Schema Migrations
// Story 1.1: Local Data Storage Foundation
// Implements: Task 2 (Design and implement core data schema)

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Create farmers table
 * Implements: Task 2.1
 * AC3: Core farm data stored locally
 */
const createFarmersTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.FARMERS} (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      language_preference TEXT DEFAULT 'ur',
      organic_preference INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'pending'
    );
  `);
  
  console.log('[Migration] Created farmers table');
};

/**
 * Create fields table
 * Implements: Task 2.2
 * AC3: Core farm data (field info) stored locally
 */
const createFieldsTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.FIELDS} (
      id TEXT PRIMARY KEY NOT NULL,
      farmer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      size_acres REAL,
      soil_type TEXT,
      location_gps TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (farmer_id) REFERENCES ${TABLES.FARMERS}(id) ON DELETE CASCADE
    );
  `);
  
  console.log('[Migration] Created fields table');
};

/**
 * Create crops table
 * Implements: Task 2.3
 * AC3: Core farm data (crops) stored locally
 */
const createCropsTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.CROPS} (
      id TEXT PRIMARY KEY NOT NULL,
      field_id TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      planting_date DATE,
      expected_harvest_date DATE,
      status TEXT DEFAULT 'planted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (field_id) REFERENCES ${TABLES.FIELDS}(id) ON DELETE CASCADE
    );
  `);
  
  console.log('[Migration] Created crops table');
};

/**
 * Create queries table
 * Implements: Task 2.4
 * AC3: Core farm data (previous queries) stored locally
 */
const createQueriesTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.QUERIES} (
      id TEXT PRIMARY KEY NOT NULL,
      farmer_id TEXT NOT NULL,
      query_text TEXT NOT NULL,
      response_text TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      query_type TEXT DEFAULT 'general',
      confidence_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (farmer_id) REFERENCES ${TABLES.FARMERS}(id) ON DELETE CASCADE
    );
  `);
  
  console.log('[Migration] Created queries table');
};

/**
 * Create images table
 * Implements: Task 2.5
 * AC5: Data schema supports offline storage for all core entities
 */
const createImagesTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.IMAGES} (
      id TEXT PRIMARY KEY NOT NULL,
      crop_id TEXT,
      local_file_path TEXT NOT NULL,
      remote_url TEXT,
      analysis_result_json TEXT,
      confidence_score REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (crop_id) REFERENCES ${TABLES.CROPS}(id) ON DELETE SET NULL
    );
  `);
  
  console.log('[Migration] Created images table');
};

/**
 * Create indexes for performance optimization
 * Implements: Task 2.7 (Add indexes on frequently queried columns)
 */
const createIndexes = async (db) => {
  // Farmers indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_farmers_sync 
    ON ${TABLES.FARMERS}(sync_status);
  `);
  
  // Fields indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_fields_farmer 
    ON ${TABLES.FIELDS}(farmer_id);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_fields_sync 
    ON ${TABLES.FIELDS}(sync_status);
  `);
  
  // Crops indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_crops_field 
    ON ${TABLES.CROPS}(field_id);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_crops_status 
    ON ${TABLES.CROPS}(status);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_crops_sync 
    ON ${TABLES.CROPS}(sync_status);
  `);
  
  // Queries indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_queries_farmer 
    ON ${TABLES.QUERIES}(farmer_id);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_queries_timestamp 
    ON ${TABLES.QUERIES}(timestamp DESC);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_queries_type 
    ON ${TABLES.QUERIES}(query_type);
  `);
  
  // Images indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_images_crop 
    ON ${TABLES.IMAGES}(crop_id);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_images_timestamp 
    ON ${TABLES.IMAGES}(timestamp DESC);
  `);
  
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_images_sync 
    ON ${TABLES.IMAGES}(sync_status);
  `);
  
  console.log('[Migration] Created indexes');
};

/**
 * Run all migrations from oldVersion to newVersion
 * Implements: Task 2.6 (Create database migration scripts for schema versioning)
 */
export const runMigrations = async (db, fromVersion, toVersion) => {
  console.log(`[Migration] Running migrations from version ${fromVersion} to ${toVersion}`);

  // Version 0 → 1: Initial schema
  if (fromVersion < 1 && toVersion >= 1) {
    console.log('[Migration] Applying migration 001: Initial schema');

    await createFarmersTable(db);
    await createFieldsTable(db);
    await createCropsTable(db);
    await createQueriesTable(db);
    await createImagesTable(db);
    await createIndexes(db);

    console.log('[Migration] Migration 001 completed');
  }

  console.log('[Migration] All migrations completed');
};

export default {
  runMigrations,
};

