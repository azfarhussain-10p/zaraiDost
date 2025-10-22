// 003_image_upload_queue.js
// Story 1.4: Offline Image Processing Queue
// Database migration: Add upload queue tracking fields to images table

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Migration 003: Enhance images table for upload queue management
 *
 * Adds columns for:
 * - Upload tracking (attempts, last attempt, error messages)
 * - File size tracking
 * - Upload priority
 * - GPS location storage
 * - Performance indexes for queue operations
 */

/**
 * Add new columns to images table for upload queue management
 */
const addUploadQueueColumns = async (db) => {
  try {
    console.log('[Migration 003] Adding upload queue columns to images table...');

    // Add upload tracking columns
    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN upload_attempts INTEGER DEFAULT 0;
    `);

    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN last_upload_attempt DATETIME;
    `);

    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN upload_error_message TEXT;
    `);

    // Add file size tracking
    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN file_size_bytes INTEGER;
    `);

    // Add upload priority
    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN upload_priority TEXT DEFAULT 'normal';
    `);

    // Add thumbnail path
    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN thumbnail_path TEXT;
    `);

    // Add crop type (may be null if not selected during capture)
    await db.execAsync(`
      ALTER TABLE ${TABLES.IMAGES} ADD COLUMN crop_type TEXT;
    `);

    console.log('[Migration 003] Upload queue columns added successfully');
  } catch (error) {
    console.error('[Migration 003] Error adding upload queue columns:', error);
    throw error;
  }
};

/**
 * Create performance indexes for upload queue operations
 */
const createQueueIndexes = async (db) => {
  try {
    console.log('[Migration 003] Creating upload queue indexes...');

    // Index for finding pending/failed uploads sorted by priority and timestamp
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_status_priority_timestamp
      ON ${TABLES.IMAGES}(sync_status, upload_priority, timestamp DESC);
    `);

    // Index for finding images by sync status (for queue queries)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_status
      ON ${TABLES.IMAGES}(sync_status);
    `);

    // Index for storage cleanup (find oldest synced images)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_synced_timestamp
      ON ${TABLES.IMAGES}(sync_status, timestamp ASC)
      WHERE sync_status = 'synced';
    `);

    // Index for failed uploads needing retry
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_failed_retries
      ON ${TABLES.IMAGES}(sync_status, upload_attempts)
      WHERE sync_status = 'failed';
    `);

    console.log('[Migration 003] Queue indexes created successfully');
  } catch (error) {
    console.error('[Migration 003] Error creating queue indexes:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
export const runMigration003 = async (db) => {
  try {
    console.log('[Migration 003] Starting image upload queue migration...');

    // Add new columns
    await addUploadQueueColumns(db);

    // Create performance indexes
    await createQueueIndexes(db);

    console.log('[Migration 003] Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('[Migration 003] Migration failed:', error);
    throw error;
  }
};

/**
 * Rollback function (for testing or emergency rollback)
 * Note: SQLite doesn't support DROP COLUMN, so rollback would require table recreation
 */
export const rollbackMigration003 = async (db) => {
  console.warn('[Migration 003] Rollback not supported for ALTER TABLE in SQLite');
  console.warn('[Migration 003] Would require full table recreation with data migration');
  // In production, implement full table recreation with data copy if rollback needed
};

export default {
  runMigration003,
  rollbackMigration003,
};
