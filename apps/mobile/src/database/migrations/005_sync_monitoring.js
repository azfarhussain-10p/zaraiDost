// Database Migration 005: Sync Monitoring
// Story 1.6: Network Status and Sync Monitoring
// Creates tables for sync history, data usage tracking, preferences, and state metadata

/**
 * Migration 005: Sync Monitoring Tables
 * 
 * Tables created:
 * - sync_history: Logs each sync operation with details
 * - data_usage: Tracks bandwidth usage per sync
 * - sync_preferences: User preferences for sync behavior
 * - sync_state_metadata: Current sync state and metadata
 */
export async function runMigration005(db) {
  console.log('[Migration 005] Starting sync monitoring tables creation...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Sync History Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_history (
        id TEXT PRIMARY KEY,
        sync_start_time DATETIME NOT NULL,
        sync_end_time DATETIME,
        sync_duration_ms INTEGER,
        sync_status TEXT NOT NULL,
        connection_type TEXT,
        entities_synced TEXT,
        total_records_synced INTEGER DEFAULT 0,
        total_records_failed INTEGER DEFAULT 0,
        data_uploaded_bytes INTEGER DEFAULT 0,
        data_downloaded_bytes INTEGER DEFAULT 0,
        error_messages TEXT,
        sync_trigger TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for sync_history
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_history_date 
      ON sync_history(sync_start_time DESC);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sync_history_status 
      ON sync_history(sync_status);
    `);

    console.log('[Migration 005] sync_history table created');

    // 2. Data Usage Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS data_usage (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        connection_type TEXT NOT NULL,
        sync_operation_id TEXT,
        bytes_uploaded INTEGER DEFAULT 0,
        bytes_downloaded INTEGER DEFAULT 0,
        total_bytes INTEGER DEFAULT 0,
        entity_breakdown TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sync_operation_id) REFERENCES sync_history(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for data_usage
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_data_usage_date 
      ON data_usage(date DESC);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_data_usage_connection 
      ON data_usage(connection_type);
    `);

    console.log('[Migration 005] data_usage table created');

    // 3. Sync Preferences Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        wifi_only_mode BOOLEAN DEFAULT 0,
        background_sync_enabled BOOLEAN DEFAULT 1,
        sync_frequency_hours INTEGER DEFAULT 6,
        auto_image_upload BOOLEAN DEFAULT 1,
        low_battery_skip_sync BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default preferences
    await db.execAsync(`
      INSERT OR IGNORE INTO sync_preferences (id, user_id, wifi_only_mode, background_sync_enabled)
      VALUES (1, 'default_user', 0, 1);
    `);

    console.log('[Migration 005] sync_preferences table created with defaults');

    // 4. Sync State Metadata Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_state_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_successful_sync DATETIME,
        last_sync_attempt DATETIME,
        last_sync_duration_ms INTEGER,
        next_scheduled_sync DATETIME,
        sync_enabled BOOLEAN DEFAULT 1,
        current_status TEXT DEFAULT 'idle',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default state
    await db.execAsync(`
      INSERT OR IGNORE INTO sync_state_metadata (id, sync_enabled, current_status)
      VALUES (1, 1, 'idle');
    `);

    console.log('[Migration 005] sync_state_metadata table created with defaults');

    await db.execAsync('COMMIT;');
    console.log('[Migration 005] Migration completed successfully');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 005] Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration 005 (for testing purposes)
 */
export async function rollbackMigration005(db) {
  console.log('[Migration 005] Rolling back sync monitoring tables...');

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    await db.execAsync('DROP TABLE IF EXISTS data_usage;');
    await db.execAsync('DROP TABLE IF EXISTS sync_history;');
    await db.execAsync('DROP TABLE IF EXISTS sync_state_metadata;');
    await db.execAsync('DROP TABLE IF EXISTS sync_preferences;');

    await db.execAsync('COMMIT;');
    console.log('[Migration 005] Rollback completed');

    return true;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    console.error('[Migration 005] Rollback failed:', error);
    throw error;
  }
}

export default {
  runMigration005,
  rollbackMigration005,
};

