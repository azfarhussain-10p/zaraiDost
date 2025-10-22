// Database Migration 008: Cloud Analysis
// Story 3.3: Cloud-Based Enhanced Analysis
// Adds cloud analysis fields to health_checks and creates cloud_analysis_queue table

import { TABLES } from '../../constants/DatabaseConstants';

/**
 * Migration 008: Cloud Analysis
 *
 * Creates:
 * - cloud_analysis_queue table for managing pending cloud analysis requests
 * - Extends health_checks with cloud analysis result fields
 * - Adds comparison fields for on-device vs cloud results
 */
export async function runMigration008(db) {
  console.log('[Migration 008] Starting cloud analysis schema updates...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Create cloud_analysis_queue table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cloud_analysis_queue (
        id TEXT PRIMARY KEY,
        health_check_id TEXT NOT NULL,
        image_urls TEXT NOT NULL,
        context TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        error_message TEXT,
        on_device_result TEXT,
        cloud_result TEXT,
        comparison_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_attempt_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY (health_check_id) REFERENCES ${TABLES.HEALTH_CHECKS}(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for cloud_analysis_queue
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cloud_queue_health_check
      ON cloud_analysis_queue(health_check_id);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cloud_queue_status
      ON cloud_analysis_queue(status, created_at);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cloud_queue_priority
      ON cloud_analysis_queue(priority, status);
    `);

    console.log('[Migration 008] cloud_analysis_queue table created');

    // 2. Extend health_checks table with cloud analysis fields
    const healthChecksInfo = await db.getAllAsync(`PRAGMA table_info(${TABLES.HEALTH_CHECKS});`);
    const healthChecksColumns = healthChecksInfo.map((col) => col.name);

    // Cloud result fields
    if (!healthChecksColumns.includes('cloud_result')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_result TEXT;
      `);
      console.log('[Migration 008] Added cloud_result to health_checks');
    }

    if (!healthChecksColumns.includes('cloud_analysis_time_ms')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_analysis_time_ms INTEGER;
      `);
      console.log('[Migration 008] Added cloud_analysis_time_ms to health_checks');
    }

    if (!healthChecksColumns.includes('cloud_model_version')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_model_version TEXT;
      `);
      console.log('[Migration 008] Added cloud_model_version to health_checks');
    }

    if (!healthChecksColumns.includes('cloud_requested_at')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_requested_at DATETIME;
      `);
      console.log('[Migration 008] Added cloud_requested_at to health_checks');
    }

    if (!healthChecksColumns.includes('cloud_completed_at')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_completed_at DATETIME;
      `);
      console.log('[Migration 008] Added cloud_completed_at to health_checks');
    }

    // Comparison fields
    if (!healthChecksColumns.includes('results_differ')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN results_differ INTEGER DEFAULT 0;
      `);
      console.log('[Migration 008] Added results_differ to health_checks');
    }

    if (!healthChecksColumns.includes('agreement_score')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN agreement_score REAL;
      `);
      console.log('[Migration 008] Added agreement_score to health_checks');
    }

    if (!healthChecksColumns.includes('comparison_result')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN comparison_result TEXT;
      `);
      console.log('[Migration 008] Added comparison_result to health_checks');
    }

    // Cloud status tracking
    if (!healthChecksColumns.includes('cloud_status')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_status TEXT;
      `);
      console.log('[Migration 008] Added cloud_status to health_checks');
    }

    if (!healthChecksColumns.includes('cloud_error')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_error TEXT;
      `);
      console.log('[Migration 008] Added cloud_error to health_checks');
    }

    // User notification flags
    if (!healthChecksColumns.includes('cloud_notified')) {
      await db.execAsync(`
        ALTER TABLE ${TABLES.HEALTH_CHECKS}
        ADD COLUMN cloud_notified INTEGER DEFAULT 0;
      `);
      console.log('[Migration 008] Added cloud_notified to health_checks');
    }

    // Create indexes for cloud analysis queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_cloud_status
      ON ${TABLES.HEALTH_CHECKS}(cloud_status)
      WHERE cloud_status IS NOT NULL;
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_cloud_completed
      ON ${TABLES.HEALTH_CHECKS}(cloud_completed_at)
      WHERE cloud_completed_at IS NOT NULL;
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_results_differ
      ON ${TABLES.HEALTH_CHECKS}(results_differ)
      WHERE results_differ = 1;
    `);

    console.log('[Migration 008] Cloud analysis indexes created');

    await db.execAsync('COMMIT;');
    console.log('[Migration 008] Cloud analysis migration completed successfully');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 008] Cloud analysis migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration 008
 * WARNING: This will drop cloud analysis data
 */
export async function rollbackMigration008(db) {
  console.log('[Migration 008] Rolling back cloud analysis migration...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // Drop cloud_analysis_queue table
    await db.execAsync('DROP TABLE IF EXISTS cloud_analysis_queue;');

    // Drop indexes
    await db.execAsync('DROP INDEX IF EXISTS idx_health_checks_cloud_status;');
    await db.execAsync('DROP INDEX IF EXISTS idx_health_checks_cloud_completed;');
    await db.execAsync('DROP INDEX IF EXISTS idx_health_checks_results_differ;');

    // Note: SQLite doesn't support DROP COLUMN, so we can't remove columns
    // from health_checks table without recreating the table
    console.warn('[Migration 008] Cannot drop columns from health_checks (SQLite limitation)');
    console.warn('[Migration 008] Cloud analysis columns will remain but be unused');

    await db.execAsync('COMMIT;');
    console.log('[Migration 008] Rollback completed');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 008] Rollback failed:', error);
    throw error;
  }
}

export default {
  runMigration008,
  rollbackMigration008,
};
