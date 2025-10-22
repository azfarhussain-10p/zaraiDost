// LocationService Tests
// Story 3.1: Image Capture and Upload Interface
// AC7: Location data (GPS) captured with image

import LocationService from '../../../services/image/LocationService';

describe('LocationService', () => {
  describe('convertGPSToDecimal', () => {
    it('should convert DMS array to decimal (North)', () => {
      const dms = [31, 30, 15]; // 31°30'15"N
      const result = LocationService.convertGPSToDecimal(dms, 'N');
      expect(result).toBeCloseTo(31.5042, 4);
    });

    it('should convert DMS array to decimal (South - negative)', () => {
      const dms = [31, 30, 15]; // 31°30'15"S
      const result = LocationService.convertGPSToDecimal(dms, 'S');
      expect(result).toBeCloseTo(-31.5042, 4);
    });

    it('should convert DMS array to decimal (East)', () => {
      const dms = [74, 21, 30]; // 74°21'30"E
      const result = LocationService.convertGPSToDecimal(dms, 'E');
      expect(result).toBeCloseTo(74.3583, 4);
    });

    it('should convert DMS array to decimal (West - negative)', () => {
      const dms = [74, 21, 30]; // 74°21'30"W
      const result = LocationService.convertGPSToDecimal(dms, 'W');
      expect(result).toBeCloseTo(-74.3583, 4);
    });

    it('should handle already decimal number (North)', () => {
      const decimal = 31.5042;
      const result = LocationService.convertGPSToDecimal(decimal, 'N');
      expect(result).toBe(31.5042);
    });

    it('should handle already decimal number (South)', () => {
      const decimal = 31.5042;
      const result = LocationService.convertGPSToDecimal(decimal, 'S');
      expect(result).toBe(-31.5042);
    });

    it('should handle edge case: 0 degrees', () => {
      const dms = [0, 0, 0];
      const result = LocationService.convertGPSToDecimal(dms, 'N');
      expect(result).toBe(0);
    });
  });

  describe('extractGPSFromExif', () => {
    it('should extract GPS from valid EXIF data', () => {
      const exifData = {
        GPSLatitude: [31, 30, 15],
        GPSLatitudeRef: 'N',
        GPSLongitude: [74, 21, 30],
        GPSLongitudeRef: 'E',
        GPSAltitude: 200,
        DateTime: '2025-10-22T10:30:00Z',
      };

      const result = LocationService.extractGPSFromExif(exifData);
      expect(result).not.toBeNull();
      expect(result.latitude).toBeCloseTo(31.5042, 4);
      expect(result.longitude).toBeCloseTo(74.3583, 4);
      expect(result.altitude).toBe(200);
      expect(result.source).toBe('exif');
    });

    it('should return null for EXIF without GPS', () => {
      const exifData = {
        DateTime: '2025-10-22T10:30:00Z',
        // No GPS data
      };

      const result = LocationService.extractGPSFromExif(exifData);
      expect(result).toBeNull();
    });

    it('should return null for null EXIF data', () => {
      const result = LocationService.extractGPSFromExif(null);
      expect(result).toBeNull();
    });

    it('should return null for incomplete GPS data', () => {
      const exifData = {
        GPSLatitude: [31, 30, 15],
        GPSLatitudeRef: 'N',
        // Missing longitude
      };

      const result = LocationService.extractGPSFromExif(exifData);
      expect(result).toBeNull();
    });
  });

  describe('formatLocation', () => {
    it('should format location with accuracy', () => {
      const location = {
        latitude: 31.5042,
        longitude: 74.3583,
        accuracy: 10,
      };

      const result = LocationService.formatLocation(location);
      expect(result).toContain('31.504200');
      expect(result).toContain('74.358300');
      expect(result).toContain('±10m');
    });

    it('should format location without accuracy', () => {
      const location = {
        latitude: 31.5042,
        longitude: 74.3583,
      };

      const result = LocationService.formatLocation(location);
      expect(result).toContain('31.504200');
      expect(result).toContain('74.358300');
      expect(result).not.toContain('±');
    });

    it('should handle null location', () => {
      const result = LocationService.formatLocation(null);
      expect(result).toBe('Location unavailable');
    });
  });

  describe('assessAccuracy', () => {
    it('should rate accuracy as high (≤10m)', () => {
      const result = LocationService.assessAccuracy(5);
      expect(result.level).toBe('high');
      expect(result.color).toBe('green');
    });

    it('should rate accuracy as medium (11-50m)', () => {
      const result = LocationService.assessAccuracy(30);
      expect(result.level).toBe('medium');
      expect(result.color).toBe('yellow');
    });

    it('should rate accuracy as low (51-100m)', () => {
      const result = LocationService.assessAccuracy(75);
      expect(result.level).toBe('low');
      expect(result.color).toBe('orange');
    });

    it('should rate accuracy as poor (>100m)', () => {
      const result = LocationService.assessAccuracy(150);
      expect(result.level).toBe('poor');
      expect(result.color).toBe('red');
    });

    it('should handle unknown accuracy', () => {
      const result = LocationService.assessAccuracy(null);
      expect(result.level).toBe('unknown');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two nearby points', () => {
      const loc1 = { latitude: 31.5042, longitude: 74.3583 };
      const loc2 = { latitude: 31.5142, longitude: 74.3683 };

      const distance = LocationService.calculateDistance(loc1, loc2);
      expect(distance).toBeGreaterThan(1000); // More than 1km
      expect(distance).toBeLessThan(2000); // Less than 2km
    });

    it('should return 0 for same location', () => {
      const loc = { latitude: 31.5042, longitude: 74.3583 };
      const distance = LocationService.calculateDistance(loc, loc);
      expect(distance).toBeCloseTo(0, 0);
    });

    it('should calculate distance between far points', () => {
      const lahore = { latitude: 31.5042, longitude: 74.3583 };
      const karachi = { latitude: 24.8607, longitude: 67.0011 };

      const distance = LocationService.calculateDistance(lahore, karachi);
      expect(distance).toBeGreaterThan(900000); // More than 900km
      expect(distance).toBeLessThan(1100000); // Less than 1100km
    });
  });

  describe('clearCache', () => {
    it('should clear cached location', () => {
      LocationService.lastKnownLocation = { latitude: 31.5, longitude: 74.3 };
      LocationService.lastLocationTime = Date.now();

      LocationService.clearCache();

      expect(LocationService.lastKnownLocation).toBeNull();
      expect(LocationService.lastLocationTime).toBeNull();
    });
  });
});

