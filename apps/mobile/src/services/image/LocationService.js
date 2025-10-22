// Location Service
// Story 3.1: Image Capture and Upload Interface
// AC7: Location data (GPS) captured with image for regional analysis

import { Platform } from 'react-native';
import { LOCATION_SETTINGS } from '../../constants/ImageQualityConstants';

// Platform-specific imports
let Location = null;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
}

/**
 * LocationService
 * Manages GPS location capture and permissions
 */
class LocationService {
  static lastKnownLocation = null;
  static lastLocationTime = null;
  static permissionStatus = null;

  /**
   * Request location permissions with user-friendly rationale
   * @returns {Promise<Object>} Permission result
   */
  static async requestPermissions() {
    if (Platform.OS === 'web') {
      return {
        granted: false,
        canAskAgain: false,
        status: 'unavailable',
        message: 'Location not available on web platform.',
      };
    }

    if (!Location) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'unavailable',
        message: 'Location service not available.',
      };
    }

    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      this.permissionStatus = status;

      return {
        granted: status === 'granted',
        canAskAgain,
        status,
        message:
          status === 'granted'
            ? 'Location permission granted.'
            : 'Location permission denied. Some features may be limited.',
      };
    } catch (error) {
      console.error('[LocationService] Permission request failed:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        message: 'Failed to request location permission.',
        error: error.message,
      };
    }
  }

  /**
   * Check current permission status without requesting
   * @returns {Promise<Object>} Permission status
   */
  static async checkPermissions() {
    if (Platform.OS === 'web' || !Location) {
      return { granted: false, status: 'unavailable' };
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      this.permissionStatus = status;

      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.error('[LocationService] Permission check failed:', error);
      return { granted: false, status: 'error' };
    }
  }

  /**
   * Get current GPS location
   * @param {Object} options - Location options
   * @returns {Promise<Object>} Location data or null
   */
  static async getCurrentLocation(options = {}) {
    if (Platform.OS === 'web' || !Location) {
      console.warn('[LocationService] Location not available on this platform');
      return null;
    }

    // Check permissions first
    const permissionCheck = await this.checkPermissions();
    if (!permissionCheck.granted) {
      console.warn('[LocationService] Location permission not granted');
      return null;
    }

    // Check if we can reuse recent location (within 1 minute)
    if (
      this.lastKnownLocation &&
      this.lastLocationTime &&
      Date.now() - this.lastLocationTime < LOCATION_SETTINGS.MAX_AGE_MS
    ) {
      console.log('[LocationService] Reusing recent location');
      return this.lastKnownLocation;
    }

    try {
      const {
        timeout = LOCATION_SETTINGS.TIMEOUT_MS,
        accuracy = Location.Accuracy.Balanced,
      } = options;

      const location = await Location.getCurrentPositionAsync({
        accuracy,
        timeout,
        maximumAge: LOCATION_SETTINGS.MAX_AGE_MS,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      // Cache location
      this.lastKnownLocation = locationData;
      this.lastLocationTime = Date.now();

      console.log('[LocationService] Location captured:', {
        lat: locationData.latitude.toFixed(6),
        lon: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy?.toFixed(1),
      });

      return locationData;
    } catch (error) {
      console.error('[LocationService] Failed to get location:', error);
      return null;
    }
  }

  /**
   * Get location with fallback to last known location
   * @returns {Promise<Object|null>} Location data
   */
  static async getLocationWithFallback() {
    const location = await this.getCurrentLocation();

    if (location) {
      return location;
    }

    // Try last known location
    if (this.lastKnownLocation) {
      console.log('[LocationService] Using last known location (fallback)');
      return {
        ...this.lastKnownLocation,
        isCached: true,
        cacheAge: Date.now() - this.lastLocationTime,
      };
    }

    return null;
  }

  /**
   * Extract GPS from EXIF data (if image has embedded GPS)
   * @param {Object} exifData - EXIF data from image
   * @returns {Object|null} GPS coordinates
   */
  static extractGPSFromExif(exifData) {
    if (!exifData) {
      return null;
    }

    const { GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef, GPSAltitude } = exifData;

    if (!GPSLatitude || !GPSLongitude) {
      return null;
    }

    try {
      const latitude = this.convertGPSToDecimal(GPSLatitude, GPSLatitudeRef);
      const longitude = this.convertGPSToDecimal(GPSLongitude, GPSLongitudeRef);

      return {
        latitude,
        longitude,
        altitude: GPSAltitude || null,
        source: 'exif',
        timestamp: exifData.DateTime || null,
      };
    } catch (error) {
      console.error('[LocationService] Failed to parse EXIF GPS:', error);
      return null;
    }
  }

  /**
   * Convert GPS coordinates from DMS to decimal format
   * @param {Array|number} gpsArray - GPS coordinate array or decimal value
   * @param {string} ref - 'N', 'S', 'E', or 'W'
   * @returns {number} Decimal coordinate
   */
  static convertGPSToDecimal(gpsArray, ref) {
    // If already a decimal number, just return it
    if (typeof gpsArray === 'number') {
      return ref === 'S' || ref === 'W' ? -gpsArray : gpsArray;
    }

    // Convert from DMS (Degrees, Minutes, Seconds) format
    // GPS format: [degrees, minutes, seconds]
    if (Array.isArray(gpsArray) && gpsArray.length === 3) {
      const degrees = gpsArray[0];
      const minutes = gpsArray[1];
      const seconds = gpsArray[2];

      const decimal = degrees + minutes / 60 + seconds / 3600;

      // Negative for South and West
      return ref === 'S' || ref === 'W' ? -decimal : decimal;
    }

    // If format is unknown, assume it's already decimal
    return parseFloat(gpsArray);
  }

  /**
   * Format location for display (human-readable)
   * @param {Object} location - Location data
   * @returns {string} Formatted location string
   */
  static formatLocation(location) {
    if (!location) {
      return 'Location unavailable';
    }

    const { latitude, longitude, accuracy } = location;

    const lat = latitude.toFixed(6);
    const lon = longitude.toFixed(6);
    const acc = accuracy ? `±${Math.round(accuracy)}m` : '';

    return `${lat}, ${lon} ${acc}`.trim();
  }

  /**
   * Check if location accuracy is acceptable
   * @param {number} accuracy - Accuracy in meters
   * @returns {Object} Accuracy assessment
   */
  static assessAccuracy(accuracy) {
    if (!accuracy) {
      return { level: 'unknown', message: 'Accuracy unknown' };
    }

    if (accuracy <= 10) {
      return { level: 'high', message: 'High accuracy', color: 'green' };
    }

    if (accuracy <= 50) {
      return { level: 'medium', message: 'Medium accuracy', color: 'yellow' };
    }

    if (accuracy <= 100) {
      return { level: 'low', message: 'Low accuracy', color: 'orange' };
    }

    return { level: 'poor', message: 'Poor accuracy', color: 'red' };
  }

  /**
   * Get location with timeout promise
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<Object|null>} Location or null if timeout
   */
  static async getLocationWithTimeout(timeout = 5000) {
    return Promise.race([
      this.getCurrentLocation(),
      new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
    ]);
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * @param {Object} loc1 - First location {latitude, longitude}
   * @param {Object} loc2 - Second location {latitude, longitude}
   * @returns {number} Distance in meters
   */
  static calculateDistance(loc1, loc2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Clear cached location (force fresh location on next request)
   */
  static clearCache() {
    this.lastKnownLocation = null;
    this.lastLocationTime = null;
    console.log('[LocationService] Location cache cleared');
  }
}

export default LocationService;

