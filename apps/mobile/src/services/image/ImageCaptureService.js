// ImageCaptureService.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 1 (Image capture and local storage)

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  CAMERA,
  IMAGE_QUALITY,
  IMAGE_DIMENSIONS,
  FILE_NAMING,
  ERROR_MESSAGES,
  MOCK_MODE,
  STORAGE,
} from '../../constants/ImageConstants';
import MetadataExtractor from '../../utils/MetadataExtractor';
import ImageRepository from '../../database/repositories/ImageRepository';
import InferenceEngine from '../ai/InferenceEngine';
import InferenceCache from '../ai/InferenceCache';

/**
 * ImageCaptureService
 *
 * Service for handling image capture, processing, and storage.
 * Orchestrates the complete pipeline from capture to analysis.
 *
 * Pipeline:
 * 1. Capture image via camera
 * 2. Compress and save to local storage
 * 3. Extract metadata (GPS, timestamp, file info)
 * 4. Run AI inference for disease detection
 * 5. Save to database with results
 * 6. Generate thumbnail
 * 7. Queue for upload
 *
 * Implements AC1: Images stored locally with metadata
 * Implements AC2: On-device AI processing <5 seconds
 */
class ImageCaptureService {
  constructor() {
    this.isProcessing = false;
    this.imagesDirectory = `${FileSystem.documentDirectory}images/`;
    this.thumbnailsDirectory = `${FileSystem.documentDirectory}images/thumbnails/`;
  }

  /**
   * Initialize the service (create directories)
   */
  async initialize() {
    try {
      console.log('[ImageCaptureService] Initializing...');

      // Create images directory
      const imagesInfo = await FileSystem.getInfoAsync(this.imagesDirectory);
      if (!imagesInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.imagesDirectory, { intermediates: true });
        console.log('[ImageCaptureService] Images directory created');
      }

      // Create thumbnails directory
      const thumbnailsInfo = await FileSystem.getInfoAsync(this.thumbnailsDirectory);
      if (!thumbnailsInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.thumbnailsDirectory, { intermediates: true });
        console.log('[ImageCaptureService] Thumbnails directory created');
      }

      console.log('[ImageCaptureService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[ImageCaptureService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Capture image from camera
   * Implements Task 1.1-1.6
   *
   * @param {object} options - Capture options { crop_type, crop_id }
   * @returns {Promise<object>} Image data with analysis results
   */
  async captureImage(options = {}) {
    try {
      console.log('[ImageCaptureService] Starting image capture...');

      // Track processing time for AC2 (<5s requirement)
      const startTime = Date.now();

      // Ensure directories exist
      await this.initialize();

      // Check camera permission
      const hasPermission = await this.checkCameraPermission();
      if (!hasPermission) {
        throw new Error(ERROR_MESSAGES.CAMERA_PERMISSION_DENIED);
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: CAMERA.ALLOW_EDITING,
        quality: CAMERA.PHOTO_QUALITY,
        exif: CAMERA.EXIF,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[ImageCaptureService] Image capture canceled');
        return null;
      }

      const capturedImage = result.assets[0];
      console.log('[ImageCaptureService] Image captured:', capturedImage.uri);

      // Process the captured image
      const processedImage = await this.processImage(capturedImage.uri, options);

      const processingTime = Date.now() - startTime;
      console.log(`[ImageCaptureService] Total processing time: ${processingTime}ms`);

      // Check AC2 requirement (<5s)
      if (processingTime > 5000) {
        console.warn('[ImageCaptureService] WARNING: Processing exceeded 5s requirement');
      }

      return {
        ...processedImage,
        processingTime,
      };
    } catch (error) {
      console.error('[ImageCaptureService] Image capture failed:', error);
      throw error;
    }
  }

  /**
   * Pick image from gallery (for testing or manual upload)
   *
   * @param {object} options - Capture options { crop_type, crop_id }
   * @returns {Promise<object>} Image data with analysis results
   */
  async pickImageFromGallery(options = {}) {
    try {
      console.log('[ImageCaptureService] Opening gallery...');

      // Check media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission denied');
      }

      // Launch gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: CAMERA.ALLOW_EDITING,
        quality: CAMERA.PHOTO_QUALITY,
        exif: CAMERA.EXIF,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('[ImageCaptureService] Gallery selection canceled');
        return null;
      }

      const selectedImage = result.assets[0];
      console.log('[ImageCaptureService] Image selected:', selectedImage.uri);

      // Process the selected image
      const processedImage = await this.processImage(selectedImage.uri, options);

      return processedImage;
    } catch (error) {
      console.error('[ImageCaptureService] Gallery selection failed:', error);
      throw error;
    }
  }

  /**
   * Process captured image (compress, save, analyze)
   * Implements complete pipeline from capture to database
   *
   * @param {string} imageUri - URI of captured image
   * @param {object} options - Processing options { crop_type, crop_id }
   * @returns {Promise<object>} Processed image data
   */
  async processImage(imageUri, options = {}) {
    try {
      console.log('[ImageCaptureService] Processing image...');
      this.isProcessing = true;

      // Generate unique image ID and file paths
      const imageId = MetadataExtractor.generateImageId();
      const fileName = `${FILE_NAMING.PREFIX}${imageId}${FILE_NAMING.EXTENSION}`;
      const localFilePath = `${this.imagesDirectory}${fileName}`;

      // Step 1: Compress and save image
      console.log('[ImageCaptureService] Step 1: Compressing and saving image...');
      const compressedUri = await this.compressAndSaveImage(imageUri, localFilePath);

      // Step 2: Generate thumbnail
      console.log('[ImageCaptureService] Step 2: Generating thumbnail...');
      const thumbnailPath = await this.generateThumbnail(compressedUri, imageId);

      // Step 3: Extract metadata (GPS, timestamp, file info)
      console.log('[ImageCaptureService] Step 3: Extracting metadata...');
      const metadata = await MetadataExtractor.extractMetadata(compressedUri, options);

      // Step 4: Run AI inference for disease detection
      console.log('[ImageCaptureService] Step 4: Running AI inference...');
      const analysisResult = await this.runInference(compressedUri);

      // Step 5: Save to database
      console.log('[ImageCaptureService] Step 5: Saving to database...');
      const imageRecord = await this.saveToDatabase({
        id: imageId,
        ...metadata,
        thumbnail_path: thumbnailPath,
        analysis_result_json: analysisResult.predictions,
        confidence_score: analysisResult.topPrediction?.confidence || 0,
      });

      this.isProcessing = false;

      console.log('[ImageCaptureService] Image processing complete!');
      return {
        image: imageRecord,
        analysis: analysisResult,
      };
    } catch (error) {
      this.isProcessing = false;
      console.error('[ImageCaptureService] Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Compress and save image to local storage
   *
   * @param {string} sourceUri - Source image URI
   * @param {string} targetPath - Target file path
   * @returns {Promise<string>} Compressed image URI
   */
  async compressAndSaveImage(sourceUri, targetPath) {
    try {
      // Compress image to target quality and dimensions
      const manipResult = await ImageManipulator.manipulateAsync(
        sourceUri,
        [
          {
            resize: {
              width: IMAGE_DIMENSIONS.MAX_WIDTH,
              height: IMAGE_DIMENSIONS.MAX_HEIGHT,
            },
          },
        ],
        {
          compress: IMAGE_QUALITY.STORAGE,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Copy compressed image to permanent storage
      await FileSystem.copyAsync({
        from: manipResult.uri,
        to: targetPath,
      });

      console.log('[ImageCaptureService] Image compressed and saved:', targetPath);
      return targetPath;
    } catch (error) {
      console.error('[ImageCaptureService] Image compression failed:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for image
   *
   * @param {string} imageUri - Source image URI
   * @param {string} imageId - Image ID for thumbnail naming
   * @returns {Promise<string>} Thumbnail file path
   */
  async generateThumbnail(imageUri, imageId) {
    try {
      const thumbnailFileName = `${FILE_NAMING.PREFIX}${imageId}${FILE_NAMING.THUMBNAIL_SUFFIX}${FILE_NAMING.EXTENSION}`;
      const thumbnailPath = `${this.thumbnailsDirectory}${thumbnailFileName}`;

      const thumbnailResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: IMAGE_DIMENSIONS.THUMBNAIL_SIZE,
              height: IMAGE_DIMENSIONS.THUMBNAIL_SIZE,
            },
          },
        ],
        {
          compress: IMAGE_QUALITY.THUMBNAIL,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Copy thumbnail to permanent storage
      await FileSystem.copyAsync({
        from: thumbnailResult.uri,
        to: thumbnailPath,
      });

      console.log('[ImageCaptureService] Thumbnail generated:', thumbnailPath);
      return thumbnailPath;
    } catch (error) {
      console.error('[ImageCaptureService] Thumbnail generation failed:', error);
      // Return null instead of throwing - thumbnail is optional
      return null;
    }
  }

  /**
   * Run AI inference on image for disease detection
   * Implements AC2: <5s processing requirement
   *
   * @param {string} imageUri - Local image URI
   * @returns {Promise<object>} Analysis results
   */
  async runInference(imageUri) {
    try {
      // Check cache first
      const cached = await InferenceCache.getCachedResult(imageUri);
      if (cached) {
        console.log('[ImageCaptureService] Using cached inference result');
        return cached;
      }

      // Run inference
      const startTime = Date.now();
      const predictions = await InferenceEngine.runInference(imageUri);
      const inferenceTime = Date.now() - startTime;

      // Get top prediction
      const topPrediction = predictions.length > 0 ? predictions[0] : null;

      const result = {
        predictions,
        topPrediction,
        inferenceTime,
      };

      // Cache result for future use
      await InferenceCache.cacheResult(imageUri, predictions, inferenceTime);

      console.log(
        `[ImageCaptureService] Inference complete in ${inferenceTime}ms. Top: ${topPrediction?.class} (${(
          (topPrediction?.confidence || 0) * 100
        ).toFixed(1)}%)`
      );

      return result;
    } catch (error) {
      console.error('[ImageCaptureService] Inference failed:', error);
      // Return empty result instead of throwing - allow manual analysis
      return {
        predictions: [],
        topPrediction: null,
        inferenceTime: 0,
        error: error.message,
      };
    }
  }

  /**
   * Save image data to database
   *
   * @param {object} imageData - Complete image data object
   * @returns {Promise<object>} Saved image record
   */
  async saveToDatabase(imageData) {
    try {
      const saved = await ImageRepository.save(imageData);
      console.log('[ImageCaptureService] Image saved to database:', saved.id);
      return saved;
    } catch (error) {
      console.error('[ImageCaptureService] Database save failed:', error);
      throw error;
    }
  }

  /**
   * Check camera permission
   *
   * @returns {Promise<boolean>} True if granted, false otherwise
   */
  async checkCameraPermission() {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[ImageCaptureService] Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Request camera permission
   *
   * @returns {Promise<boolean>} True if granted, false otherwise
   */
  async requestCameraPermission() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        console.warn('[ImageCaptureService] Camera permission denied');
        return false;
      }

      console.log('[ImageCaptureService] Camera permission granted');
      return true;
    } catch (error) {
      console.error('[ImageCaptureService] Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Delete image and thumbnail from file system
   *
   * @param {string} imagePath - Path to image file
   * @param {string} thumbnailPath - Path to thumbnail file
   * @returns {Promise<boolean>} True if successful
   */
  async deleteImageFiles(imagePath, thumbnailPath) {
    try {
      // Delete main image
      if (imagePath) {
        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        if (imageInfo.exists) {
          await FileSystem.deleteAsync(imagePath);
          console.log('[ImageCaptureService] Image file deleted:', imagePath);
        }
      }

      // Delete thumbnail
      if (thumbnailPath && STORAGE.KEEP_THUMBNAIL === false) {
        const thumbInfo = await FileSystem.getInfoAsync(thumbnailPath);
        if (thumbInfo.exists) {
          await FileSystem.deleteAsync(thumbnailPath);
          console.log('[ImageCaptureService] Thumbnail file deleted:', thumbnailPath);
        }
      }

      return true;
    } catch (error) {
      console.error('[ImageCaptureService] File deletion failed:', error);
      return false;
    }
  }

  /**
   * Get processing status
   *
   * @returns {boolean} True if currently processing
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }
}

// Export singleton instance
export default new ImageCaptureService();
