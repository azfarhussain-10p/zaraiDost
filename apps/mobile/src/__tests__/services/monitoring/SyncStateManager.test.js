// SyncStateManager Tests
// Story 1.6: Network Status and Sync Monitoring

import {
  getSyncState,
  getPendingChanges,
  getPendingChangesByEntity,
  onSyncStart,
  onSyncComplete,
  onSyncFail,
  isSyncNeeded,
  getSyncStatusMessage,
} from '../../../services/monitoring/SyncStateManager';
import * as SyncStateMetadataRepository from '../../../database/repositories/SyncStateMetadataRepository';
import * as SyncPreferencesRepository from '../../../database/repositories/SyncPreferencesRepository';
import { getDatabase } from '../../../database/config/db.config';
import { SYNC_STATE } from '../../../constants/SyncConstants';

// Mock dependencies
jest.mock('../../../database/config/db.config');
jest.mock('../../../database/repositories/SyncStateMetadataRepository');
jest.mock('../../../database/repositories/SyncPreferencesRepository');

describe('SyncStateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSyncState', () => {
    it('should return comprehensive sync state', async () => {
      // Mock metadata
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        lastSuccessfulSync: '2025-01-01T12:00:00Z',
        lastSyncAttempt: '2025-01-01T12:00:00Z',
        lastSyncDurationMs: 5000,
        nextScheduledSync: '2025-01-01T18:00:00Z',
        syncEnabled: true,
        currentStatus: SYNC_STATE.SYNCED,
      });

      // Mock preferences
      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({
        wifiOnlyMode: false,
        backgroundSyncEnabled: true,
        syncFrequencyHours: 6,
      });

      // Mock pending changes
      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
          new: 0,
          updated: 0,
          deleted: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(3600); // 1 hour

      const state = await getSyncState();

      expect(state).toMatchObject({
        lastSuccessfulSync: '2025-01-01T12:00:00Z',
        syncEnabled: true,
        currentStatus: SYNC_STATE.SYNCED,
        wifiOnlyMode: false,
        backgroundSyncEnabled: true,
        syncFrequencyHours: 6,
        pendingChanges: 0,
        hasPendingChanges: false,
        timeSinceLastSyncSeconds: 3600,
      });
    });
  });

  describe('getPendingChanges', () => {
    it('should return zero pending changes on web platform', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'web';

      const result = await getPendingChanges();

      expect(result.total).toBe(0);
      expect(result.byEntity).toMatchObject({
        farmers: { new: 0, updated: 0, deleted: 0 },
        fields: { new: 0, updated: 0, deleted: 0 },
        crops: { new: 0, updated: 0, deleted: 0 },
        queries: { new: 0, updated: 0, deleted: 0 },
        images: { new: 0, updated: 0, deleted: 0 },
      });

      require('react-native').Platform.OS = originalPlatform;
    });

    it('should count pending changes across entities', async () => {
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce({ total: 2, new: 1, updated: 1, deleted: 0 }) // farmers
          .mockResolvedValueOnce({ total: 0, new: 0, updated: 0, deleted: 0 }) // fields
          .mockResolvedValueOnce({ total: 1, new: 1, updated: 0, deleted: 0 }) // crops
          .mockResolvedValueOnce({ total: 3, new: 2, updated: 0, deleted: 1 }) // queries
          .mockResolvedValueOnce({ total: 5, new: 5, updated: 0, deleted: 0 }), // images
      };
      getDatabase.mockResolvedValue(mockDb);

      const result = await getPendingChanges();

      expect(result.total).toBe(11);
      expect(result.byEntity.farmers).toEqual({ new: 1, updated: 1, deleted: 0 });
      expect(result.byEntity.queries).toEqual({ new: 2, updated: 0, deleted: 1 });
      expect(result.byEntity.images).toEqual({ new: 5, updated: 0, deleted: 0 });
    });
  });

  describe('onSyncStart', () => {
    it('should mark sync as started', async () => {
      SyncStateMetadataRepository.markSyncStarted.mockResolvedValue({
        currentStatus: SYNC_STATE.SYNCING,
      });

      const result = await onSyncStart();

      expect(SyncStateMetadataRepository.markSyncStarted).toHaveBeenCalled();
      expect(result.currentStatus).toBe(SYNC_STATE.SYNCING);
    });
  });

  describe('onSyncComplete', () => {
    it('should mark sync as completed and schedule next sync', async () => {
      SyncStateMetadataRepository.markSyncCompleted.mockResolvedValue({
        currentStatus: SYNC_STATE.SYNCED,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({
        backgroundSyncEnabled: true,
        syncFrequencyHours: 6,
      });

      SyncStateMetadataRepository.updateSyncStateMetadata.mockResolvedValue({});
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        currentStatus: SYNC_STATE.SYNCED,
      });

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
          new: 0,
          updated: 0,
          deleted: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(0);

      await onSyncComplete(5000);

      expect(SyncStateMetadataRepository.markSyncCompleted).toHaveBeenCalledWith(5000);
      expect(SyncStateMetadataRepository.updateSyncStateMetadata).toHaveBeenCalled();
    });
  });

  describe('onSyncFail', () => {
    it('should mark sync as failed', async () => {
      SyncStateMetadataRepository.markSyncFailed.mockResolvedValue({
        currentStatus: SYNC_STATE.FAILED,
      });

      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        currentStatus: SYNC_STATE.FAILED,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({
        wifiOnlyMode: false,
        backgroundSyncEnabled: true,
      });

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
          new: 0,
          updated: 0,
          deleted: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(3600);

      const error = new Error('Sync failed');
      await onSyncFail(error);

      expect(SyncStateMetadataRepository.markSyncFailed).toHaveBeenCalled();
    });
  });

  describe('isSyncNeeded', () => {
    it('should return false if sync is disabled', async () => {
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        syncEnabled: false,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({});

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(3600);

      const result = await isSyncNeeded();

      expect(result).toBe(false);
    });

    it('should return true if there are pending changes', async () => {
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        syncEnabled: true,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({
        backgroundSyncEnabled: true,
      });

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 5, // 5 pending changes
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(1800);

      const result = await isSyncNeeded();

      expect(result).toBe(true);
    });
  });

  describe('getSyncStatusMessage', () => {
    it('should return "Syncing..." when sync is in progress', async () => {
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        currentStatus: SYNC_STATE.SYNCING,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({});

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(null);

      const message = await getSyncStatusMessage();

      expect(message).toBe('Syncing...');
    });

    it('should return time since last sync when synced', async () => {
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        currentStatus: SYNC_STATE.SYNCED,
        lastSuccessfulSync: '2025-01-01T12:00:00Z',
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({});

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 0,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(3600); // 1 hour

      const message = await getSyncStatusMessage();

      expect(message).toBe('Synced 1 hour ago');
    });

    it('should return pending items count when idle with pending changes', async () => {
      SyncStateMetadataRepository.getSyncStateMetadata.mockResolvedValue({
        currentStatus: SYNC_STATE.IDLE,
      });

      SyncPreferencesRepository.getSyncPreferences.mockResolvedValue({});

      const mockDb = {
        getFirstAsync: jest.fn().mockResolvedValue({
          total: 5,
        }),
      };
      getDatabase.mockResolvedValue(mockDb);

      SyncStateMetadataRepository.getTimeSinceLastSync.mockResolvedValue(null);

      const message = await getSyncStatusMessage();

      expect(message).toBe('5 item(s) to sync');
    });
  });
});

