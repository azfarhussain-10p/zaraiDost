// ConflictResolver Tests
// Story 1.2: Background Synchronization Service
// Implements: Task 7.3 (Unit tests for conflict resolution logic)

describe('ConflictResolver', () => {
  let ConflictResolver;

  beforeEach(() => {
    jest.resetModules();
    ConflictResolver = require('../../../services/sync/ConflictResolver').default;
    ConflictResolver.clearLog();
  });

  describe('resolve()', () => {
    it('should resolve conflict with local winner when local is newer', () => {
      const localEntity = {
        id: 'test-id',
        name: 'Test Farmer',
        updated_at: '2024-10-22T12:00:00Z',
      };

      const remoteEntity = {
        id: 'test-id',
        name: 'Test Farmer Updated',
        updated_at: '2024-10-22T11:00:00Z',
      };

      const resolution = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        'farmer'
      );

      expect(resolution.winner).toBe('local');
      expect(resolution.action).toBe('push_to_server');
      expect(resolution.entity).toEqual(localEntity);
      expect(resolution.reason).toContain('newer');
    });

    it('should resolve conflict with remote winner when remote is newer', () => {
      const localEntity = {
        id: 'test-id',
        name: 'Test Farmer',
        updated_at: '2024-10-22T10:00:00Z',
      };

      const remoteEntity = {
        id: 'test-id',
        name: 'Test Farmer Updated',
        updated_at: '2024-10-22T12:00:00Z',
      };

      const resolution = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        'farmer'
      );

      expect(resolution.winner).toBe('remote');
      expect(resolution.action).toBe('pull_from_server');
      expect(resolution.entity).toEqual(remoteEntity);
      expect(resolution.reason).toContain('newer');
    });

    it('should handle identical timestamps with no conflict', () => {
      const timestamp = '2024-10-22T12:00:00Z';

      const localEntity = {
        id: 'test-id',
        name: 'Test Farmer',
        updated_at: timestamp,
      };

      const remoteEntity = {
        id: 'test-id',
        name: 'Test Farmer',
        updated_at: timestamp,
      };

      const resolution = ConflictResolver.resolve(
        localEntity,
        remoteEntity,
        'farmer'
      );

      expect(resolution.winner).toBe('none');
      expect(resolution.action).toBe('no_action');
      expect(resolution.reason).toContain('identical');
    });

    it('should log conflict resolution', () => {
      const localEntity = {
        id: 'test-id',
        name: 'Test',
        updated_at: '2024-10-22T12:00:00Z',
      };

      const remoteEntity = {
        id: 'test-id',
        name: 'Test',
        updated_at: '2024-10-22T11:00:00Z',
      };

      ConflictResolver.resolve(localEntity, remoteEntity, 'farmer');

      const log = ConflictResolver.getConflictLog();

      expect(log.length).toBe(1);
      expect(log[0].entityId).toBe('test-id');
      expect(log[0].entityType).toBe('farmer');
      expect(log[0].winner).toBe('local');
    });
  });

  describe('resolveBatch()', () => {
    it('should resolve multiple conflicts', () => {
      const conflicts = [
        {
          local: { id: '1', updated_at: '2024-10-22T12:00:00Z' },
          remote: { id: '1', updated_at: '2024-10-22T11:00:00Z' },
          type: 'farmer',
        },
        {
          local: { id: '2', updated_at: '2024-10-22T10:00:00Z' },
          remote: { id: '2', updated_at: '2024-10-22T11:00:00Z' },
          type: 'field',
        },
        {
          local: { id: '3', updated_at: '2024-10-22T12:00:00Z' },
          remote: { id: '3', updated_at: '2024-10-22T12:00:00Z' },
          type: 'crop',
        },
      ];

      const results = ConflictResolver.resolveBatch(conflicts);

      expect(results.push_to_server.length).toBe(1);
      expect(results.pull_from_server.length).toBe(1);
      expect(results.no_action.length).toBe(1);
    });
  });

  describe('getStatistics()', () => {
    it('should calculate conflict statistics', () => {
      // Add some test conflicts
      ConflictResolver.resolve(
        { id: '1', updated_at: '2024-10-22T12:00:00Z' },
        { id: '1', updated_at: '2024-10-22T11:00:00Z' },
        'farmer'
      );

      ConflictResolver.resolve(
        { id: '2', updated_at: '2024-10-22T10:00:00Z' },
        { id: '2', updated_at: '2024-10-22T11:00:00Z' },
        'farmer'
      );

      ConflictResolver.resolve(
        { id: '3', updated_at: '2024-10-22T12:00:00Z' },
        { id: '3', updated_at: '2024-10-22T12:00:00Z' },
        'farmer'
      );

      const stats = ConflictResolver.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.localWins).toBe(1);
      expect(stats.remoteWins).toBe(1);
      expect(stats.noConflicts).toBe(1);
      expect(stats.winRate).toBe('33.33');
    });
  });

  describe('getConflictLog()', () => {
    it('should return conflict log with limit', () => {
      // Add multiple conflicts
      for (let i = 0; i < 15; i++) {
        ConflictResolver.resolve(
          { id: `${i}`, updated_at: '2024-10-22T12:00:00Z' },
          { id: `${i}`, updated_at: '2024-10-22T11:00:00Z' },
          'farmer'
        );
      }

      const log = ConflictResolver.getConflictLog(10);

      expect(log.length).toBe(10);
      // Should be in reverse chronological order (newest first)
      expect(log[0].entityId).toBe('14');
    });

    it('should maintain only last 100 conflicts in memory', () => {
      // Add more than 100 conflicts
      for (let i = 0; i < 150; i++) {
        ConflictResolver.resolve(
          { id: `${i}`, updated_at: '2024-10-22T12:00:00Z' },
          { id: `${i}`, updated_at: '2024-10-22T11:00:00Z' },
          'farmer'
        );
      }

      const log = ConflictResolver.getConflictLog(150);

      // Should only have last 100
      expect(log.length).toBe(100);
    });
  });

  describe('clearLog()', () => {
    it('should clear conflict log', () => {
      ConflictResolver.resolve(
        { id: '1', updated_at: '2024-10-22T12:00:00Z' },
        { id: '1', updated_at: '2024-10-22T11:00:00Z' },
        'farmer'
      );

      expect(ConflictResolver.getConflictLog().length).toBe(1);

      ConflictResolver.clearLog();

      expect(ConflictResolver.getConflictLog().length).toBe(0);
    });
  });

  describe('needsConflictCheck()', () => {
    it('should return true for pending entity that was synced before', () => {
      const entity = {
        sync_status: 'pending',
        last_synced_at: '2024-10-22T10:00:00Z',
      };

      expect(ConflictResolver.needsConflictCheck(entity)).toBe(true);
    });

    it('should return false for new entity never synced', () => {
      const entity = {
        sync_status: 'pending',
        last_synced_at: null,
      };

      expect(ConflictResolver.needsConflictCheck(entity)).toBe(false);
    });

    it('should return false for synced entity', () => {
      const entity = {
        sync_status: 'synced',
        last_synced_at: '2024-10-22T10:00:00Z',
      };

      expect(ConflictResolver.needsConflictCheck(entity)).toBe(false);
    });
  });
});
