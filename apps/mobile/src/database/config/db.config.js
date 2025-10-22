// Database Configuration and Initialization
// Story 1.1: Local Data Storage Foundation
// Implements: Task 1.2-1.4 (Database initialization, singleton pattern, error handling)

import { Platform } from 'react-native';

// Singleton instance
let databaseInstance = null;

// Platform-specific SQLite import - only load on native platforms
let SQLite = null;
let DATABASE_NAME = null;
let DATABASE_VERSION = null;
let runMigrations001 = null;
let runMigration002 = null;
let runMigration003 = null;
let runMigration004 = null;
let runMigration005 = null;
let runMigration006 = null;

// Only import SQLite and related modules on native platforms
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  const dbConstants = require('../../constants/DatabaseConstants');
  DATABASE_NAME = dbConstants.DATABASE_NAME;
  DATABASE_VERSION = dbConstants.DATABASE_VERSION;
  runMigrations001 = require('../migrations/001_initial_schema').runMigrations;
  runMigration002 = require('../migrations/002_ai_models').runMigration002;
  runMigration003 = require('../migrations/003_image_upload_queue').runMigration003;
  runMigration004 = require('../migrations/004_weather_advisory_cache').runMigration004;
  runMigration005 = require('../migrations/005_sync_monitoring').runMigration005;
  runMigration006 = require('../migrations/006_health_checks').runMigration006;
}

/**
 * Initialize database connection (Singleton pattern)
 * Implements AC1: App uses SQLite for local data persistence
 * Note: On web platform, this is a no-op and returns a mock database
 */
/**
 * Create a mock database for web platform
 * Provides stub methods that return empty data
 */
const createMockDatabase = () => ({
  platform: 'web',
  mock: true,
  // Stub methods to prevent crashes
  execAsync: async () => { console.log('[DB Mock] execAsync called'); },
  getFirstAsync: async () => { console.log('[DB Mock] getFirstAsync called'); return null; },
  getAllAsync: async () => { console.log('[DB Mock] getAllAsync called'); return []; },
  runAsync: async () => { console.log('[DB Mock] runAsync called'); return { lastInsertRowId: 0, changes: 0 }; },
  closeAsync: async () => { console.log('[DB Mock] closeAsync called'); },
});

export const initDatabase = async () => {
  try {
    // Skip database initialization on web
    if (Platform.OS === 'web') {
      console.log('[DB] Web platform detected - using mock database');
      databaseInstance = createMockDatabase();
      return databaseInstance;
    }

    if (databaseInstance) {
      console.log('[DB] Database already initialized');
      return databaseInstance;
    }

    console.log('[DB] Initializing database...');
    
    // Open/create database
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Enable foreign key support
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Check database version
    await checkAndMigrate(db);
    
    databaseInstance = db;
    console.log('[DB] Database initialized successfully');
    
    return db;
  } catch (error) {
    console.error('[DB] Database initialization failed:', error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
};

/**
 * Check database version and run migrations if needed
 */
const checkAndMigrate = async (db) => {
  try {
    // Create or get user_version
    const result = await db.getFirstAsync('PRAGMA user_version;');
    const currentVersion = result?.user_version || 0;
    
    console.log(`[DB] Current database version: ${currentVersion}`);
    console.log(`[DB] Target database version: ${DATABASE_VERSION}`);
    
    if (currentVersion < DATABASE_VERSION) {
      console.log('[DB] Running migrations...');

      // Run migration 001 (Story 1.1)
      if (currentVersion < 1) {
        await runMigrations001(db, currentVersion, 1);
      }

      // Run migration 002 (Story 1.3)
      if (currentVersion < 2 && DATABASE_VERSION >= 2) {
        await runMigration002(db);
      }

      // Run migration 003 (Story 1.4)
      if (currentVersion < 3 && DATABASE_VERSION >= 3) {
        await runMigration003(db);
      }

      // Run migration 004 (Story 1.5)
      if (currentVersion < 4 && DATABASE_VERSION >= 4) {
        await runMigration004(db);
      }

      // Run migration 005 (Story 1.6)
      if (currentVersion < 5 && DATABASE_VERSION >= 5) {
        await runMigration005(db);
      }

      // Run migration 006 (Story 3.1)
      if (currentVersion < 6 && DATABASE_VERSION >= 6) {
        await runMigration006(db);
      }

      // Update version
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
      console.log('[DB] Migrations completed successfully');
    } else {
      console.log('[DB] Database is up to date');
    }
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
};

/**
 * Get database instance (must call initDatabase first)
 * Note: On web platform, returns a mock database object
 */
export const getDatabase = () => {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  // No warning needed - mock database is expected on web
  return databaseInstance;
};

/**
 * Close database connection
 * Used for cleanup during app shutdown or testing
 * Note: On web platform, this is a no-op
 */
export const closeDatabase = async () => {
  if (Platform.OS === 'web') {
    console.log('[DB] Web platform - no database to close');
    databaseInstance = null;
    return;
  }
  
  if (databaseInstance) {
    try {
      await databaseInstance.closeAsync();
      databaseInstance = null;
      console.log('[DB] Database closed successfully');
    } catch (error) {
      console.error('[DB] Error closing database:', error);
      throw error;
    }
  }
};

/**
 * Reset database (for development/testing only)
 * WARNING: This will delete all data!
 * Note: On web platform, this is a no-op
 */
export const resetDatabase = async () => {
  if (Platform.OS === 'web') {
    console.log('[DB] Web platform - no database to reset');
    return;
  }
  
  try {
    console.log('[DB] Resetting database...');
    
    if (databaseInstance) {
      await closeDatabase();
    }
    
    // Delete database file
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    console.log('[DB] Database deleted');
    
    // Reinitialize
    await initDatabase();
    console.log('[DB] Database reset complete');
  } catch (error) {
    console.error('[DB] Database reset failed:', error);
    throw error;
  }
};

/**
 * Execute a transaction
 * Implements: Task 3.7 (Transaction support for multi-table operations)
 * Note: On web platform, this is a no-op and just executes the callback
 */
export const executeTransaction = async (callback) => {
  if (Platform.OS === 'web') {
    // Silent on web - just execute callback with mock db
    await callback(databaseInstance);
    return;
  }
  
  const db = getDatabase();
  
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    await callback(db);
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[DB] Transaction failed, rolled back:', error);
    throw error;
  }
};

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  resetDatabase,
  executeTransaction,
};

