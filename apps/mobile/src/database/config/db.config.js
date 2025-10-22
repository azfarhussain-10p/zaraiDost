// Database Configuration and Initialization
// Story 1.1: Local Data Storage Foundation
// Implements: Task 1.2-1.4 (Database initialization, singleton pattern, error handling)

import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, DATABASE_VERSION } from '../../constants/DatabaseConstants';
import { runMigrations as runMigrations001 } from '../migrations/001_initial_schema';
import { runMigration002 } from '../migrations/002_ai_models';

// Singleton instance
let databaseInstance = null;

/**
 * Initialize database connection (Singleton pattern)
 * Implements AC1: App uses SQLite for local data persistence
 */
export const initDatabase = async () => {
  try {
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
 */
export const getDatabase = () => {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return databaseInstance;
};

/**
 * Close database connection
 * Used for cleanup during app shutdown or testing
 */
export const closeDatabase = async () => {
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
 */
export const resetDatabase = async () => {
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
 */
export const executeTransaction = async (callback) => {
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

