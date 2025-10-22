// Model Downloader Service
// Story 1.3: Offline AI Model Storage
// Implements: Task 2 (Model download and caching)

import * as FileSystem from 'expo-file-system';
import { NetworkMonitor } from '../sync/NetworkMonitor';
import ChecksumValidator from '../../utils/ChecksumValidator';
import {
  MODEL_PATHS,
  MODEL_DOWNLOAD_URLS,
  DOWNLOAD_SETTINGS,
  MOCK_MODE,
} from '../../constants/ModelConstants';

/**
 * ModelDownloader
 * Handles model file download with progress tracking
 * Implements: Task 2
 * AC1: Models downloaded during initial setup or WiFi connection
 * AC2: Models compressed to fit within limits
 */
class ModelDownloader {
  /**
   * Download model with progress tracking
   * Implements: Task 2.1, 2.2, 2.3
   */
  async downloadModel(modelName, version, onProgress = null) {
    try {
      console.log(`[ModelDownloader] Downloading ${modelName} ${version}...`);

      // Check WiFi if WiFi-only setting is enabled
      if (DOWNLOAD_SETTINGS.WIFI_ONLY_DEFAULT && !NetworkMonitor.isWiFi()) {
        throw new Error('WiFi connection required for model download');
      }

      const downloadUrl = MOCK_MODE.USE_TEST_MODEL
        ? MODEL_DOWNLOAD_URLS.DISEASE_DETECTION_TEST
        : MODEL_DOWNLOAD_URLS.DISEASE_DETECTION;

      const fileName = `${modelName}_${version}.tflite`;
      const filePath = `${FileSystem.documentDirectory}${MODEL_PATHS.BASE_DIR}/${fileName}`;

      // Download with progress
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        filePath,
        {},
        downloadProgress => {
          if (onProgress) {
            const progress = {
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              downloadedBytes: downloadProgress.totalBytesWritten,
              progress:
                downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite,
            };
            onProgress(progress);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error('Download failed - no file returned');
      }

      console.log('[ModelDownloader] Download complete:', result.uri);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(result.uri);

      // Calculate checksum (Task 2.4)
      const checksum = await ChecksumValidator.calculateChecksum(result.uri);

      return {
        success: true,
        filePath: result.uri,
        fileSize: fileInfo.size,
        checksum,
      };
    } catch (error) {
      console.error('[ModelDownloader] Download failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Download with retry logic
   * Implements: Task 2.1
   */
  async downloadWithRetry(modelName, version, onProgress = null) {
    let lastError = null;

    for (let attempt = 1; attempt <= DOWNLOAD_SETTINGS.RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`[ModelDownloader] Download attempt ${attempt}/${DOWNLOAD_SETTINGS.RETRY_ATTEMPTS}`);

        const result = await this.downloadModel(modelName, version, onProgress);

        if (result.success) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error;
        console.error(`[ModelDownloader] Attempt ${attempt} failed:`, error.message);
      }

      // Wait before retry
      if (attempt < DOWNLOAD_SETTINGS.RETRY_ATTEMPTS) {
        await new Promise(resolve =>
          setTimeout(resolve, DOWNLOAD_SETTINGS.RETRY_DELAY_MS)
        );
      }
    }

    return {
      success: false,
      error: `Download failed after ${DOWNLOAD_SETTINGS.RETRY_ATTEMPTS} attempts: ${lastError}`,
    };
  }
}

export default new ModelDownloader();
