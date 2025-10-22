// Disease Repository
// Story 3.2: On-Device Disease Detection Model
// Manages disease reference data and lookups

import { getDatabase } from '../config/db.config';
import { TABLES } from '../../constants/DatabaseConstants';
import { DISEASE_CLASSES, getDiseaseByClassId } from '../../constants/DiseaseClasses';

/**
 * DiseaseRepository
 * Read-only repository for disease reference data
 * Diseases are seeded from DiseaseClasses constants
 */
class DiseaseRepository {
  /**
   * Seed diseases from constants into database
   * Should be called on app first launch or after model update
   * @returns {Promise<number>} Number of diseases seeded
   */
  static async seedDiseases() {
    const db = await getDatabase();

    try {
      console.log('[DiseaseRepository] Seeding diseases...');

      // Check if already seeded
      const existingCount = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${TABLES.DISEASES}`
      );

      if (existingCount && existingCount.count > 0) {
        console.log(`[DiseaseRepository] Already seeded: ${existingCount.count} diseases`);
        return existingCount.count;
      }

      // Insert all diseases
      let insertedCount = 0;

      for (const disease of DISEASE_CLASSES) {
        await db.runAsync(
          `INSERT INTO ${TABLES.DISEASES} 
          (id, class_id, name_en, name_ur, name_pa, name_sd, 
           category, severity, affected_crops, description_en, description_ur, 
           scientific_name, symptoms_en, symptoms_ur)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            disease.id,
            disease.classId,
            disease.nameEn,
            disease.nameUr,
            disease.namePa,
            disease.nameSd,
            disease.category,
            disease.severity,
            JSON.stringify(disease.affectedCrops),
            disease.descriptionEn,
            disease.descriptionUr,
            disease.scientificName,
            disease.symptomsEn,
            disease.symptomsUr,
          ]
        );
        insertedCount++;
      }

      console.log(`[DiseaseRepository] Seeded ${insertedCount} diseases`);
      return insertedCount;
    } catch (error) {
      console.error('[DiseaseRepository] Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Get disease by class ID (model output)
   * @param {number} classId - Model output class ID (0-54)
   * @returns {Promise<Object|null>} Disease object or null
   */
  static async findByClassId(classId) {
    const db = await getDatabase();

    try {
      const disease = await db.getFirstAsync(
        `SELECT * FROM ${TABLES.DISEASES} WHERE class_id = ?`,
        [classId]
      );

      if (!disease) return null;

      // Parse JSON fields
      return {
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      };
    } catch (error) {
      console.error(`[DiseaseRepository] FindByClassId failed for classId ${classId}:`, error);
      
      // Fallback to constants if database fails
      const fallback = getDiseaseByClassId(classId);
      if (fallback) {
        console.log('[DiseaseRepository] Using fallback from constants');
        return {
          id: fallback.id,
          class_id: fallback.classId,
          name_en: fallback.nameEn,
          name_ur: fallback.nameUr,
          name_pa: fallback.namePa,
          name_sd: fallback.nameSd,
          category: fallback.category,
          severity: fallback.severity,
          affected_crops: fallback.affectedCrops,
          description_en: fallback.descriptionEn,
          description_ur: fallback.descriptionUr,
          scientific_name: fallback.scientificName,
          symptoms_en: fallback.symptomsEn,
          symptoms_ur: fallback.symptomsUr,
        };
      }
      return null;
    }
  }

  /**
   * Get disease by ID
   * @param {string} diseaseId - Disease UUID
   * @returns {Promise<Object|null>} Disease object or null
   */
  static async findById(diseaseId) {
    const db = await getDatabase();

    try {
      const disease = await db.getFirstAsync(
        `SELECT * FROM ${TABLES.DISEASES} WHERE id = ?`,
        [diseaseId]
      );

      if (!disease) return null;

      return {
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      };
    } catch (error) {
      console.error(`[DiseaseRepository] FindById failed for ${diseaseId}:`, error);
      return null;
    }
  }

  /**
   * Get all diseases for a crop type
   * @param {string} cropType - Crop type ('wheat', 'rice', etc.)
   * @returns {Promise<Array>} Array of diseases
   */
  static async findByCrop(cropType) {
    const db = await getDatabase();

    try {
      const diseases = await db.getAllAsync(
        `SELECT * FROM ${TABLES.DISEASES} 
         WHERE affected_crops LIKE ?
         ORDER BY severity DESC, name_en ASC`,
        [`%"${cropType}"%`]
      );

      return diseases.map((disease) => ({
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      }));
    } catch (error) {
      console.error(`[DiseaseRepository] FindByCrop failed for ${cropType}:`, error);
      return [];
    }
  }

  /**
   * Get diseases by category
   * @param {string} category - Disease category
   * @returns {Promise<Array>} Array of diseases
   */
  static async findByCategory(category) {
    const db = await getDatabase();

    try {
      const diseases = await db.getAllAsync(
        `SELECT * FROM ${TABLES.DISEASES} 
         WHERE category = ?
         ORDER BY severity DESC, name_en ASC`,
        [category]
      );

      return diseases.map((disease) => ({
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      }));
    } catch (error) {
      console.error(`[DiseaseRepository] FindByCategory failed for ${category}:`, error);
      return [];
    }
  }

  /**
   * Get diseases by severity
   * @param {string} severity - Severity level
   * @returns {Promise<Array>} Array of diseases
   */
  static async findBySeverity(severity) {
    const db = await getDatabase();

    try {
      const diseases = await db.getAllAsync(
        `SELECT * FROM ${TABLES.DISEASES} 
         WHERE severity = ?
         ORDER BY name_en ASC`,
        [severity]
      );

      return diseases.map((disease) => ({
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      }));
    } catch (error) {
      console.error(`[DiseaseRepository] FindBySeverity failed for ${severity}:`, error);
      return [];
    }
  }

  /**
   * Get all diseases
   * @returns {Promise<Array>} Array of all diseases
   */
  static async findAll() {
    const db = await getDatabase();

    try {
      const diseases = await db.getAllAsync(
        `SELECT * FROM ${TABLES.DISEASES} 
         ORDER BY class_id ASC`
      );

      return diseases.map((disease) => ({
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      }));
    } catch (error) {
      console.error('[DiseaseRepository] FindAll failed:', error);
      return [];
    }
  }

  /**
   * Search diseases by name (English or local languages)
   * @param {string} searchTerm - Search term
   * @param {string} language - Language to search in ('en', 'ur', 'pa', 'sd', 'all')
   * @returns {Promise<Array>} Matching diseases
   */
  static async search(searchTerm, language = 'all') {
    const db = await getDatabase();

    try {
      const term = `%${searchTerm.toLowerCase()}%`;
      let query;
      let params;

      if (language === 'all') {
        query = `SELECT * FROM ${TABLES.DISEASES} 
                 WHERE LOWER(name_en) LIKE ? 
                    OR LOWER(name_ur) LIKE ? 
                    OR LOWER(name_pa) LIKE ? 
                    OR LOWER(name_sd) LIKE ?
                    OR LOWER(scientific_name) LIKE ?
                 ORDER BY name_en ASC`;
        params = [term, term, term, term, term];
      } else {
        const columnMap = {
          en: 'name_en',
          ur: 'name_ur',
          pa: 'name_pa',
          sd: 'name_sd',
        };
        const column = columnMap[language] || 'name_en';
        query = `SELECT * FROM ${TABLES.DISEASES} 
                 WHERE LOWER(${column}) LIKE ?
                 ORDER BY name_en ASC`;
        params = [term];
      }

      const diseases = await db.getAllAsync(query, params);

      return diseases.map((disease) => ({
        ...disease,
        affected_crops: JSON.parse(disease.affected_crops),
      }));
    } catch (error) {
      console.error('[DiseaseRepository] Search failed:', error);
      return [];
    }
  }

  /**
   * Get disease count by category
   * @returns {Promise<Object>} Count by category
   */
  static async getCountByCategory() {
    const db = await getDatabase();

    try {
      const counts = await db.getAllAsync(
        `SELECT category, COUNT(*) as count 
         FROM ${TABLES.DISEASES} 
         GROUP BY category`
      );

      const result = {};
      counts.forEach((row) => {
        result[row.category] = row.count;
      });

      return result;
    } catch (error) {
      console.error('[DiseaseRepository] GetCountByCategory failed:', error);
      return {};
    }
  }

  /**
   * Get total disease count
   * @returns {Promise<number>} Total count
   */
  static async getTotalCount() {
    const db = await getDatabase();

    try {
      const result = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM ${TABLES.DISEASES}`
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('[DiseaseRepository] GetTotalCount failed:', error);
      return 0;
    }
  }

  /**
   * Get disease statistics
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics() {
    const db = await getDatabase();

    try {
      const [total, byCategory, bySeverity] = await Promise.all([
        this.getTotalCount(),
        db.getAllAsync(
          `SELECT category, COUNT(*) as count 
           FROM ${TABLES.DISEASES} 
           GROUP BY category`
        ),
        db.getAllAsync(
          `SELECT severity, COUNT(*) as count 
           FROM ${TABLES.DISEASES} 
           WHERE severity IS NOT NULL
           GROUP BY severity`
        ),
      ]);

      return {
        total,
        byCategory: byCategory.reduce((acc, row) => {
          acc[row.category] = row.count;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, row) => {
          acc[row.severity] = row.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('[DiseaseRepository] GetStatistics failed:', error);
      return { total: 0, byCategory: {}, bySeverity: {} };
    }
  }

  /**
   * Get localized disease name
   * @param {number} classId - Class ID
   * @param {string} language - Language code
   * @returns {Promise<string>} Localized name
   */
  static async getLocalizedName(classId, language = 'ur') {
    const disease = await this.findByClassId(classId);
    if (!disease) return 'Unknown Disease';

    const nameMap = {
      en: disease.name_en,
      ur: disease.name_ur,
      pa: disease.name_pa,
      sd: disease.name_sd,
    };

    return nameMap[language] || disease.name_ur;
  }

  /**
   * Check if diseases are seeded
   * @returns {Promise<boolean>} True if seeded
   */
  static async isSeeded() {
    const count = await this.getTotalCount();
    return count > 0;
  }
}

export default DiseaseRepository;

