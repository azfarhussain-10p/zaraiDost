// Database Schema Migrations - AI Models
// Story 1.3: Offline AI Model Storage
// Implements: Task 3 (Build model versioning system)
// Implements: Task 5 (Build result caching fallback)

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Create model_metadata table
 * Implements: Task 3.1
 * AC4: Model version tracking for future updates
 */
const createModelMetadataTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.MODEL_METADATA} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      version TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size_bytes INTEGER,
      checksum TEXT,
      download_date DATETIME,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(model_name, version)
    );
  `);

  console.log('[Migration] Created model_metadata table');
};

/**
 * Create inference_cache table
 * Implements: Task 5.1
 * AC5: Fallback to cached results if model loading fails
 */
const createInferenceCacheTable = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLES.INFERENCE_CACHE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_hash TEXT NOT NULL,
      model_version TEXT NOT NULL,
      prediction_result TEXT NOT NULL,
      inference_time_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(image_hash, model_version)
    );
  `);

  console.log('[Migration] Created inference_cache table');
};

/**
 * Create indexes for AI model tables
 * Performance optimization for lookups
 */
const createAIIndexes = async (db) => {
  // Model metadata indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_model_metadata_name
    ON ${TABLES.MODEL_METADATA}(model_name);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_model_metadata_active
    ON ${TABLES.MODEL_METADATA}(is_active)
    WHERE is_active = 1;
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_model_metadata_version
    ON ${TABLES.MODEL_METADATA}(model_name, version);
  `);

  // Inference cache indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_inference_cache_hash
    ON ${TABLES.INFERENCE_CACHE}(image_hash);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_inference_cache_created
    ON ${TABLES.INFERENCE_CACHE}(created_at DESC);
  `);

  console.log('[Migration] Created AI model indexes');
};

/**
 * Migration version 2: AI models and caching
 */
export const runMigration002 = async (db) => {
  console.log('[Migration] Applying migration 002: AI models and caching');

  await createModelMetadataTable(db);
  await createInferenceCacheTable(db);
  await createAIIndexes(db);

  console.log('[Migration] Migration 002 completed');
};

export default {
  runMigration002,
};
