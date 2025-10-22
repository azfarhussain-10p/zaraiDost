// ImageValidator Service Tests
// Story 3.1: Image Capture and Upload Interface
// AC5: Image quality validation (minimum resolution, not blurry)

import ImageValidator from '../../../services/image/ImageValidator';
import { VALIDATION_ERRORS } from '../../../constants/ImageQualityConstants';

describe('ImageValidator', () => {
  describe('validateResolution', () => {
    it('should accept valid resolution (640x640)', () => {
      const result = ImageValidator.validateResolution(640, 640);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(640);
      expect(result.height).toBe(640);
    });

    it('should accept high resolution (1920x1080)', () => {
      const result = ImageValidator.validateResolution(1920, 1080);
      expect(result.valid).toBe(true);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should reject resolution below minimum (500x500)', () => {
      const result = ImageValidator.validateResolution(500, 500);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Resolution too low');
    });

    it('should reject resolution above maximum (5000x5000)', () => {
      const result = ImageValidator.validateResolution(5000, 5000);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(VALIDATION_ERRORS.RESOLUTION_TOO_HIGH);
    });

    it('should warn for resolution below recommended', () => {
      const result = ImageValidator.validateResolution(800, 600);
      expect(result.valid).toBe(true);
      expect(result.warning).toBeTruthy();
      expect(result.warning).toContain('below recommended');
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file size (5MB)', async () => {
      const fiveMB = 5 * 1024 * 1024;
      const result = await ImageValidator.validateFileSize('test.jpg', fiveMB);
      expect(result.valid).toBe(true);
      expect(result.sizeMB).toBe(5);
    });

    it('should reject file larger than 10MB', async () => {
      const elevenMB = 11 * 1024 * 1024;
      const result = await ImageValidator.validateFileSize('test.jpg', elevenMB);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(VALIDATION_ERRORS.FILE_TOO_LARGE);
      expect(result.message).toContain('too large');
    });

    it('should reject file smaller than minimum (corrupted)', async () => {
      const tinyFile = 30 * 1024; // 30KB
      const result = await ImageValidator.validateFileSize('test.jpg', tinyFile);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(VALIDATION_ERRORS.FILE_TOO_SMALL);
      expect(result.message).toContain('too small');
    });

    it('should calculate file size in MB correctly', async () => {
      const threeMB = 3 * 1024 * 1024;
      const result = await ImageValidator.validateFileSize('test.jpg', threeMB);
      expect(result.sizeMB).toBe(3);
    });
  });

  describe('validateFormat', () => {
    it('should accept JPEG format', () => {
      const result = ImageValidator.validateFormat('image/jpeg', 'test.jpg');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/jpeg');
    });

    it('should accept PNG format', () => {
      const result = ImageValidator.validateFormat('image/png', 'test.png');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/png');
    });

    it('should accept HEIC format', () => {
      const result = ImageValidator.validateFormat('image/heic', 'test.heic');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/heic');
    });

    it('should reject unsupported format (BMP)', () => {
      const result = ImageValidator.validateFormat('image/bmp', 'test.bmp');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Unsupported');
    });

    it('should validate by file extension if MIME type is missing', () => {
      const result = ImageValidator.validateFormat(null, 'test.jpg');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/jpg');
    });

    it('should reject if both MIME type and extension are invalid', () => {
      const result = ImageValidator.validateFormat('application/pdf', 'test.pdf');
      expect(result.valid).toBe(false);
    });
  });

  describe('detectBlur', () => {
    it('should return blur detection result with score', async () => {
      const result = await ImageValidator.detectBlur('test.jpg', 1920, 1080);
      expect(result).toHaveProperty('isBlurry');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('method');
      expect(result.method).toBe('heuristic');
    });

    it('should calculate bytes per pixel ratio', async () => {
      const result = await ImageValidator.detectBlur('test.jpg', 1920, 1080);
      expect(result).toHaveProperty('bytesPerPixel');
      expect(typeof result.bytesPerPixel).toBe('number');
    });
  });

  describe('quickValidate', () => {
    it('should perform quick validation without blur detection', () => {
      const imageAsset = {
        uri: 'test.jpg',
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
      };

      const result = ImageValidator.quickValidate(imageAsset);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('resolution');
      expect(result.details).toHaveProperty('format');
    });

    it('should return errors for invalid image', () => {
      const imageAsset = {
        uri: 'test.bmp',
        width: 400,
        height: 300,
        type: 'image/bmp',
      };

      const result = ImageValidator.quickValidate(imageAsset);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return valid for good quality image', () => {
      const imageAsset = {
        uri: 'test.jpg',
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
      };

      const result = ImageValidator.quickValidate(imageAsset);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('checkImageLimit', () => {
    it('should allow adding images within limit', () => {
      const result = ImageValidator.checkImageLimit(2, 1, 5);
      expect(result.valid).toBe(true);
      expect(result.newTotal).toBe(3);
      expect(result.remaining).toBe(2);
    });

    it('should reject adding images exceeding limit', () => {
      const result = ImageValidator.checkImageLimit(4, 2, 5);
      expect(result.valid).toBe(false);
      expect(result.code).toBe(VALIDATION_ERRORS.MAX_IMAGES_EXCEEDED);
      expect(result.message).toContain('Maximum');
    });

    it('should allow exactly filling the limit', () => {
      const result = ImageValidator.checkImageLimit(3, 2, 5);
      expect(result.valid).toBe(true);
      expect(result.newTotal).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it('should reject if already at limit', () => {
      const result = ImageValidator.checkImageLimit(5, 1, 5);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple images', async () => {
      const images = [
        { uri: 'test1.jpg', width: 1920, height: 1080, type: 'image/jpeg' },
        { uri: 'test2.jpg', width: 1280, height: 720, type: 'image/jpeg' },
        { uri: 'test3.jpg', width: 640, height: 640, type: 'image/jpeg' },
      ];

      const results = await ImageValidator.validateMultiple(images);
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('qualityScore');
      });
    });

    it('should return validation results in same order as input', async () => {
      const images = [
        { uri: 'test1.jpg', width: 1920, height: 1080, type: 'image/jpeg' },
        { uri: 'test2.jpg', width: 400, height: 300, type: 'image/jpeg' }, // Invalid
        { uri: 'test3.jpg', width: 1280, height: 720, type: 'image/jpeg' },
      ];

      const results = await ImageValidator.validateMultiple(images);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false); // Invalid resolution
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('Full validation workflow', () => {
    it('should validate a good quality image end-to-end', async () => {
      const imageAsset = {
        uri: 'test.jpg',
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
        fileSize: 3 * 1024 * 1024, // 3MB
      };

      const result = await ImageValidator.validate(imageAsset);
      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(0.5);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject low resolution image', async () => {
      const imageAsset = {
        uri: 'test.jpg',
        width: 400,
        height: 300,
        type: 'image/jpeg',
        fileSize: 1 * 1024 * 1024,
      };

      const result = await ImageValidator.validate(imageAsset);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe(VALIDATION_ERRORS.RESOLUTION_TOO_LOW);
    });

    it('should warn for potentially blurry image', async () => {
      const imageAsset = {
        uri: 'test.jpg',
        width: 1920,
        height: 1080,
        type: 'image/jpeg',
        fileSize: 200 * 1024, // Very small file = highly compressed = likely blurry
      };

      const result = await ImageValidator.validate(imageAsset);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

