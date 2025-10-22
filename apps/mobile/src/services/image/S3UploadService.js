// S3UploadService.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 4 (S3 image upload integration)

import * as FileSystem from 'expo-file-system';
import {
  S3_CONFIG,
  UPLOAD_QUEUE,
  MOCK_MODE,
  ERROR_MESSAGES,
} from '../../constants/ImageConstants';

/**
 * S3UploadService
 *
 * Service for uploading images to AWS S3 storage.
 * Handles pre-signed URL generation, multipart upload for large files,
 * progress tracking, and retry logic.
 *
 * Implements AC3: Images automatically upload when connectivity restored
 *
 * NOTE: Currently in mock mode. When backend is ready:
 * 1. Install AWS SDK: npm install aws-sdk
 * 2. Configure S3 credentials
 * 3. Set MOCK_MODE.MOCK_S3_UPLOAD = false
 * 4. Update API endpoint configuration
 */
class S3UploadService {
  constructor() {
    this.activeUploads = new Map(); // Track active uploads
  }

  /**
   * Upload image to S3
   * Implements Task 4.1-4.7
   *
   * @param {string} localFilePath - Local file path
   * @param {string} imageId - Unique image ID
   * @param {function} onProgress - Progress callback (0-1)
   * @returns {Promise<object>} Upload result { success, remoteUrl, error }
   */
  async uploadImage(localFilePath, imageId, onProgress = null) {
    try {
      console.log(`[S3UploadService] Uploading image: ${imageId}`);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Mock mode: simulate upload
      if (MOCK_MODE.ENABLED && MOCK_MODE.MOCK_S3_UPLOAD) {
        return await this.mockUpload(localFilePath, imageId, onProgress);
      }

      // Get file size to determine upload strategy
      const fileSizeBytes = fileInfo.size;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);

      console.log(`[S3UploadService] File size: ${fileSizeMB.toFixed(2)} MB`);

      // Use multipart upload for large files
      if (fileSizeMB > S3_CONFIG.MULTIPART_THRESHOLD_MB) {
        return await this.multipartUpload(localFilePath, imageId, fileSizeBytes, onProgress);
      } else {
        return await this.singlePartUpload(localFilePath, imageId, fileSizeBytes, onProgress);
      }
    } catch (error) {
      console.error(`[S3UploadService] Upload failed for ${imageId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Single-part upload for small files (<5MB)
   * Uses pre-signed URL from backend
   *
   * @param {string} localFilePath - Local file path
   * @param {string} imageId - Unique image ID
   * @param {number} fileSize - File size in bytes
   * @param {function} onProgress - Progress callback
   * @returns {Promise<object>} Upload result
   */
  async singlePartUpload(localFilePath, imageId, fileSize, onProgress) {
    try {
      // Step 1: Request pre-signed URL from backend
      console.log(`[S3UploadService] Requesting pre-signed URL for ${imageId}...`);
      const presignedUrl = await this.getPresignedUrl(imageId, fileSize);

      if (!presignedUrl) {
        throw new Error('Failed to get pre-signed URL');
      }

      // Step 2: Upload file to S3 using pre-signed URL
      console.log(`[S3UploadService] Uploading to S3...`);

      const uploadTask = FileSystem.createUploadTask(
        presignedUrl,
        localFilePath,
        {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
          },
        },
        (uploadProgress) => {
          if (onProgress) {
            const progress = uploadProgress.totalBytesSent / uploadProgress.totalBytesExpectedToSend;
            onProgress(progress);
          }
        }
      );

      // Track active upload
      this.activeUploads.set(imageId, uploadTask);

      // Execute upload
      const result = await uploadTask.uploadAsync();

      // Remove from active uploads
      this.activeUploads.delete(imageId);

      if (result.status === 200 || result.status === 201) {
        // Generate final S3 URL
        const remoteUrl = this.generateS3Url(imageId);

        console.log(`[S3UploadService] Upload successful: ${remoteUrl}`);

        return {
          success: true,
          remoteUrl,
        };
      } else {
        throw new Error(`Upload failed with status ${result.status}`);
      }
    } catch (error) {
      this.activeUploads.delete(imageId);
      console.error('[S3UploadService] Single-part upload failed:', error);
      throw error;
    }
  }

  /**
   * Multipart upload for large files (>5MB)
   *
   * @param {string} localFilePath - Local file path
   * @param {string} imageId - Unique image ID
   * @param {number} fileSize - File size in bytes
   * @param {function} onProgress - Progress callback
   * @returns {Promise<object>} Upload result
   */
  async multipartUpload(localFilePath, imageId, fileSize, onProgress) {
    try {
      console.log(`[S3UploadService] Starting multipart upload for ${imageId}...`);

      // TODO: Implement multipart upload when backend supports it
      // For now, fallback to single-part upload with warning
      console.warn('[S3UploadService] Multipart upload not yet implemented, using single-part');

      return await this.singlePartUpload(localFilePath, imageId, fileSize, onProgress);
    } catch (error) {
      console.error('[S3UploadService] Multipart upload failed:', error);
      throw error;
    }
  }

  /**
   * Get pre-signed URL from backend API
   * Implements Task 4.4
   *
   * @param {string} imageId - Unique image ID
   * @param {number} fileSize - File size in bytes
   * @returns {Promise<string>} Pre-signed URL
   */
  async getPresignedUrl(imageId, fileSize) {
    try {
      const apiUrl = `${S3_CONFIG.API_ENDPOINT}${S3_CONFIG.PRESIGNED_URL_PATH}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add JWT authentication header when backend ready
          // 'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          imageId,
          fileSize,
          contentType: 'image/jpeg',
          expiresIn: UPLOAD_QUEUE.PRESIGNED_URL_EXPIRE_MINUTES * 60,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.presignedUrl) {
        throw new Error('No pre-signed URL in response');
      }

      return data.presignedUrl;
    } catch (error) {
      console.error('[S3UploadService] Failed to get pre-signed URL:', error);
      throw new Error('Failed to get upload URL from server');
    }
  }

  /**
   * Generate final S3 URL for uploaded image
   *
   * @param {string} imageId - Unique image ID
   * @returns {string} S3 URL
   */
  generateS3Url(imageId) {
    const bucketUrl = `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com`;
    return `${bucketUrl}/images/${imageId}.jpg`;
  }

  /**
   * Mock upload for development/testing
   * Simulates S3 upload with delay and progress
   *
   * @param {string} localFilePath - Local file path
   * @param {string} imageId - Unique image ID
   * @param {function} onProgress - Progress callback
   * @returns {Promise<object>} Mock upload result
   */
  async mockUpload(localFilePath, imageId, onProgress) {
    try {
      console.log(`[S3UploadService] MOCK MODE: Simulating upload for ${imageId}`);

      // Simulate upload progress
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay per step
        if (onProgress) {
          onProgress(i / steps);
        }
      }

      // Generate mock S3 URL
      const mockRemoteUrl = `https://mock-s3.zaraidost.com/images/${imageId}.jpg`;

      console.log(`[S3UploadService] MOCK: Upload complete: ${mockRemoteUrl}`);

      return {
        success: true,
        remoteUrl: mockRemoteUrl,
      };
    } catch (error) {
      console.error('[S3UploadService] Mock upload failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel active upload
   *
   * @param {string} imageId - Image ID to cancel
   * @returns {Promise<boolean>} True if canceled
   */
  async cancelUpload(imageId) {
    try {
      const uploadTask = this.activeUploads.get(imageId);

      if (uploadTask) {
        await uploadTask.cancelAsync();
        this.activeUploads.delete(imageId);
        console.log(`[S3UploadService] Upload canceled: ${imageId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[S3UploadService] Cancel upload failed for ${imageId}:`, error);
      return false;
    }
  }

  /**
   * Delete image from S3
   * Used for cleanup or user deletion
   *
   * @param {string} remoteUrl - S3 URL of image to delete
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteImage(remoteUrl) {
    try {
      console.log(`[S3UploadService] Deleting image: ${remoteUrl}`);

      // Mock mode: just return success
      if (MOCK_MODE.ENABLED && MOCK_MODE.MOCK_S3_UPLOAD) {
        console.log('[S3UploadService] MOCK: Image deletion simulated');
        return true;
      }

      // TODO: Implement S3 deletion when backend ready
      // Should call backend API to delete image from S3
      const apiUrl = `${S3_CONFIG.API_ENDPOINT}/api/v1/images/delete`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add JWT authentication
        },
        body: JSON.stringify({ remoteUrl }),
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      console.log('[S3UploadService] Image deleted successfully');
      return true;
    } catch (error) {
      console.error('[S3UploadService] Image deletion failed:', error);
      return false;
    }
  }

  /**
   * Get list of active uploads
   *
   * @returns {Array<string>} List of image IDs currently uploading
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.keys());
  }

  /**
   * Check if image is currently uploading
   *
   * @param {string} imageId - Image ID to check
   * @returns {boolean} True if uploading
   */
  isUploading(imageId) {
    return this.activeUploads.has(imageId);
  }

  /**
   * Cancel all active uploads
   *
   * @returns {Promise<number>} Number of uploads canceled
   */
  async cancelAllUploads() {
    try {
      const imageIds = this.getActiveUploads();
      console.log(`[S3UploadService] Canceling ${imageIds.length} active uploads...`);

      const results = await Promise.allSettled(
        imageIds.map((id) => this.cancelUpload(id))
      );

      const canceled = results.filter((r) => r.status === 'fulfilled' && r.value).length;

      console.log(`[S3UploadService] Canceled ${canceled} uploads`);
      return canceled;
    } catch (error) {
      console.error('[S3UploadService] Cancel all failed:', error);
      return 0;
    }
  }

  /**
   * Verify S3 configuration
   *
   * @returns {object} Configuration status
   */
  verifyConfiguration() {
    const config = {
      bucketName: S3_CONFIG.BUCKET_NAME,
      region: S3_CONFIG.REGION,
      apiEndpoint: S3_CONFIG.API_ENDPOINT,
      mockMode: MOCK_MODE.MOCK_S3_UPLOAD,
      multipartThreshold: `${S3_CONFIG.MULTIPART_THRESHOLD_MB} MB`,
    };

    console.log('[S3UploadService] Configuration:', config);
    return config;
  }
}

// Export singleton instance
export default new S3UploadService();
