// Model Manager Service
// Story 1.3: Offline AI Model Storage
// Implements: Task 1.3, 4.1 (Model lifecycle management)

import * as FileSystem from 'expo-file-system';
import ModelMetadataRepository from '../../database/repositories/ModelMetadataRepository';
import ModelDownloader from './ModelDownloader';
import ChecksumValidator from '../../utils/ChecksumValidator';
import {
  MODEL_NAMES,
  MODEL_VERSIONS,
  MODEL_PATHS,
  MODEL_STATUS,
  MODEL_STORAGE_LIMITS,
  MOCK_MODE,
} from '../../constants/ModelConstants';

/**
 * ModelManager
 * Singleton service for managing AI model lifecycle
 * AC4: Model version tracking
 * Implements: Task 1.3, 1.4
 */
class ModelManager {
  constructor() {
    this.currentModel = null;
    this.modelStatus = MODEL_STATUS.NOT_DOWNLOADED;
    this.listeners = [];
  }

  /**
   * Initialize model manager
   * Implements: Task 1.2, 1.3
   * AC1: TensorFlow Lite models downloaded during initial setup
   */
  async initialize() {
    try {
      console.log('[ModelManager] Initializing...');

      // Create models directory if it doesn't exist
      const modelsDir = `${FileSystem.documentDirectory}${MODEL_PATHS.BASE_DIR}`;
      const dirInfo = await FileSystem.getInfoAsync(modelsDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
        console.log('[ModelManager] Created models directory');
      }

      // Check for existing active model
      const activeModel = await ModelMetadataRepository.getActiveModel(
        MODEL_NAMES.DISEASE_DETECTION
      );

      if (activeModel) {
        console.log('[ModelManager] Found active model:', activeModel.version);
        this.currentModel = activeModel;
        this.modelStatus = MODEL_STATUS.DOWNLOADED;
      } else {
        console.log('[ModelManager] No active model found');
        this.modelStatus = MODEL_STATUS.NOT_DOWNLOADED;
      }

      console.log('[ModelManager] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[ModelManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if model needs to be downloaded
   * Implements: AC1
   */
  async isModelAvailable() {
    if (!this.currentModel) {
      return false;
    }

    // Verify model file exists
    const modelPath = `${FileSystem.documentDirectory}${this.currentModel.file_path}`;
    const fileInfo = await FileSystem.getInfoAsync(modelPath);

    return fileInfo.exists;
  }

  /**
   * Download disease detection model
   * Implements: Task 2.1-2.5 (via ModelDownloader)
   * AC1, AC2: Download compressed models
   */
  async downloadModel(onProgress = null) {
    try {
      console.log('[ModelManager] Starting model download...');
      this.setStatus(MODEL_STATUS.DOWNLOADING);

      const modelName = MODEL_NAMES.DISEASE_DETECTION;
      const version = MODEL_VERSIONS.DISEASE_DETECTION;

      // Download model
      const downloadResult = await ModelDownloader.downloadModel(
        modelName,
        version,
        onProgress
      );

      if (downloadResult.success) {
        // Save metadata
        const metadata = {
          model_name: modelName,
          version,
          file_path: downloadResult.filePath.replace(FileSystem.documentDirectory, ''),
          file_size_bytes: downloadResult.fileSize,
          checksum: downloadResult.checksum,
          download_date: new Date().toISOString(),
          is_active: 1,
        };

        await ModelMetadataRepository.save(metadata);
        await ModelMetadataRepository.setActiveModel(modelName, version);

        this.currentModel = metadata;
        this.setStatus(MODEL_STATUS.DOWNLOADED);

        console.log('[ModelManager] Model downloaded successfully');
        return {
          success: true,
          model: metadata,
        };
      } else {
        this.setStatus(MODEL_STATUS.FAILED);
        throw new Error(downloadResult.error || 'Download failed');
      }
    } catch (error) {
      console.error('[ModelManager] Model download failed:', error);
      this.setStatus(MODEL_STATUS.FAILED);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for model updates
   * Implements: Task 3.3, 3.4
   * AC4: Model version tracking for future updates
   */
  async checkForUpdates() {
    try {
      if (MOCK_MODE.ENABLED) {
        console.log('[ModelManager] Mock mode: No updates available');
        return {
          updateAvailable: false,
          currentVersion: MODEL_VERSIONS.DISEASE_DETECTION,
        };
      }

      // In production, query backend API for latest version
      // const latestVersion = await fetch('https://api.zaraidost.com/models/latest-version');

      const currentVersion = this.currentModel?.version || null;
      const latestVersion = MODEL_VERSIONS.DISEASE_DETECTION;

      if (!currentVersion) {
        return {
          updateAvailable: true,
          latestVersion,
          reason: 'No model installed',
        };
      }

      const isNewer = ModelMetadataRepository.isUpdateAvailable(
        currentVersion,
        latestVersion
      );

      if (isNewer) {
        this.setStatus(MODEL_STATUS.UPDATE_AVAILABLE);
      }

      return {
        updateAvailable: isNewer,
        currentVersion,
        latestVersion,
      };
    } catch (error) {
      console.error('[ModelManager] Check for updates failed:', error);
      return {
        updateAvailable: false,
        error: error.message,
      };
    }
  }

  /**
   * Update model to latest version
   * Implements: Task 3.5, 3.6
   */
  async updateModel(onProgress = null) {
    try {
      console.log('[ModelManager] Updating model...');

      // Download new model
      const downloadResult = await this.downloadModel(onProgress);

      if (downloadResult.success) {
        // Delete old model versions (keep 1 previous version)
        await ModelMetadataRepository.deleteOldVersions(
          MODEL_NAMES.DISEASE_DETECTION,
          2
        );

        console.log('[ModelManager] Model updated successfully');
        return {
          success: true,
          newVersion: downloadResult.model.version,
        };
      }

      return downloadResult;
    } catch (error) {
      console.error('[ModelManager] Model update failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete model
   * Implements: Task 6.6 (Option to delete and re-download models)
   */
  async deleteModel() {
    try {
      if (!this.currentModel) {
        console.log('[ModelManager] No model to delete');
        return { success: true };
      }

      console.log('[ModelManager] Deleting model...');

      // Delete model file
      const modelPath = `${FileSystem.documentDirectory}${this.currentModel.file_path}`;
      const fileInfo = await FileSystem.getInfoAsync(modelPath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(modelPath);
        console.log('[ModelManager] Model file deleted');
      }

      // Delete metadata
      const allVersions = await ModelMetadataRepository.getAllVersions(
        MODEL_NAMES.DISEASE_DETECTION
      );

      for (const version of allVersions) {
        await ModelMetadataRepository.delete(version.id);
      }

      this.currentModel = null;
      this.setStatus(MODEL_STATUS.NOT_DOWNLOADED);

      console.log('[ModelManager] Model deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[ModelManager] Delete model failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current model status
   * Implements: Task 6.2
   */
  getStatus() {
    return {
      status: this.modelStatus,
      model: this.currentModel,
      version: this.currentModel?.version || null,
      fileSizeMB: this.currentModel
        ? (this.currentModel.file_size_bytes / (1024 * 1024)).toFixed(2)
        : null,
    };
  }

  /**
   * Get total model storage usage
   * Implements: Task 6.5
   * AC2: Monitor storage limits
   */
  async getStorageUsage() {
    try {
      const totalStorage = await ModelMetadataRepository.getTotalStorageUsed();
      const limit = MODEL_STORAGE_LIMITS.MAX_TOTAL_SIZE_MB;

      return {
        usedMB: totalStorage.mb,
        limitMB: limit,
        percentUsed: ((totalStorage.mb / limit) * 100).toFixed(1),
        withinLimit: totalStorage.mb <= limit,
      };
    } catch (error) {
      console.error('[ModelManager] Get storage usage failed:', error);
      return {
        usedMB: 0,
        limitMB: MODEL_STORAGE_LIMITS.MAX_TOTAL_SIZE_MB,
        percentUsed: 0,
        withinLimit: true,
        error: error.message,
      };
    }
  }

  /**
   * Verify model integrity
   * Implements: Task 2.4
   */
  async verifyModelIntegrity() {
    if (!this.currentModel) {
      return { valid: false, reason: 'No model loaded' };
    }

    const modelPath = `${FileSystem.documentDirectory}${this.currentModel.file_path}`;

    return await ChecksumValidator.verifyModelIntegrity(
      modelPath,
      this.currentModel.checksum,
      this.currentModel.file_size_bytes
    );
  }

  /**
   * Set model status and notify listeners
   */
  setStatus(status) {
    this.modelStatus = status;
    this.notifyListeners({
      event: 'status_changed',
      status,
    });
  }

  /**
   * Add status change listener
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ModelManager] Listener error:', error);
      }
    });
  }
}

export default new ModelManager();
