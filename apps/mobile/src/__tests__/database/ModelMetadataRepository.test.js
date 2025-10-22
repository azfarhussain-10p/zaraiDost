// ModelMetadataRepository Unit Tests
// Story 1.3: Offline AI Model Storage
// Implements: Task 7.3

import ModelMetadataRepository from '../../database/repositories/ModelMetadataRepository';

// Mock database
jest.mock('../../database/config/db.config', () => ({
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

describe('ModelMetadataRepository', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    const { getDatabase } = require('../../database/config/db.config');
    mockDb = getDatabase();
  });

  describe('save', () => {
    it('should insert new model metadata', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null); // No existing record
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });

      const modelData = {
        model_name: 'disease_detection',
        version: 'v1.0.0',
        file_path: 'models/disease_detection.tflite',
        file_size_bytes: 25000000,
        checksum: 'abc123',
        is_active: 1,
      };

      const result = await ModelMetadataRepository.save(modelData);

      expect(result.id).toBe(1);
      expect(result.model_name).toBe('disease_detection');
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('should update existing model metadata', async () => {
      const existing = {
        id: 1,
        model_name: 'disease_detection',
        version: 'v1.0.0',
      };

      mockDb.getFirstAsync.mockResolvedValue(existing);
      mockDb.runAsync.mockResolvedValue({});

      const modelData = {
        model_name: 'disease_detection',
        version: 'v1.0.0',
        file_path: 'models/disease_detection.tflite',
        file_size_bytes: 26000000,
      };

      const result = await ModelMetadataRepository.save(modelData);

      expect(result.file_size_bytes).toBe(26000000);
      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('getActiveModel', () => {
    it('should return active model', async () => {
      const mockModel = {
        id: 1,
        model_name: 'disease_detection',
        version: 'v1.0.0',
        is_active: 1,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockModel);

      const result = await ModelMetadataRepository.getActiveModel('disease_detection');

      expect(result).toEqual(mockModel);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_active = 1'),
        ['disease_detection']
      );
    });

    it('should return null if no active model', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await ModelMetadataRepository.getActiveModel('disease_detection');

      expect(result).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should correctly compare version numbers', () => {
      expect(ModelMetadataRepository.compareVersions('v1.2.0', 'v1.1.0')).toBe(1);
      expect(ModelMetadataRepository.compareVersions('v1.1.0', 'v1.2.0')).toBe(-1);
      expect(ModelMetadataRepository.compareVersions('v1.1.0', 'v1.1.0')).toBe(0);
      expect(ModelMetadataRepository.compareVersions('v2.0.0', 'v1.9.9')).toBe(1);
    });
  });

  describe('isUpdateAvailable', () => {
    it('should return true when newer version available', () => {
      const result = ModelMetadataRepository.isUpdateAvailable('v1.0.0', 'v1.1.0');
      expect(result).toBe(true);
    });

    it('should return false when current version is latest', () => {
      const result = ModelMetadataRepository.isUpdateAvailable('v1.1.0', 'v1.0.0');
      expect(result).toBe(false);
    });
  });

  describe('getTotalStorageUsed', () => {
    it('should calculate total storage', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total_bytes: 50000000 });

      const result = await ModelMetadataRepository.getTotalStorageUsed();

      expect(result.bytes).toBe(50000000);
      expect(result.mb).toBe(47.68);
    });

    it('should handle zero storage', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ total_bytes: null });

      const result = await ModelMetadataRepository.getTotalStorageUsed();

      expect(result.bytes).toBe(0);
      expect(result.mb).toBe(0);
    });
  });
});
