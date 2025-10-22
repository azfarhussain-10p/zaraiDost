// MetadataExtractor.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 1.3 (Extract and store metadata - timestamp, GPS location, crop type)

import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { METADATA, MOCK_MODE, ERROR_MESSAGES } from '../constants/ImageConstants';

/**
 * MetadataExtractor
 *
 * Utility service for extracting and managing image metadata including:
 * - GPS coordinates (latitude, longitude, accuracy)
 * - Timestamps (capture time)
 * - File information (size, path)
 * - EXIF data (when available)
 *
 * Implements AC1: Images stored locally with metadata
 */
class MetadataExtractor {
  /**
   * Extract complete metadata for a captured image
   *
   * @param {string} imageUri - Local file URI of the captured image
   * @param {object} options - Optional metadata (crop_type, crop_id, etc.)
   * @returns {Promise<object>} Complete metadata object
   */
  async extractMetadata(imageUri, options = {}) {
    try {
      console.log('[MetadataExtractor] Extracting metadata for:', imageUri);

      const timestamp = new Date().toISOString();

      // Extract metadata in parallel for performance
      const [locationData, fileInfo] = await Promise.all([
        this.extractGPSLocation(),
        this.extractFileInfo(imageUri),
      ]);

      const metadata = {
        // Required fields
        timestamp,
        local_file_path: imageUri,
        sync_status: 'pending',

        // GPS location
        location_gps: locationData,

        // File information
        file_size_bytes: fileInfo.size,

        // Optional fields from options
        crop_type: options.crop_type || null,
        crop_id: options.crop_id || null,

        // Additional metadata
        created_at: timestamp,
        updated_at: timestamp,
      };

      console.log('[MetadataExtractor] Metadata extracted successfully');
      return metadata;
    } catch (error) {
      console.error('[MetadataExtractor] Error extracting metadata:', error);
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }

  /**
   * Extract GPS location coordinates
   *
   * @returns {Promise<object|null>} GPS coordinates or null if unavailable
   */
  async extractGPSLocation() {
    try {
      // Check if GPS is enabled in settings
      if (!METADATA.ENABLE_GPS) {
        console.log('[MetadataExtractor] GPS disabled in settings');
        return null;
      }

      // In mock mode, return default GPS coordinates
      if (MOCK_MODE.ENABLED && MOCK_MODE.MOCK_GPS) {
        console.log('[MetadataExtractor] Mock mode: Using default GPS coordinates');
        return {
          latitude: MOCK_MODE.DEFAULT_GPS.latitude,
          longitude: MOCK_MODE.DEFAULT_GPS.longitude,
          accuracy: MOCK_MODE.DEFAULT_GPS.accuracy,
          timestamp: new Date().toISOString(),
        };
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.warn('[MetadataExtractor] Location permission not granted');
        return null;
      }

      // Get current location with timeout
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: METADATA.GPS_HIGH_ACCURACY
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          maximumAge: METADATA.GPS_MAX_AGE_MS,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GPS timeout')), METADATA.GPS_TIMEOUT_MS)
        ),
      ]);

      if (location && location.coords) {
        const gpsData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || null,
          altitude: location.coords.altitude || null,
          heading: location.coords.heading || null,
          speed: location.coords.speed || null,
          timestamp: new Date(location.timestamp).toISOString(),
        };

        console.log('[MetadataExtractor] GPS location acquired:', {
          lat: gpsData.latitude.toFixed(4),
          lng: gpsData.longitude.toFixed(4),
          accuracy: gpsData.accuracy ? `${gpsData.accuracy.toFixed(1)}m` : 'N/A',
        });

        return gpsData;
      }

      return null;
    } catch (error) {
      console.error('[MetadataExtractor] GPS extraction failed:', error);
      // Return null instead of throwing - GPS is optional
      return null;
    }
  }

  /**
   * Extract file information (size, exists, etc.)
   *
   * @param {string} fileUri - Local file URI
   * @returns {Promise<object>} File information
   */
  async extractFileInfo(fileUri) {
    try {
      const info = await FileSystem.getInfoAsync(fileUri);

      if (!info.exists) {
        throw new Error('File does not exist');
      }

      return {
        size: info.size || 0,
        modificationTime: info.modificationTime || Date.now(),
        uri: info.uri,
      };
    } catch (error) {
      console.error('[MetadataExtractor] File info extraction failed:', error);
      throw error;
    }
  }

  /**
   * Validate metadata completeness
   *
   * @param {object} metadata - Metadata object to validate
   * @returns {object} Validation result { valid: boolean, missing: string[] }
   */
  validateMetadata(metadata) {
    const missing = [];

    // Check required fields
    METADATA.REQUIRED_FIELDS.forEach((field) => {
      if (!metadata[field]) {
        missing.push(field);
      }
    });

    const valid = missing.length === 0;

    if (!valid) {
      console.warn('[MetadataExtractor] Metadata validation failed. Missing:', missing);
    }

    return { valid, missing };
  }

  /**
   * Enrich metadata with additional computed fields
   *
   * @param {object} metadata - Base metadata object
   * @param {object} enrichmentData - Additional data to enrich with
   * @returns {object} Enriched metadata
   */
  enrichMetadata(metadata, enrichmentData = {}) {
    return {
      ...metadata,
      ...enrichmentData,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Format GPS coordinates for display
   *
   * @param {object} gpsData - GPS data object
   * @returns {string} Formatted GPS string (e.g., "31.5204, 74.3587")
   */
  formatGPSForDisplay(gpsData) {
    if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
      return 'Location unavailable';
    }

    return `${gpsData.latitude.toFixed(4)}, ${gpsData.longitude.toFixed(4)}`;
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Useful for field mapping and grouping nearby images
   *
   * @param {object} coord1 - First GPS coordinate {latitude, longitude}
   * @param {object} coord2 - Second GPS coordinate {latitude, longitude}
   * @returns {number} Distance in meters
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.latitude || !coord2.latitude) {
      return null;
    }

    const R = 6371000; // Earth radius in meters
    const lat1 = (coord1.latitude * Math.PI) / 180;
    const lat2 = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if GPS permission is granted
   *
   * @returns {Promise<boolean>} True if granted, false otherwise
   */
  async checkGPSPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[MetadataExtractor] Error checking GPS permission:', error);
      return false;
    }
  }

  /**
   * Request GPS permission if not already granted
   *
   * @returns {Promise<boolean>} True if granted, false otherwise
   */
  async requestGPSPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.warn('[MetadataExtractor] GPS permission denied');
        return false;
      }

      console.log('[MetadataExtractor] GPS permission granted');
      return true;
    } catch (error) {
      console.error('[MetadataExtractor] Error requesting GPS permission:', error);
      return false;
    }
  }

  /**
   * Extract EXIF data from image (if available)
   * Note: EXIF extraction requires additional libraries in production
   *
   * @param {string} imageUri - Local file URI
   * @returns {Promise<object|null>} EXIF data or null
   */
  async extractEXIFData(imageUri) {
    try {
      // TODO: Implement EXIF extraction when needed
      // Requires expo-image-manipulator or react-native-exif libraries
      console.log('[MetadataExtractor] EXIF extraction not yet implemented');
      return null;
    } catch (error) {
      console.error('[MetadataExtractor] EXIF extraction failed:', error);
      return null;
    }
  }

  /**
   * Generate unique image ID
   * Used for naming files and tracking images
   *
   * @returns {string} Unique ID (timestamp + random)
   */
  generateImageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}_${random}`;
  }

  /**
   * Format file size for display
   *
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size (e.g., "2.5 MB")
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${sizes[i]}`;
  }
}

// Export singleton instance
export default new MetadataExtractor();
