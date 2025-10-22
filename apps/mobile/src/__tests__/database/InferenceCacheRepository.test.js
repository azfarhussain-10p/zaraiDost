// InferenceCacheRepository Unit Tests
// Story 1.3: Offline AI Model Storage
// Implements: Task 7.5

import InferenceCacheRepository from '../../database/repositories/InferenceCacheRepository';

// Mock database
jest.mock('../../database/config/db.config', () => ({
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

describe('InferenceCacheRepository', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    const { getDatabase } = require('../../database/config/db.config');
    mockDb = getDatabase();
  });

  describe('save', () => {
    it('should save new cache entry', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      const cacheData = {
        image_hash: 'abc123',
        model_version: 'v1.0.0',
        prediction_result: { disease: 'wheat_leaf_rust', confidence: 0.85 },
        inference_time_ms: 3200,
      };

      const result = await InferenceCacheRepository.save(cacheData);

      expect(result.id).toBe(1);
      expect(result.image_hash).toBe('abc123');
    });

    it('should update existing cache entry', async () => {
      const existing = {
        id: 1,
        image_hash: 'abc123',
        model_version: 'v1.0.0',
      };

      mockDb.getFirstAsync.mockResolvedValue(existing);
      mockDb.runAsync.mockResolvedValue({});

      const cacheData = {
        image_hash: 'abc123',
        model_version: 'v1.0.0',
        prediction_result: { disease: 'healthy', confidence: 0.95 },
        inference_time_ms: 2800,
      };

      const result = await InferenceCacheRepository.save(cacheData);

      expect(result.updated).toBe(true);
    });
  });

  describe('findByHash', () => {
    it('should find cached result by hash', async () => {
      const mockCache = {
        id: 1,
        image_hash: 'abc123',
        model_version: 'v1.0.0',
        prediction_result: '{"disease":"wheat_leaf_rust","confidence":0.85}',
        inference_time_ms: 3200,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockCache);

      const result = await InferenceCacheRepository.findByHash('abc123', 'v1.0.0');

      expect(result).toBeDefined();
      expect(result.prediction_result.disease).toBe('wheat_leaf_rust');
    });

    it('should return null if not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await InferenceCacheRepository.findByHash('xyz789', 'v1.0.0');

      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should delete oldest entries when limit exceeded', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 1500 });
      mockDb.runAsync.mockResolvedValue({ changes: 500 });

      const result = await InferenceCacheRepository.cleanup();

      expect(result).toBe(500);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('should do nothing if within limits', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 800 });

      const result = await InferenceCacheRepository.cleanup();

      expect(result).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return cache statistics', async () => {
      mockDb.getFirstAsync
        .mockResolvedValueOnce({ count: 500 })
        .mockResolvedValueOnce({ avg_time: 3150.5 })
        .mockResolvedValueOnce({ created_at: '2024-10-01T10:00:00Z' })
        .mockResolvedValueOnce({ created_at: '2024-10-22T10:00:00Z' });

      const result = await InferenceCacheRepository.getStatistics();

      expect(result.total_entries).toBe(500);
      expect(result.avg_inference_time_ms).toBe(3150.5);
      expect(result.oldest_entry).toBe('2024-10-01T10:00:00Z');
      expect(result.newest_entry).toBe('2024-10-22T10:00:00Z');
    });
  });
});
