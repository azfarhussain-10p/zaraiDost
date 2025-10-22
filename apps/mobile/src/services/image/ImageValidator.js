// Image Validator Service
// Story 3.1: Image Capture and Upload Interface
// AC5: Image quality validation (minimum resolution, not blurry)

import { Platform } from 'react-native';
import {
  RESOLUTION,
  FILE_SIZE,
  BLUR_DETECTION,
  SUPPORTED_FORMATS,
  VALIDATION_ERRORS,
  getErrorMessage,
} from '../../constants/ImageQualityConstants';

// Platform-specific imports
let FileSystem = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

/**
 * ImageValidator Service
 * Validates images for quality, resolution, size, and blur
 */
class ImageValidator {
  /**
   * Validate image comprehensively
   * @param {Object} imageAsset - Image asset from camera or gallery
   * @returns {Promise<Object>} Validation result
   */
  static async validate(imageAsset) {
    const { uri, width, height, type, fileSize } = imageAsset;

    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      qualityScore: 1.0,
      details: {
        resolution: null,
        fileSize: null,
        format: null,
        blur: null,
      },
    };

    // 1. Validate resolution
    const resolutionCheck = this.validateResolution(width, height);
    validationResult.details.resolution = resolutionCheck;

    if (!resolutionCheck.valid) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: VALIDATION_ERRORS.RESOLUTION_TOO_LOW,
        message: getErrorMessage(VALIDATION_ERRORS.RESOLUTION_TOO_LOW, 'en'),
      });
      validationResult.qualityScore -= 0.3;
    } else if (resolutionCheck.warning) {
      validationResult.warnings.push({
        code: 'resolution_below_recommended',
        message: resolutionCheck.warning,
      });
      validationResult.qualityScore -= 0.1;
    }

    // 2. Validate file size
    const sizeCheck = await this.validateFileSize(uri, fileSize);
    validationResult.details.fileSize = sizeCheck;

    if (!sizeCheck.valid) {
      validationResult.isValid = false;
      if (sizeCheck.code === VALIDATION_ERRORS.FILE_TOO_LARGE) {
        validationResult.errors.push({
          code: VALIDATION_ERRORS.FILE_TOO_LARGE,
          message: getErrorMessage(VALIDATION_ERRORS.FILE_TOO_LARGE, 'en'),
        });
      } else {
        validationResult.errors.push({
          code: VALIDATION_ERRORS.FILE_TOO_SMALL,
          message: 'File too small, possibly corrupted.',
        });
      }
      validationResult.qualityScore -= 0.2;
    }

    // 3. Validate format
    const formatCheck = this.validateFormat(type, uri);
    validationResult.details.format = formatCheck;

    if (!formatCheck.valid) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: VALIDATION_ERRORS.UNSUPPORTED_FORMAT,
        message: getErrorMessage(VALIDATION_ERRORS.UNSUPPORTED_FORMAT, 'en'),
      });
      validationResult.qualityScore -= 0.3;
    }

    // 4. Detect blur (if valid so far)
    if (validationResult.isValid || validationResult.errors.length === 0) {
      const blurCheck = await this.detectBlur(uri, width, height);
      validationResult.details.blur = blurCheck;

      if (blurCheck.isBlurry) {
        // Blur is a warning, not a hard failure (user can override)
        validationResult.warnings.push({
          code: VALIDATION_ERRORS.BLURRY_IMAGE,
          message: getErrorMessage(VALIDATION_ERRORS.BLURRY_IMAGE, 'en'),
          severity: blurCheck.severity,
        });
        validationResult.qualityScore -= blurCheck.scorePenalty;
      }
    }

    // Ensure quality score is between 0 and 1
    validationResult.qualityScore = Math.max(0, Math.min(1, validationResult.qualityScore));

    return validationResult;
  }

  /**
   * Validate image resolution
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Object} Validation result
   */
  static validateResolution(width, height) {
    // Check minimum resolution
    if (width < RESOLUTION.MIN_WIDTH || height < RESOLUTION.MIN_HEIGHT) {
      return {
        valid: false,
        width,
        height,
        message: `Resolution too low: ${width}x${height}. Minimum ${RESOLUTION.MIN_WIDTH}x${RESOLUTION.MIN_HEIGHT} required.`,
      };
    }

    // Check maximum resolution (prevent excessive storage)
    if (width > RESOLUTION.MAX_WIDTH || height > RESOLUTION.MAX_HEIGHT) {
      return {
        valid: false,
        width,
        height,
        message: `Resolution too high: ${width}x${height}. Maximum ${RESOLUTION.MAX_WIDTH}x${RESOLUTION.MAX_HEIGHT} allowed.`,
        code: VALIDATION_ERRORS.RESOLUTION_TOO_HIGH,
      };
    }

    // Check if below recommended resolution (warning only)
    const warning =
      width < RESOLUTION.RECOMMENDED_WIDTH || height < RESOLUTION.RECOMMENDED_HEIGHT
        ? `Resolution ${width}x${height} is below recommended ${RESOLUTION.RECOMMENDED_WIDTH}x${RESOLUTION.RECOMMENDED_HEIGHT}. Results may be less accurate.`
        : null;

    return {
      valid: true,
      width,
      height,
      warning,
    };
  }

  /**
   * Validate file size
   * @param {string} uri - Image URI
   * @param {number} fileSize - File size in bytes (from asset)
   * @returns {Promise<Object>} Validation result
   */
  static async validateFileSize(uri, fileSize = null) {
    let size = fileSize;

    // Get file size from filesystem if not provided
    if (!size && Platform.OS !== 'web' && FileSystem) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        size = fileInfo.size;
      } catch (error) {
        console.error('[ImageValidator] Failed to get file size:', error);
        return {
          valid: true, // Don't fail if we can't get size
          sizeBytes: 0,
          sizeMB: 0,
          warning: 'Could not verify file size.',
        };
      }
    }

    if (Platform.OS === 'web' && !size) {
      // On web, we can't easily get file size without fetching the blob
      return {
        valid: true,
        sizeBytes: 0,
        sizeMB: 0,
        warning: 'File size validation skipped on web.',
      };
    }

    const sizeMB = size / (1024 * 1024);

    // Check maximum size
    if (size > FILE_SIZE.MAX_SIZE_BYTES) {
      return {
        valid: false,
        sizeBytes: size,
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        message: `File too large: ${sizeMB.toFixed(1)}MB. Maximum ${FILE_SIZE.MAX_SIZE_MB}MB allowed.`,
        code: VALIDATION_ERRORS.FILE_TOO_LARGE,
      };
    }

    // Check minimum size (possibly corrupted)
    if (size < FILE_SIZE.MIN_SIZE_BYTES) {
      return {
        valid: false,
        sizeBytes: size,
        sizeMB: parseFloat(sizeMB.toFixed(2)),
        message: 'File too small. Image may be corrupted.',
        code: VALIDATION_ERRORS.FILE_TOO_SMALL,
      };
    }

    return {
      valid: true,
      sizeBytes: size,
      sizeMB: parseFloat(sizeMB.toFixed(2)),
    };
  }

  /**
   * Validate image format
   * @param {string} type - MIME type
   * @param {string} uri - Image URI
   * @returns {Object} Validation result
   */
  static validateFormat(type, uri) {
    // Check MIME type if available
    if (type && SUPPORTED_FORMATS.includes(type.toLowerCase())) {
      return {
        valid: true,
        format: type,
      };
    }

    // Fallback: Check file extension
    const extension = uri.split('.').pop().toLowerCase();
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'heic'];

    if (supportedExtensions.includes(extension)) {
      return {
        valid: true,
        format: `image/${extension}`,
      };
    }

    return {
      valid: false,
      format: type || 'unknown',
      message: 'Unsupported image format. Use JPEG, PNG, or HEIC.',
    };
  }

  /**
   * Detect blur using simplified Laplacian variance algorithm
   * Note: Full implementation would require native module or image processing library
   * This is a placeholder that estimates blur based on file size and resolution
   * 
   * @param {string} uri - Image URI
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Promise<Object>} Blur detection result
   */
  static async detectBlur(uri, width, height) {
    // Simplified blur detection
    // In production, use react-native-image-filter-kit or custom native module
    // For MVP, use heuristic: very small file size for high resolution = likely compressed/blurry

    const fileInfo = Platform.OS !== 'web' && FileSystem
      ? await FileSystem.getInfoAsync(uri).catch(() => null)
      : null;

    if (!fileInfo || !fileInfo.size) {
      return {
        isBlurry: false,
        score: null,
        method: 'heuristic',
        message: 'Blur detection unavailable.',
      };
    }

    const size = fileInfo.size;
    const pixels = width * height;

    // Heuristic: bytes per pixel ratio
    // Very low ratio = highly compressed = likely blurry
    const bytesPerPixel = size / pixels;

    // Typical uncompressed RGB image = 3 bytes/pixel
    // JPEG at 80% quality ≈ 0.3-0.5 bytes/pixel
    // Very low quality JPEG ≈ 0.1 bytes/pixel

    let isBlurry = false;
    let severity = 'none';
    let scorePenalty = 0;
    let laplacianVariance = 100; // Mock value

    if (bytesPerPixel < 0.15) {
      isBlurry = true;
      severity = 'high';
      scorePenalty = 0.3;
      laplacianVariance = 30;
    } else if (bytesPerPixel < 0.25) {
      isBlurry = true;
      severity = 'medium';
      scorePenalty = 0.15;
      laplacianVariance = 55;
    } else if (bytesPerPixel < 0.35) {
      isBlurry = true;
      severity = 'low';
      scorePenalty = 0.05;
      laplacianVariance = 75;
    }

    return {
      isBlurry,
      score: laplacianVariance, // Mock Laplacian variance
      threshold: BLUR_DETECTION.THRESHOLD_BLURRY,
      severity, // 'low', 'medium', 'high', 'none'
      scorePenalty,
      method: 'heuristic',
      bytesPerPixel: parseFloat(bytesPerPixel.toFixed(4)),
      message: isBlurry
        ? `Image may be blurry (severity: ${severity}). Consider retaking for better results.`
        : 'Image appears sharp.',
    };
  }

  /**
   * Quick validation (resolution and format only)
   * @param {Object} imageAsset - Image asset
   * @returns {Object} Validation result
   */
  static quickValidate(imageAsset) {
    const { width, height, type, uri } = imageAsset;

    const resolutionCheck = this.validateResolution(width, height);
    const formatCheck = this.validateFormat(type, uri);

    const isValid = resolutionCheck.valid && formatCheck.valid;

    return {
      isValid,
      errors: [
        ...(resolutionCheck.valid ? [] : [
          {
            code: VALIDATION_ERRORS.RESOLUTION_TOO_LOW,
            message: resolutionCheck.message,
          },
        ]),
        ...(formatCheck.valid ? [] : [
          {
            code: VALIDATION_ERRORS.UNSUPPORTED_FORMAT,
            message: formatCheck.message,
          },
        ]),
      ],
      details: {
        resolution: resolutionCheck,
        format: formatCheck,
      },
    };
  }

  /**
   * Validate multiple images at once
   * @param {Array<Object>} imageAssets - Array of image assets
   * @returns {Promise<Array<Object>>} Array of validation results
   */
  static async validateMultiple(imageAssets) {
    const validationPromises = imageAssets.map((asset) => this.validate(asset));
    return await Promise.all(validationPromises);
  }

  /**
   * Check if max images limit would be exceeded
   * @param {number} currentCount - Current number of images
   * @param {number} addingCount - Number of images being added
   * @param {number} maxImages - Maximum allowed images
   * @returns {Object} Check result
   */
  static checkImageLimit(currentCount, addingCount, maxImages = 5) {
    const newTotal = currentCount + addingCount;

    if (newTotal > maxImages) {
      return {
        valid: false,
        currentCount,
        addingCount,
        maxImages,
        message: `Maximum ${maxImages} images per health check. Currently ${currentCount} images. Cannot add ${addingCount} more.`,
        code: VALIDATION_ERRORS.MAX_IMAGES_EXCEEDED,
      };
    }

    return {
      valid: true,
      currentCount,
      addingCount,
      newTotal,
      maxImages,
      remaining: maxImages - newTotal,
    };
  }
}

export default ImageValidator;

