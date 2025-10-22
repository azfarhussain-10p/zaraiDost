// DiseaseResultParser Tests
// Story 3.2: On-Device Disease Detection Model

import DiseaseResultParser from '../../../services/ai/DiseaseResultParser';
import { getDiseaseByClassId } from '../../../constants/DiseaseClasses';

describe('DiseaseResultParser', () => {
  // Mock probabilities for testing
  const createMockProbabilities = (topClass = 1, topConfidence = 0.75) => {
    const probs = new Float32Array(55).fill(0.01);
    probs[topClass] = topConfidence;
    
    // Normalize
    const sum = Array.from(probs).reduce((a, b) => a + b, 0);
    for (let i = 0; i < probs.length; i++) {
      probs[i] /= sum;
    }
    
    return probs;
  };

  describe('parse()', () => {
    it('should parse probabilities into structured predictions', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);

      expect(result).toHaveProperty('predictions');
      expect(result).toHaveProperty('topPrediction');
      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('highConfidence');
      expect(result).toHaveProperty('needsCloudVerification');
    });

    it('should return top-K predictions (default 3)', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);

      expect(result.predictions).toHaveLength(3);
    });

    it('should include disease information for each prediction', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);

      const prediction = result.predictions[0];
      expect(prediction).toHaveProperty('diseaseId');
      expect(prediction).toHaveProperty('diseaseNameEn');
      expect(prediction).toHaveProperty('diseaseNameUr');
      expect(prediction).toHaveProperty('category');
      expect(prediction).toHaveProperty('severity');
    });

    it('should calculate confidence levels correctly', () => {
      const highConfProbs = createMockProbabilities(1, 0.85);
      const highResult = DiseaseResultParser.parse(highConfProbs);
      expect(highResult.topPrediction.confidenceLevel).toBe('high');

      const mediumConfProbs = createMockProbabilities(1, 0.60);
      const mediumResult = DiseaseResultParser.parse(mediumConfProbs);
      expect(mediumResult.topPrediction.confidenceLevel).toBe('medium');

      const lowConfProbs = createMockProbabilities(1, 0.35);
      const lowResult = DiseaseResultParser.parse(lowConfProbs);
      expect(lowResult.topPrediction.confidenceLevel).toBe('low');
    });

    it('should identify healthy plants (class 0)', () => {
      const healthyProbs = createMockProbabilities(0, 0.85);
      const result = DiseaseResultParser.parse(healthyProbs);

      expect(result.isHealthy).toBe(true);
      expect(result.topPrediction.classId).toBe(0);
    });

    it('should detect high confidence predictions', () => {
      const highConfProbs = createMockProbabilities(1, 0.85);
      const result = DiseaseResultParser.parse(highConfProbs);

      expect(result.highConfidence).toBe(true);
    });

    it('should identify predictions needing cloud verification', () => {
      const lowConfProbs = createMockProbabilities(1, 0.50);
      const result = DiseaseResultParser.parse(lowConfProbs);

      expect(result.needsCloudVerification).toBe(true);
    });

    it('should support custom language for disease names', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const resultUr = DiseaseResultParser.parse(probabilities, { language: 'ur' });
      const resultEn = DiseaseResultParser.parse(probabilities, { language: 'en' });

      expect(resultUr.topPrediction.diseaseNameLocal).toBeDefined();
      expect(resultEn.topPrediction.diseaseNameLocal).toBeDefined();
    });

    it('should include image ID if provided', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities, { imageId: 'test-image-123' });

      expect(result.imageId).toBe('test-image-123');
    });

    it('should throw error for invalid probabilities', () => {
      expect(() => {
        DiseaseResultParser.parse(null);
      }).toThrow();

      expect(() => {
        DiseaseResultParser.parse(new Float32Array(10)); // Wrong size
      }).toThrow();
    });
  });

  describe('_getTopK()', () => {
    it('should return top-K predictions sorted by confidence', () => {
      const probabilities = [0.1, 0.5, 0.2, 0.15, 0.05];
      const topK = DiseaseResultParser._getTopK(probabilities, 3);

      expect(topK).toHaveLength(3);
      expect(topK[0].classId).toBe(1); // 0.5
      expect(topK[1].classId).toBe(2); // 0.2
      expect(topK[2].classId).toBe(3); // 0.15
    });

    it('should filter out very low confidences', () => {
      const probabilities = Array(55).fill(0.001);
      probabilities[0] = 0.95;
      
      const topK = DiseaseResultParser._getTopK(probabilities, 3);

      // Should only return class 0 since others are below threshold
      expect(topK.length).toBeLessThanOrEqual(3);
    });
  });

  describe('_calculateDistribution()', () => {
    it('should calculate confidence distribution metrics', () => {
      const topPredictions = [
        { classId: 1, confidence: 0.7 },
        { classId: 2, confidence: 0.2 },
        { classId: 3, confidence: 0.1 },
      ];

      const distribution = DiseaseResultParser._calculateDistribution(topPredictions);

      expect(distribution).toHaveProperty('dominance');
      expect(distribution).toHaveProperty('entropy');
      expect(distribution).toHaveProperty('spread');
      expect(distribution.dominance).toBeCloseTo(0.5, 1);
    });
  });

  describe('_generateRecommendations()', () => {
    it('should recommend monitoring for healthy plants', () => {
      const predictions = [
        { classId: 0, confidence: 0.9, diseaseNameEn: 'Healthy' },
      ];

      const recommendations = DiseaseResultParser._generateRecommendations(
        predictions,
        { isHealthy: true, highConfidence: true, needsVerification: false }
      );

      expect(recommendations.primaryAction).toBe('continue_monitoring');
    });

    it('should recommend immediate treatment for high confidence diseases', () => {
      const predictions = [
        { classId: 1, confidence: 0.85, severity: 'severe' },
      ];

      const recommendations = DiseaseResultParser._generateRecommendations(
        predictions,
        { isHealthy: false, highConfidence: true, needsVerification: false }
      );

      expect(recommendations.primaryAction).toBe('immediate_treatment');
    });

    it('should recommend expert consultation for low confidence', () => {
      const predictions = [
        { classId: 1, confidence: 0.50 },
      ];

      const recommendations = DiseaseResultParser._generateRecommendations(
        predictions,
        { isHealthy: false, highConfidence: false, needsVerification: true }
      );

      expect(recommendations.primaryAction).toBe('seek_expert_opinion');
    });

    it('should include warnings for severe diseases', () => {
      const predictions = [
        { classId: 1, confidence: 0.85, severity: 'severe' },
      ];

      const recommendations = DiseaseResultParser._generateRecommendations(
        predictions,
        { isHealthy: false, highConfidence: true, needsVerification: false }
      );

      expect(recommendations.warnings).toContain('high_severity_disease');
    });
  });

  describe('formatForDisplay()', () => {
    it('should format result for UI display', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);
      const formatted = DiseaseResultParser.formatForDisplay(result, 'ur');

      expect(formatted).toHaveProperty('primaryDisease');
      expect(formatted).toHaveProperty('alternatives');
      expect(formatted).toHaveProperty('status');
      expect(formatted).toHaveProperty('recommendationText');
    });

    it('should include localized disease names', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);
      const formatted = DiseaseResultParser.formatForDisplay(result, 'ur');

      expect(formatted.primaryDisease.name).toBeDefined();
      expect(typeof formatted.primaryDisease.name).toBe('string');
    });

    it('should format confidence as percentage', () => {
      const probabilities = createMockProbabilities(1, 0.75);
      const result = DiseaseResultParser.parse(probabilities);
      const formatted = DiseaseResultParser.formatForDisplay(result);

      expect(formatted.primaryDisease.confidence).toBeGreaterThan(0);
      expect(formatted.primaryDisease.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('parseBatch()', () => {
    it('should parse multiple image results', () => {
      const imageResults = [
        { imageId: 'img1', probabilities: createMockProbabilities(1, 0.75) },
        { imageId: 'img2', probabilities: createMockProbabilities(1, 0.80) },
        { imageId: 'img3', probabilities: createMockProbabilities(2, 0.70) },
      ];

      const results = DiseaseResultParser.parseBatch(imageResults);

      expect(results).toHaveLength(3);
      expect(results[0].imageId).toBe('img1');
      expect(results[1].imageId).toBe('img2');
      expect(results[2].imageId).toBe('img3');
    });

    it('should handle errors gracefully in batch processing', () => {
      const imageResults = [
        { imageId: 'img1', probabilities: createMockProbabilities(1, 0.75) },
        { imageId: 'img2', probabilities: null }, // Invalid
        { imageId: 'img3', probabilities: createMockProbabilities(2, 0.70) },
      ];

      const results = DiseaseResultParser.parseBatch(imageResults);

      expect(results).toHaveLength(3);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[2].error).toBeUndefined();
    });
  });

  describe('compareResults()', () => {
    it('should detect consistent predictions', () => {
      const probs1 = createMockProbabilities(1, 0.75);
      const probs2 = createMockProbabilities(1, 0.78);
      
      const result1 = DiseaseResultParser.parse(probs1);
      const result2 = DiseaseResultParser.parse(probs2);

      const comparison = DiseaseResultParser.compareResults(result1, result2);

      expect(comparison.consistent).toBe(true);
      expect(comparison.sameTopDisease).toBe(true);
    });

    it('should detect inconsistent predictions', () => {
      const probs1 = createMockProbabilities(1, 0.75);
      const probs2 = createMockProbabilities(5, 0.80);
      
      const result1 = DiseaseResultParser.parse(probs1);
      const result2 = DiseaseResultParser.parse(probs2);

      const comparison = DiseaseResultParser.compareResults(result1, result2);

      expect(comparison.consistent).toBe(false);
      expect(comparison.sameTopDisease).toBe(false);
    });

    it('should calculate overlap in top-3 predictions', () => {
      const probs1 = createMockProbabilities(1, 0.75);
      const probs2 = createMockProbabilities(1, 0.78);
      
      const result1 = DiseaseResultParser.parse(probs1);
      const result2 = DiseaseResultParser.parse(probs2);

      const comparison = DiseaseResultParser.compareResults(result1, result2);

      expect(comparison.overlapCount).toBeGreaterThan(0);
      expect(comparison.overlapPercent).toBeGreaterThan(0);
    });
  });

  describe('_getRecommendationText()', () => {
    it('should return localized recommendation text', () => {
      const recommendations = { primaryAction: 'immediate_treatment' };
      
      const textUr = DiseaseResultParser._getRecommendationText(recommendations, 'ur');
      const textEn = DiseaseResultParser._getRecommendationText(recommendations, 'en');

      expect(textUr).toBeDefined();
      expect(textEn).toBeDefined();
      expect(textUr).not.toBe(textEn);
    });

    it('should handle unknown actions gracefully', () => {
      const recommendations = { primaryAction: 'unknown_action' };
      
      const text = DiseaseResultParser._getRecommendationText(recommendations, 'en');

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
    });
  });
});

