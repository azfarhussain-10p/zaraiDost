// 004_weather_advisory_cache.js
// Story 1.5: Offline Weather and Advisory Cache
// Database migration: Create tables for caching weather forecasts and advisories

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Migration 004: Create weather and advisory cache tables
 *
 * Creates three new tables:
 * - weather_cache: Store 7-day weather forecasts
 * - advisories_cache: Store irrigation, market, and climate advisories
 * - cache_metadata: Track cache refresh status and size
 */

/**
 * Create weather_cache table for storing weather forecast data
 */
const createWeatherCacheTable = async (db) => {
  try {
    console.log('[Migration 004] Creating weather_cache table...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.WEATHER_CACHE} (
        id TEXT PRIMARY KEY,
        location_id TEXT NOT NULL,
        forecast_date DATE NOT NULL,
        temperature_high_c REAL,
        temperature_low_c REAL,
        humidity_percent INTEGER,
        rainfall_mm REAL,
        wind_speed_kmh REAL,
        wind_direction TEXT,
        weather_condition TEXT,
        uv_index INTEGER,
        sunrise TEXT,
        sunset TEXT,
        forecast_type TEXT DEFAULT 'daily',
        data_source TEXT,
        last_updated DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location_id, forecast_date, forecast_type)
      );
    `);

    console.log('[Migration 004] weather_cache table created successfully');
  } catch (error) {
    console.error('[Migration 004] Error creating weather_cache table:', error);
    throw error;
  }
};

/**
 * Create advisories_cache table for storing farming advisories
 */
const createAdvisoriesCacheTable = async (db) => {
  try {
    console.log('[Migration 004] Creating advisories_cache table...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.ADVISORIES_CACHE} (
        id TEXT PRIMARY KEY,
        advisory_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        applicable_crops TEXT,
        location_scope TEXT,
        valid_from DATE,
        valid_until DATE,
        is_critical BOOLEAN DEFAULT 0,
        data_source TEXT,
        last_updated DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[Migration 004] advisories_cache table created successfully');
  } catch (error) {
    console.error('[Migration 004] Error creating advisories_cache table:', error);
    throw error;
  }
};

/**
 * Create cache_metadata table for tracking cache status
 */
const createCacheMetadataTable = async (db) => {
  try {
    console.log('[Migration 004] Creating cache_metadata table...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.CACHE_METADATA} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_type TEXT NOT NULL,
        location_id TEXT,
        last_refresh_attempt DATETIME,
        last_refresh_success DATETIME,
        next_refresh_scheduled DATETIME,
        refresh_error_message TEXT,
        total_size_bytes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cache_type, location_id)
      );
    `);

    console.log('[Migration 004] cache_metadata table created successfully');
  } catch (error) {
    console.error('[Migration 004] Error creating cache_metadata table:', error);
    throw error;
  }
};

/**
 * Create indexes for weather cache performance
 */
const createWeatherCacheIndexes = async (db) => {
  try {
    console.log('[Migration 004] Creating weather cache indexes...');

    // Index for fast retrieval by location and date
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_weather_location_date
      ON ${TABLES.WEATHER_CACHE}(location_id, forecast_date DESC);
    `);

    // Index for finding stale data needing refresh
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_weather_last_updated
      ON ${TABLES.WEATHER_CACHE}(last_updated);
    `);

    // Index for cleanup operations (delete old forecasts)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_weather_cleanup
      ON ${TABLES.WEATHER_CACHE}(location_id, forecast_date ASC);
    `);

    console.log('[Migration 004] Weather cache indexes created successfully');
  } catch (error) {
    console.error('[Migration 004] Error creating weather cache indexes:', error);
    throw error;
  }
};

/**
 * Create indexes for advisory cache performance
 */
const createAdvisoryCacheIndexes = async (db) => {
  try {
    console.log('[Migration 004] Creating advisory cache indexes...');

    // Index for finding advisories by type and validity
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_advisory_type_date
      ON ${TABLES.ADVISORIES_CACHE}(advisory_type, valid_until DESC);
    `);

    // Index for prioritizing critical advisories
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_advisory_priority
      ON ${TABLES.ADVISORIES_CACHE}(priority, is_critical);
    `);

    // Index for finding stale advisories
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_advisory_last_updated
      ON ${TABLES.ADVISORIES_CACHE}(last_updated);
    `);

    // Index for cleanup (find expired advisories)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_advisory_expired
      ON ${TABLES.ADVISORIES_CACHE}(valid_until ASC)
      WHERE valid_until IS NOT NULL;
    `);

    console.log('[Migration 004] Advisory cache indexes created successfully');
  } catch (error) {
    console.error('[Migration 004] Error creating advisory cache indexes:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
export const runMigration004 = async (db) => {
  try {
    console.log('[Migration 004] Starting weather and advisory cache migration...');

    // Create tables
    await createWeatherCacheTable(db);
    await createAdvisoriesCacheTable(db);
    await createCacheMetadataTable(db);

    // Create indexes for performance
    await createWeatherCacheIndexes(db);
    await createAdvisoryCacheIndexes(db);

    console.log('[Migration 004] Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('[Migration 004] Migration failed:', error);
    throw error;
  }
};

/**
 * Rollback function (for testing or emergency rollback)
 */
export const rollbackMigration004 = async (db) => {
  try {
    console.log('[Migration 004] Rolling back weather and advisory cache migration...');

    await db.execAsync(`DROP TABLE IF EXISTS ${TABLES.WEATHER_CACHE};`);
    await db.execAsync(`DROP TABLE IF EXISTS ${TABLES.ADVISORIES_CACHE};`);
    await db.execAsync(`DROP TABLE IF EXISTS ${TABLES.CACHE_METADATA};`);

    console.log('[Migration 004] Rollback completed successfully');
    return true;
  } catch (error) {
    console.error('[Migration 004] Rollback failed:', error);
    throw error;
  }
};

export default {
  runMigration004,
  rollbackMigration004,
};
