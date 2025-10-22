// CropTypes Tests
// Story 3.1: Image Capture and Upload Interface
// Tests for crop type utility functions

import {
  CROP_TYPES,
  getCropById,
  getCropName,
  searchCropsByName,
  matchCropFromVoice,
  getCropsBySeason,
  getAllCropIds,
} from '../../constants/CropTypes';

describe('CropTypes', () => {
  describe('CROP_TYPES constant', () => {
    it('should contain at least 10 crop types', () => {
      expect(CROP_TYPES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have wheat as first crop', () => {
      expect(CROP_TYPES[0].id).toBe('wheat');
      expect(CROP_TYPES[0].name_ur).toBe('گندم');
    });

    it('should have required fields for each crop', () => {
      CROP_TYPES.forEach((crop) => {
        expect(crop).toHaveProperty('id');
        expect(crop).toHaveProperty('name_en');
        expect(crop).toHaveProperty('name_ur');
        expect(crop).toHaveProperty('name_pun');
        expect(crop).toHaveProperty('icon');
        expect(crop).toHaveProperty('season');
        expect(crop).toHaveProperty('commonDiseases');
      });
    });
  });

  describe('getCropById', () => {
    it('should return crop by ID', () => {
      const wheat = getCropById('wheat');
      expect(wheat).not.toBeNull();
      expect(wheat.id).toBe('wheat');
      expect(wheat.name_en).toBe('Wheat');
    });

    it('should return rice crop', () => {
      const rice = getCropById('rice');
      expect(rice).not.toBeNull();
      expect(rice.id).toBe('rice');
      expect(rice.name_ur).toBe('چاول');
    });

    it('should return null for non-existent crop', () => {
      const result = getCropById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getCropName', () => {
    it('should return Urdu name by default', () => {
      const name = getCropName('wheat');
      expect(name).toBe('گندم');
    });

    it('should return English name when specified', () => {
      const name = getCropName('wheat', 'en');
      expect(name).toBe('Wheat');
    });

    it('should return Punjabi name when specified', () => {
      const name = getCropName('wheat', 'pun');
      expect(name).toBe('کڻک');
    });

    it('should return Urdu name for unknown language', () => {
      const name = getCropName('wheat', 'unknown');
      expect(name).toBe('گندم');
    });

    it('should return "Unknown" for non-existent crop', () => {
      const name = getCropName('non-existent');
      expect(name).toBe('Unknown');
    });
  });

  describe('searchCropsByName', () => {
    it('should return all crops for empty query', () => {
      const results = searchCropsByName('');
      expect(results.length).toBe(CROP_TYPES.length);
    });

    it('should search in English names', () => {
      const results = searchCropsByName('wheat', 'en');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name_en.toLowerCase()).toContain('wheat');
    });

    it('should search in Urdu names', () => {
      const results = searchCropsByName('گندم', 'ur');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('wheat');
    });

    it('should search in crop IDs', () => {
      const results = searchCropsByName('rice');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('rice');
    });

    it('should return empty for no matches', () => {
      const results = searchCropsByName('xyznonexistent');
      expect(results.length).toBe(0);
    });

    it('should be case-insensitive', () => {
      const results1 = searchCropsByName('WHEAT');
      const results2 = searchCropsByName('wheat');
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('matchCropFromVoice', () => {
    it('should match exact English name', () => {
      const crop = matchCropFromVoice('wheat');
      expect(crop).not.toBeNull();
      expect(crop.id).toBe('wheat');
    });

    it('should match exact Urdu name', () => {
      const crop = matchCropFromVoice('گندم');
      expect(crop).not.toBeNull();
      expect(crop.id).toBe('wheat');
    });

    it('should match partial English name (fuzzy)', () => {
      const crop = matchCropFromVoice('cott'); // Should match cotton
      expect(crop).not.toBeNull();
      expect(crop.id).toBe('cotton');
    });

    it('should be case-insensitive', () => {
      const crop = matchCropFromVoice('WHEAT');
      expect(crop).not.toBeNull();
      expect(crop.id).toBe('wheat');
    });

    it('should return null for empty transcript', () => {
      const crop = matchCropFromVoice('');
      expect(crop).toBeNull();
    });

    it('should return null for no match', () => {
      const crop = matchCropFromVoice('xyznonexistent');
      expect(crop).toBeNull();
    });

    it('should prioritize exact match over partial', () => {
      const crop = matchCropFromVoice('rice');
      expect(crop).not.toBeNull();
      expect(crop.id).toBe('rice');
    });
  });

  describe('getCropsBySeason', () => {
    it('should return all crops for "any" season', () => {
      const crops = getCropsBySeason('any');
      expect(crops.length).toBe(CROP_TYPES.length);
    });

    it('should return rabi crops (winter)', () => {
      const crops = getCropsBySeason('rabi');
      expect(crops.length).toBeGreaterThan(0);
      const wheat = crops.find((c) => c.id === 'wheat');
      expect(wheat).toBeDefined();
    });

    it('should return kharif crops (summer)', () => {
      const crops = getCropsBySeason('kharif');
      expect(crops.length).toBeGreaterThan(0);
      const rice = crops.find((c) => c.id === 'rice');
      expect(rice).toBeDefined();
    });

    it('should include perennial crops in any season filter', () => {
      const rabiCrops = getCropsBySeason('rabi');
      const kharifCrops = getCropsBySeason('kharif');
      
      const perennialCrops = CROP_TYPES.filter((c) => c.season === 'perennial');
      
      if (perennialCrops.length > 0) {
        expect(rabiCrops.some((c) => c.season === 'perennial')).toBe(true);
        expect(kharifCrops.some((c) => c.season === 'perennial')).toBe(true);
      }
    });

    it('should return all crops for "both" season', () => {
      const crops = getCropsBySeason('both');
      expect(crops.length).toBe(CROP_TYPES.length);
    });
  });

  describe('getAllCropIds', () => {
    it('should return array of all crop IDs', () => {
      const ids = getAllCropIds();
      expect(ids).toBeInstanceOf(Array);
      expect(ids.length).toBe(CROP_TYPES.length);
    });

    it('should include wheat and rice', () => {
      const ids = getAllCropIds();
      expect(ids).toContain('wheat');
      expect(ids).toContain('rice');
    });

    it('should have unique IDs', () => {
      const ids = getAllCropIds();
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('Common Diseases', () => {
    it('should have common diseases for wheat', () => {
      const wheat = getCropById('wheat');
      expect(wheat.commonDiseases).toBeDefined();
      expect(wheat.commonDiseases.length).toBeGreaterThan(0);
      expect(wheat.commonDiseases).toContain('leaf_rust');
    });

    it('should have common diseases for rice', () => {
      const rice = getCropById('rice');
      expect(rice.commonDiseases).toBeDefined();
      expect(rice.commonDiseases.length).toBeGreaterThan(0);
      expect(rice.commonDiseases).toContain('blast');
    });

    it('should have empty diseases array for "other" crop', () => {
      const other = getCropById('other');
      expect(other.commonDiseases).toEqual([]);
    });
  });

  describe('Icons', () => {
    it('should have emoji icons for all crops', () => {
      CROP_TYPES.forEach((crop) => {
        expect(crop.icon).toBeTruthy();
        expect(crop.icon.length).toBeGreaterThan(0);
      });
    });
  });
});

