// Database Migration 007: Diseases Table
// Story 3.2: On-Device Disease Detection Model
// Creates diseases reference table and extends health_checks/images for analysis results

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Migration 007: Diseases Reference Table
 * 
 * Creates:
 * - diseases table (50+ disease/pest/deficiency classes)
 * - Extends health_checks with on-device analysis fields
 * - Extends images with per-image prediction fields
 */
export async function runMigration007(db) {
  console.log('[Migration 007] Starting diseases table creation...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Create diseases reference table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLES.DISEASES} (
        id TEXT PRIMARY KEY,
        class_id INTEGER UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ur TEXT,
        name_pa TEXT,
        name_sd TEXT,
        category TEXT NOT NULL,
        severity TEXT,
        affected_crops TEXT NOT NULL,
        description_en TEXT,
        description_ur TEXT,
        scientific_name TEXT,
        symptoms_en TEXT,
        symptoms_ur TEXT,
        treatment_summary_en TEXT,
        treatment_summary_ur TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for diseases table
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_diseases_class_id 
      ON ${TABLES.DISEASES}(class_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_diseases_category 
      ON ${TABLES.DISEASES}(category);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_diseases_severity 
      ON ${TABLES.DISEASES}(severity);
    `);

    console.log('[Migration 007] diseases table created');

    // 2. Extend health_checks table with analysis fields
    const healthChecksInfo = await db.getAllAsync(`PRAGMA table_info(${TABLES.HEALTH_CHECKS});`);
    const healthChecksColumns = healthChecksInfo.map((col) => col.name);

    if (!healthChecksColumns.includes('on_device_analysis_time_ms')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS} 
        ADD COLUMN on_device_analysis_time_ms INTEGER;
      `);
      console.log('[Migration 007] Added on_device_analysis_time_ms to health_checks');
    }

    if (!healthChecksColumns.includes('on_device_model_version')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS} 
        ADD COLUMN on_device_model_version TEXT;
      `);
      console.log('[Migration 007] Added on_device_model_version to health_checks');
    }

    if (!healthChecksColumns.includes('top_disease_id')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS} 
        ADD COLUMN top_disease_id TEXT;
      `);
      console.log('[Migration 007] Added top_disease_id to health_checks');
    }

    if (!healthChecksColumns.includes('top_disease_confidence')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS} 
        ADD COLUMN top_disease_confidence REAL;
      `);
      console.log('[Migration 007] Added top_disease_confidence to health_checks');
    }

    if (!healthChecksColumns.includes('needs_cloud_verification')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS} 
        ADD COLUMN needs_cloud_verification BOOLEAN DEFAULT 0;
      `);
      console.log('[Migration 007] Added needs_cloud_verification to health_checks');
    }

    // 3. Extend images table with per-image analysis fields
    const imagesInfo = await db.getAllAsync(`PRAGMA table_info(${TABLES.IMAGES});`);
    const imagesColumns = imagesInfo.map((col) => col.name);

    if (!imagesColumns.includes('disease_predictions')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.IMAGES} 
        ADD COLUMN disease_predictions TEXT;
      `);
      console.log('[Migration 007] Added disease_predictions to images');
    }

    if (!imagesColumns.includes('inference_time_ms')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.IMAGES} 
        ADD COLUMN inference_time_ms INTEGER;
      `);
      console.log('[Migration 007] Added inference_time_ms to images');
    }

    if (!imagesColumns.includes('model_version')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.IMAGES} 
        ADD COLUMN model_version TEXT;
      `);
      console.log('[Migration 007] Added model_version to images');
    }

    if (!imagesColumns.includes('top_disease_class_id')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.IMAGES} 
        ADD COLUMN top_disease_class_id INTEGER;
      `);
      console.log('[Migration 007] Added top_disease_class_id to images');
    }

    await db.execAsync('COMMIT;');
    console.log('[Migration 007] Migration completed successfully');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 007] Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration 007 (for testing purposes)
 */
export async function rollbackMigration007(db) {
  console.log('[Migration 007] Rolling back diseases table...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // Drop diseases table
    await db.execAsync(`DROP TABLE IF EXISTS ${TABLES.DISEASES};`);

    // Drop indexes
    await db.execAsync('DROP INDEX IF EXISTS idx_diseases_class_id;');
    await db.execAsync('DROP INDEX IF EXISTS idx_diseases_category;');
    await db.execAsync('DROP INDEX IF EXISTS idx_diseases_severity;');

    // Note: Cannot drop columns in SQLite, they remain in health_checks and images tables

    await db.execAsync('COMMIT;');
    console.log('[Migration 007] Rollback completed');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 007] Rollback failed:', error);
    throw error;
  }
}

export default {
  runMigration007,
  rollbackMigration007,
};

