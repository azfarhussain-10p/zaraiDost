// Disease Result Parser Service
// Story 3.2: On-Device Disease Detection Model
// AC4: Confidence score displayed for top 3 predictions
// AC6: Results include disease name in English and local language

import { getDiseaseByClassId, getDiseaseName } from '../../constants/DiseaseClasses';
import {
  PREDICTION_CONFIG,
  getConfidenceLevel,
  needsCloudVerification,
  isHighConfidence,
} from '../../constants/InferenceConstants';

/**
 * DiseaseResultParser
 * Parses TensorFlow Lite model outputs into structured disease predictions
 */
class DiseaseResultParser {
  /**
   * Parse raw model output into top-K disease predictions
   * @param {Float32Array|Array} probabilities - Raw model output (55 class probabilities)
   * @param {Object} options - Parsing options
   * @param {number} options.topK - Number of top predictions to return (default: 3)
   * @param {string} options.language - Language for disease names (default: 'ur')
   * @param {number} options.imageId - Associated image ID for reference
   * @returns {Object} Parsed prediction results
   */
  static parse(probabilities, options = {}) {
    const {
      topK = PREDICTION_CONFIG.TOP_K,
      language = 'ur',
      imageId = null,
    } = options;

    try {
      // Validate input
      if (!probabilities || probabilities.length !== 55) {
        throw new Error(`Invalid probabilities array. Expected 55 classes, got ${probabilities?.length || 0}`);
      }

      // Convert to array if needed
      const probArray = Array.from(probabilities);

      // Get top-K predictions
      const topPredictions = this._getTopK(probArray, topK);

      // Enrich predictions with disease info
      const enrichedPredictions = topPredictions.map((pred, index) => {
        const disease = getDiseaseByClassId(pred.classId);
        
        if (!disease) {
          console.warn(`[DiseaseResultParser] Disease not found for classId ${pred.classId}`);
          return {
            rank: index + 1,
            classId: pred.classId,
            confidence: pred.confidence,
            confidenceLevel: getConfidenceLevel(pred.confidence),
            diseaseNameEn: 'Unknown Disease',
            diseaseNameLocal: 'نامعلوم بیماری',
            category: 'unknown',
            severity: null,
          };
        }

        return {
          rank: index + 1,
          classId: pred.classId,
          confidence: pred.confidence,
          confidencePercent: Math.round(pred.confidence * 100),
          confidenceLevel: getConfidenceLevel(pred.confidence),
          
          // Disease information
          diseaseId: disease.id,
          diseaseNameEn: disease.nameEn,
          diseaseNameUr: disease.nameUr,
          diseaseNamePa: disease.namePa,
          diseaseNameSd: disease.nameSd,
          diseaseNameLocal: getDiseaseName(pred.classId, language),
          scientificName: disease.scientificName,
          
          // Classification
          category: disease.category,
          severity: disease.severity,
          affectedCrops: disease.affectedCrops,
          
          // Descriptions
          descriptionEn: disease.descriptionEn,
          descriptionUr: disease.descriptionUr,
          symptomsEn: disease.symptomsEn,
          symptomsUr: disease.symptomsUr,
        };
      });

      // Determine primary prediction
      const primaryPrediction = enrichedPredictions[0];
      const isHealthy = primaryPrediction.classId === 0;
      const highConfidence = isHighConfidence(primaryPrediction.confidence);
      const needsVerification = needsCloudVerification(primaryPrediction.confidence);

      // Calculate confidence distribution
      const confidenceDistribution = this._calculateDistribution(topPredictions);

      return {
        // Metadata
        imageId,
        timestamp: new Date().toISOString(),
        modelVersion: 'v1.0',
        
        // Top predictions
        predictions: enrichedPredictions,
        topPrediction: primaryPrediction,
        
        // Analysis flags
        isHealthy,
        highConfidence,
        needsCloudVerification: needsVerification,
        
        // Confidence metrics
        topConfidence: primaryPrediction.confidence,
        confidenceLevel: primaryPrediction.confidenceLevel,
        confidenceDistribution,
        
        // Recommendations
        recommendations: this._generateRecommendations(enrichedPredictions, {
          isHealthy,
          highConfidence,
          needsVerification,
        }),
      };
    } catch (error) {
      console.error('[DiseaseResultParser] Parse failed:', error);
      throw error;
    }
  }

  /**
   * Get top-K predictions from probability array
   * @private
   * @param {Array<number>} probabilities - Class probabilities
   * @param {number} k - Number of top predictions
   * @returns {Array<Object>} Top-K predictions with classId and confidence
   */
  static _getTopK(probabilities, k) {
    // Create array of [classId, confidence] pairs
    const pairs = probabilities.map((prob, index) => ({
      classId: index,
      confidence: prob,
    }));

    // Sort by confidence descending
    pairs.sort((a, b) => b.confidence - a.confidence);

    // Return top-K, filtering out very low confidences
    return pairs
      .slice(0, k)
      .filter((pred) => pred.confidence >= PREDICTION_CONFIG.MIN_CONFIDENCE_THRESHOLD);
  }

  /**
   * Calculate confidence distribution metrics
   * @private
   * @param {Array<Object>} topPredictions - Top predictions
   * @returns {Object} Distribution metrics
   */
  static _calculateDistribution(topPredictions) {
    if (topPredictions.length === 0) return { entropy: 0, dominance: 0 };

    const confidences = topPredictions.map((p) => p.confidence);
    const topConfidence = confidences[0];
    const secondConfidence = confidences[1] || 0;

    // Dominance: how much the top prediction dominates
    const dominance = topConfidence - secondConfidence;

    // Entropy: measure of uncertainty (simplified)
    const entropy = confidences.reduce((sum, conf) => {
      if (conf > 0) {
        return sum - conf * Math.log2(conf);
      }
      return sum;
    }, 0);

    return {
      dominance,
      entropy,
      spread: confidences[confidences.length - 1] / topConfidence, // Range compression
    };
  }

  /**
   * Generate actionable recommendations
   * @private
   * @param {Array<Object>} predictions - Enriched predictions
   * @param {Object} flags - Analysis flags
   * @returns {Object} Recommendations
   */
  static _generateRecommendations(predictions, flags) {
    const { isHealthy, highConfidence, needsVerification } = flags;
    const topPrediction = predictions[0];

    const recommendations = {
      primaryAction: null,
      secondaryActions: [],
      warnings: [],
    };

    // Healthy plant
    if (isHealthy && highConfidence) {
      recommendations.primaryAction = 'continue_monitoring';
      recommendations.secondaryActions.push('maintain_current_practices');
      return recommendations;
    }

    // High confidence disease detection
    if (!isHealthy && highConfidence) {
      recommendations.primaryAction = 'immediate_treatment';
      recommendations.secondaryActions.push('consult_expert', 'monitor_spread');
      
      if (topPrediction.severity === 'severe' || topPrediction.severity === 'critical') {
        recommendations.warnings.push('high_severity_disease');
      }
      
      return recommendations;
    }

    // Low confidence - needs verification
    if (needsVerification) {
      recommendations.primaryAction = 'seek_expert_opinion';
      recommendations.secondaryActions.push('upload_for_cloud_analysis', 'capture_more_images');
      recommendations.warnings.push('low_confidence_detection');
      return recommendations;
    }

    // Moderate confidence
    recommendations.primaryAction = 'monitor_symptoms';
    recommendations.secondaryActions.push('capture_additional_images', 'track_progression');
    
    return recommendations;
  }

  /**
   * Format result for display in UI
   * @param {Object} result - Parsed result
   * @param {string} language - Display language
   * @returns {Object} Formatted result for UI
   */
  static formatForDisplay(result, language = 'ur') {
    const { topPrediction, predictions, highConfidence, needsCloudVerification } = result;

    // Primary disease info
    const primaryDisease = {
      name: language === 'en' ? topPrediction.diseaseNameEn : topPrediction.diseaseNameLocal,
      scientificName: topPrediction.scientificName,
      confidence: topPrediction.confidencePercent,
      confidenceLevel: topPrediction.confidenceLevel,
      description: language === 'en' ? topPrediction.descriptionEn : topPrediction.descriptionUr,
      symptoms: language === 'en' ? topPrediction.symptomsEn : topPrediction.symptomsUr,
      severity: topPrediction.severity,
      category: topPrediction.category,
    };

    // Alternative predictions
    const alternatives = predictions.slice(1).map((pred) => ({
      name: language === 'en' ? pred.diseaseNameEn : pred.diseaseNameLocal,
      confidence: pred.confidencePercent,
      confidenceLevel: pred.confidenceLevel,
    }));

    // Status indicators
    const status = {
      isHealthy: topPrediction.classId === 0,
      highConfidence,
      needsVerification: needsCloudVerification,
      requiresAction: topPrediction.severity === 'severe' || topPrediction.severity === 'critical',
    };

    // Recommendation text
    const recommendationText = this._getRecommendationText(result.recommendations, language);

    return {
      primaryDisease,
      alternatives,
      status,
      recommendationText,
      timestamp: result.timestamp,
    };
  }

  /**
   * Get recommendation text in specified language
   * @private
   * @param {Object} recommendations - Recommendations object
   * @param {string} language - Language code
   * @returns {string} Recommendation text
   */
  static _getRecommendationText(recommendations, language) {
    const { primaryAction } = recommendations;

    const texts = {
      en: {
        continue_monitoring: 'Plant appears healthy. Continue regular monitoring.',
        immediate_treatment: 'Disease detected. Immediate treatment recommended.',
        seek_expert_opinion: 'Uncertain diagnosis. Consult agricultural expert.',
        monitor_symptoms: 'Monitor symptoms closely and capture more images if condition worsens.',
      },
      ur: {
        continue_monitoring: 'پودا صحت مند نظر آتا ہے۔ باقاعدہ نگرانی جاری رکھیں۔',
        immediate_treatment: 'بیماری کا پتہ چلا۔ فوری علاج کی سفارش کی جاتی ہے۔',
        seek_expert_opinion: 'غیر یقینی تشخیص۔ زرعی ماہر سے مشورہ کریں۔',
        monitor_symptoms: 'علامات کو غور سے دیکھیں اور اگر حالت خراب ہو تو مزید تصاویر لیں۔',
      },
    };

    const langTexts = texts[language] || texts.ur;
    return langTexts[primaryAction] || langTexts.monitor_symptoms;
  }

  /**
   * Parse batch of image results
   * @param {Array<Object>} imageResults - Array of {imageId, probabilities}
   * @param {Object} options - Parsing options
   * @returns {Array<Object>} Array of parsed results
   */
  static parseBatch(imageResults, options = {}) {
    return imageResults.map((result) => {
      try {
        return this.parse(result.probabilities, {
          ...options,
          imageId: result.imageId,
        });
      } catch (error) {
        console.error(`[DiseaseResultParser] Failed to parse image ${result.imageId}:`, error);
        return {
          imageId: result.imageId,
          error: error.message,
          predictions: [],
        };
      }
    });
  }

  /**
   * Compare two prediction results for consistency
   * @param {Object} result1 - First result
   * @param {Object} result2 - Second result
   * @returns {Object} Comparison analysis
   */
  static compareResults(result1, result2) {
    const sameTopDisease = result1.topPrediction.classId === result2.topPrediction.classId;
    const confidenceDiff = Math.abs(
      result1.topPrediction.confidence - result2.topPrediction.confidence
    );

    // Check if top 3 predictions overlap
    const top3_1 = result1.predictions.slice(0, 3).map((p) => p.classId);
    const top3_2 = result2.predictions.slice(0, 3).map((p) => p.classId);
    const overlap = top3_1.filter((id) => top3_2.includes(id)).length;

    return {
      consistent: sameTopDisease && confidenceDiff < 0.2,
      sameTopDisease,
      confidenceDiff,
      overlapCount: overlap,
      overlapPercent: (overlap / 3) * 100,
    };
  }
}

export default DiseaseResultParser;

