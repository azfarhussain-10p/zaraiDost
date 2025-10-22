// Conflict Resolver Service
// Story 1.2: Background Synchronization Service
// Implements: Task 4 (Conflict resolution strategy)

import { SYNC_STATUS } from '../../constants/SyncConstants';

/**
 * Handles conflict resolution between local and remote data
 * Strategy: Last-Write-Wins (newest timestamp wins)
 */
class ConflictResolver {
  constructor() {
    this.conflictLog = [];
  }

  /**
   * Resolve conflict between local and remote entity
   * Implements: Task 4.1, 4.2 (Compare timestamps, last-write-wins)
   *
   * @param {Object} localEntity - Local database record
   * @param {Object} remoteEntity - Remote server record
   * @returns {Object} Resolution result with winner and action
   */
  resolve(localEntity, remoteEntity, entityType) {
    // Parse timestamps
    const localTimestamp = new Date(localEntity.updated_at).getTime();
    const remoteTimestamp = new Date(remoteEntity.updated_at).getTime();

    console.log(`[ConflictResolver] Resolving conflict for ${entityType} ${localEntity.id}`);
    console.log(`  Local timestamp: ${localEntity.updated_at} (${localTimestamp})`);
    console.log(`  Remote timestamp: ${remoteEntity.updated_at} (${remoteTimestamp})`);

    let resolution;

    if (localTimestamp > remoteTimestamp) {
      // Local is newer - push to server
      resolution = {
        winner: 'local',
        action: 'push_to_server',
        entity: localEntity,
        reason: 'Local record is newer',
      };
    } else if (remoteTimestamp > localTimestamp) {
      // Remote is newer - pull from server
      resolution = {
        winner: 'remote',
        action: 'pull_from_server',
        entity: remoteEntity,
        reason: 'Remote record is newer',
      };
    } else {
      // Timestamps are equal - no conflict
      resolution = {
        winner: 'none',
        action: 'no_action',
        entity: localEntity,
        reason: 'Timestamps are identical',
      };
    }

    // Implements: Task 4.4 (Log conflicts)
    this.logConflict(entityType, localEntity, remoteEntity, resolution);

    return resolution;
  }

  /**
   * Batch resolve multiple conflicts
   *
   * @param {Array} conflicts - Array of {local, remote, type} objects
   * @returns {Object} Resolution results grouped by action
   */
  resolveBatch(conflicts) {
    const results = {
      push_to_server: [],
      pull_from_server: [],
      no_action: [],
    };

    for (const conflict of conflicts) {
      const resolution = this.resolve(
        conflict.local,
        conflict.remote,
        conflict.type
      );

      results[resolution.action].push({
        id: conflict.local.id,
        type: conflict.type,
        resolution,
      });
    }

    return results;
  }

  /**
   * Log conflict for monitoring
   * Implements: Task 4.4 (Log conflicts)
   */
  logConflict(entityType, localEntity, remoteEntity, resolution) {
    const conflictRecord = {
      timestamp: new Date().toISOString(),
      entityType,
      entityId: localEntity.id,
      localTimestamp: localEntity.updated_at,
      remoteTimestamp: remoteEntity.updated_at,
      winner: resolution.winner,
      action: resolution.action,
      reason: resolution.reason,
    };

    this.conflictLog.push(conflictRecord);

    // Keep only last 100 conflicts in memory
    if (this.conflictLog.length > 100) {
      this.conflictLog.shift();
    }

    console.log('[ConflictResolver] Conflict logged:', conflictRecord);
  }

  /**
   * Get conflict history
   */
  getConflictLog(limit = 50) {
    return this.conflictLog.slice(-limit).reverse();
  }

  /**
   * Clear conflict log
   */
  clearLog() {
    this.conflictLog = [];
  }

  /**
   * Get conflict statistics
   */
  getStatistics() {
    const total = this.conflictLog.length;
    const localWins = this.conflictLog.filter(c => c.winner === 'local').length;
    const remoteWins = this.conflictLog.filter(c => c.winner === 'remote').length;
    const noConflicts = this.conflictLog.filter(c => c.winner === 'none').length;

    return {
      total,
      localWins,
      remoteWins,
      noConflicts,
      winRate: total > 0 ? ((localWins / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Determine if entity needs conflict check
   * Check if both local and remote have been modified since last sync
   */
  needsConflictCheck(localEntity) {
    return (
      localEntity.sync_status === SYNC_STATUS.PENDING &&
      localEntity.last_synced_at !== null
    );
  }
}

// Singleton instance
export default new ConflictResolver();
