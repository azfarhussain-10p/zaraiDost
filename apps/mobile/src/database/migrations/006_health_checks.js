// Database Migration 006: Health Checks
// Story 3.1: Image Capture and Upload Interface
// Creates health_checks table and extends images table for crop health monitoring

/**
 * Migration 006: Health Checks Table
 * 
 * Tables modified:
 * - health_checks (new): Track crop health check sessions with multiple images
 * - images (extended): Link images to health check sessions
 */
export async function runMigration006(db) {
  console.log('[Migration 006] Starting health checks table creation...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Create health_checks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        farmer_id TEXT NOT NULL,
        field_id TEXT,
        crop_id TEXT,
        crop_type TEXT NOT NULL,
        description TEXT,
        location_latitude REAL,
        location_longitude REAL,
        location_accuracy REAL,
        image_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        on_device_result TEXT,
        cloud_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for health_checks
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_farmer 
      ON health_checks(farmer_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_created 
      ON health_checks(created_at DESC);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_status 
      ON health_checks(status);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_sync 
      ON health_checks(sync_status);
    `);

    console.log('[Migration 006] health_checks table created');

    // 2. Extend images table with health check fields
    // Check if columns already exist (for idempotency)
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(images);`);
    const existingColumns = tableInfo.map((col) => col.name);

    if (!existingColumns.includes('health_check_id')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN health_check_id TEXT;
      `);
      console.log('[Migration 006] Added health_check_id to images table');
    }

    if (!existingColumns.includes('image_sequence')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN image_sequence INTEGER DEFAULT 1;
      `);
      console.log('[Migration 006] Added image_sequence to images table');
    }

    if (!existingColumns.includes('quality_score')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN quality_score REAL;
      `);
      console.log('[Migration 006] Added quality_score to images table');
    }

    if (!existingColumns.includes('blur_score')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN blur_score REAL;
      `);
      console.log('[Migration 006] Added blur_score to images table');
    }

    if (!existingColumns.includes('width')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN width INTEGER;
      `);
      console.log('[Migration 006] Added width to images table');
    }

    if (!existingColumns.includes('height')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN height INTEGER;
      `);
      console.log('[Migration 006] Added height to images table');
    }

    if (!existingColumns.includes('file_size_bytes')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN file_size_bytes INTEGER;
      `);
      console.log('[Migration 006] Added file_size_bytes to images table');
    }

    if (!existingColumns.includes('has_gps')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN has_gps BOOLEAN DEFAULT 0;
      `);
      console.log('[Migration 006] Added has_gps to images table');
    }

    if (!existingColumns.includes('location_gps')) {
      await db.execAsync(`
        ALTER TABLE images ADD COLUMN location_gps TEXT;
      `);
      console.log('[Migration 006] Added location_gps to images table');
    }

    // Create index for health_check_id in images table
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_images_health_check 
      ON images(health_check_id);
    `);

    console.log('[Migration 006] images table extended');

    await db.execAsync('COMMIT;');
    console.log('[Migration 006] Migration completed successfully');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 006] Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration 006 (for testing purposes)
 */
export async function rollbackMigration006(db) {
  console.log('[Migration 006] Rolling back health checks table...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // Note: Cannot drop columns in SQLite, so we just drop the health_checks table
    await db.execAsync('DROP TABLE IF EXISTS health_checks;');

    // Drop indexes
    await db.execAsync('DROP INDEX IF EXISTS idx_images_health_check;');

    await db.execAsync('COMMIT;');
    console.log('[Migration 006] Rollback completed');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 006] Rollback failed:', error);
    throw error;
  }
}

export default {
  runMigration006,
  rollbackMigration006,
};

