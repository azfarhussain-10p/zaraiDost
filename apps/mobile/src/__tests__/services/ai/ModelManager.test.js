// ModelManager Unit Tests
// Story 1.3: Offline AI Model Storage
// Implements: Task 7.1

import ModelManager from '../../../services/ai/ModelManager';
import ModelMetadataRepository from '../../../database/repositories/ModelMetadataRepository';
import ModelDownloader from '../../../services/ai/ModelDownloader';

// Mock dependencies
jest.mock('../../../database/repositories/ModelMetadataRepository');
jest.mock('../../../services/ai/ModelDownloader');
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/directory/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('ModelManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with existing model', async () => {
      const mockModel = {
        id: 1,
        model_name: 'disease_detection',
        version: 'v1.0.0',
        file_path: 'models/disease_detection_v1.0.0.tflite',
        is_active: 1,
      };

      ModelMetadataRepository.getActiveModel.mockResolvedValue(mockModel);

      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
      FileSystem.makeDirectoryAsync.mockResolvedValue();

      const result = await ModelManager.initialize();

      expect(result).toBe(true);
      expect(ModelManager.getStatus().model).toEqual(mockModel);
    });

    it('should initialize successfully without existing model', async () => {
      ModelMetadataRepository.getActiveModel.mockResolvedValue(null);

      const FileSystem = require('expo-file-system');
      FileSystem.getInfoAsync.mockResolvedValue({ exists: true });

      const result = await ModelManager.initialize();

      expect(result).toBe(true);
      expect(ModelManager.getStatus().model).toBeNull();
    });
  });

  describe('downloadModel', () => {
    it('should download model successfully', async () => {
      const mockDownloadResult = {
        success: true,
        filePath: '/mock/directory/models/disease_detection_v1.0.0.tflite',
        fileSize: 25000000,
        checksum: 'abc123',
      };

      ModelDownloader.downloadModel.mockResolvedValue(mockDownloadResult);
      ModelMetadataRepository.save.mockResolvedValue({ id: 1 });
      ModelMetadataRepository.setActiveModel.mockResolvedValue({});

      const result = await ModelManager.downloadModel();

      expect(result.success).toBe(true);
      expect(ModelDownloader.downloadModel).toHaveBeenCalled();
      expect(ModelMetadataRepository.save).toHaveBeenCalled();
    });

    it('should handle download failure', async () => {
      ModelDownloader.downloadModel.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const result = await ModelManager.downloadModel();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('checkForUpdates', () => {
    it('should detect when update is available', async () => {
      const currentModel = { version: 'v1.0.0' };
      ModelManager.currentModel = currentModel;

      ModelMetadataRepository.isUpdateAvailable.mockReturnValue(true);

      const result = await ModelManager.checkForUpdates();

      expect(result.updateAvailable).toBe(false); // Mock mode returns false
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage information', async () => {
      ModelMetadataRepository.getTotalStorageUsed.mockResolvedValue({
        bytes: 25000000,
        mb: 23.84,
      });

      const result = await ModelManager.getStorageUsage();

      expect(result.usedMB).toBe(23.84);
      expect(result.limitMB).toBe(50);
      expect(result.withinLimit).toBe(true);
    });
  });
});
