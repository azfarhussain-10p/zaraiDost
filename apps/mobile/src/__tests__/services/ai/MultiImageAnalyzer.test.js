// MultiImageAnalyzer Tests
// Story 3.2: On-Device Disease Detection Model

import MultiImageAnalyzer from '../../../services/ai/MultiImageAnalyzer';

describe('MultiImageAnalyzer', () => {
  // Helper to create mock prediction result
  const createMockPrediction = (classId, confidence, imageId = 'img1') => ({
    imageId,
    topPrediction: {
      classId,
      confidence,
      confidenceLevel: confidence >= 0.7 ? 'high' : 'medium',
      diseaseNameEn: `Disease ${classId}`,
      diseaseNameUr: `بیماری ${classId}`,
    },
    predictions: [
      { classId, confidence, diseaseNameEn: `Disease ${classId}` },
      { classId: classId + 1, confidence: confidence * 0.5, diseaseNameEn: `Disease ${classId + 1}` },
      { classId: classId + 2, confidence: confidence * 0.25, diseaseNameEn: `Disease ${classId + 2}` },
    ],
  });

  describe('aggregate()', () => {
    it('should aggregate predictions from multiple images', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result).toHaveProperty('consensusDisease');
      expect(result).toHaveProperty('alternativeDiseases');
      expect(result).toHaveProperty('consensus');
      expect(result).toHaveProperty('recommendations');
    });

    it('should identify consensus when images agree', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.consensus.hasConsensus).toBe(true);
      expect(result.consensus.agreementPercent).toBe(100);
      expect(result.consensus.isReliable).toBe(true);
    });

    it('should detect disagreement when predictions differ', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(5, 0.70, 'img2'),
        createMockPrediction(10, 0.72, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.consensus.agreementPercent).toBeLessThan(100);
      expect(result.disagreements.length).toBeGreaterThan(0);
    });

    it('should handle mixed predictions with partial agreement', () => {
      const imageResults = [
        createMockPrediction(1, 0.80, 'img1'),
        createMockPrediction(1, 0.75, 'img2'),
        createMockPrediction(5, 0.70, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.consensus.agreementPercent).toBeGreaterThan(50);
      expect(result.consensus.agreementPercent).toBeLessThan(100);
    });

    it('should calculate aggregated confidence from multiple images', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.consensusDisease.confidence).toBeGreaterThan(0.7);
      expect(result.consensusDisease.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should provide alternative disease predictions', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(1, 0.70, 'img2'),
        createMockPrediction(1, 0.72, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.alternativeDiseases).toBeDefined();
      expect(result.alternativeDiseases.length).toBeGreaterThan(0);
    });

    it('should filter out error results', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        { imageId: 'img2', error: 'Failed to process' },
        createMockPrediction(1, 0.80, 'img3'),
      ];

      const result = MultiImageAnalyzer.aggregate(imageResults);

      expect(result.totalImages).toBe(3);
      expect(result.validImages).toBe(2);
      expect(result.errorImages).toBe(1);
    });

    it('should throw error for empty results', () => {
      expect(() => {
        MultiImageAnalyzer.aggregate([]);
      }).toThrow();
    });

    it('should throw error for all invalid results', () => {
      const imageResults = [
        { imageId: 'img1', error: 'Failed' },
        { imageId: 'img2', error: 'Failed' },
      ];

      expect(() => {
        MultiImageAnalyzer.aggregate(imageResults);
      }).toThrow();
    });
  });

  describe('_weightedConfidenceVoting()', () => {
    it('should weight top predictions higher', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
      ];

      const votes = MultiImageAnalyzer._weightedConfidenceVoting(imageResults);

      expect(votes[0].classId).toBe(1);
      expect(votes[0].voteScore).toBeGreaterThan(0);
    });

    it('should accumulate votes across images', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(1, 0.70, 'img2'),
        createMockPrediction(1, 0.72, 'img3'),
      ];

      const votes = MultiImageAnalyzer._weightedConfidenceVoting(imageResults);

      expect(votes[0].count).toBe(3);
      expect(votes[0].averageConfidence).toBeCloseTo(0.72, 2);
    });
  });

  describe('_majorityVoting()', () => {
    it('should count votes for top predictions', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(1, 0.70, 'img2'),
        createMockPrediction(5, 0.72, 'img3'),
      ];

      const votes = MultiImageAnalyzer._majorityVoting(imageResults);

      expect(votes[0].classId).toBe(1);
      expect(votes[0].voteScore).toBe(2);
    });

    it('should handle tie situations', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(5, 0.75, 'img2'),
      ];

      const votes = MultiImageAnalyzer._majorityVoting(imageResults);

      expect(votes.length).toBe(2);
      expect(votes[0].voteScore).toBe(1);
      expect(votes[1].voteScore).toBe(1);
    });
  });

  describe('_analyzeConsensus()', () => {
    it('should calculate agreement percentage', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(5, 0.75, 'img3'),
      ];

      const votes = [
        { classId: 1, voteScore: 2, count: 2 },
        { classId: 5, voteScore: 1, count: 1 },
      ];

      const consensus = MultiImageAnalyzer._analyzeConsensus(imageResults, votes);

      expect(consensus.agreementPercent).toBeCloseTo(66.67, 1);
    });

    it('should identify disagreements', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(5, 0.80, 'img2'),
        createMockPrediction(10, 0.82, 'img3'),
      ];

      const votes = [
        { classId: 1, voteScore: 1 },
        { classId: 5, voteScore: 1 },
        { classId: 10, voteScore: 1 },
      ];

      const consensus = MultiImageAnalyzer._analyzeConsensus(imageResults, votes);

      expect(consensus.disagreements.length).toBe(2);
    });

    it('should classify consensus confidence', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
        createMockPrediction(1, 0.81, 'img4'),
      ];

      const votes = [{ classId: 1, voteScore: 4 }];

      const consensus = MultiImageAnalyzer._analyzeConsensus(imageResults, votes);

      expect(consensus.confidence).toBe('high');
    });
  });

  describe('_calculateAggregatedConfidence()', () => {
    it('should use weighted average of confidences', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
      ];

      const confidence = MultiImageAnalyzer._calculateAggregatedConfidence(imageResults, 1);

      expect(confidence).toBeGreaterThan(0.80);
      expect(confidence).toBeLessThanOrEqual(0.85);
    });

    it('should give more weight to higher confidences', () => {
      const imageResults = [
        createMockPrediction(1, 0.90, 'img1'),
        createMockPrediction(1, 0.60, 'img2'),
      ];

      const confidence = MultiImageAnalyzer._calculateAggregatedConfidence(imageResults, 1);

      // Should be closer to 0.90 than 0.75 (simple average)
      expect(confidence).toBeGreaterThan(0.75);
    });
  });

  describe('_generateRecommendations()', () => {
    it('should recommend monitoring for healthy consensus', () => {
      const data = {
        isReliable: true,
        consensus: { confidence: 'high' },
        validResults: [],
        topDisease: { classId: 0 },
      };

      const recommendations = MultiImageAnalyzer._generateRecommendations(data);

      expect(recommendations.primaryAction).toBe('continue_monitoring');
    });

    it('should recommend treatment for disease consensus', () => {
      const data = {
        isReliable: true,
        consensus: { confidence: 'high' },
        validResults: [],
        topDisease: { classId: 1, severity: 'severe' },
      };

      const recommendations = MultiImageAnalyzer._generateRecommendations(data);

      expect(recommendations.primaryAction).toBe('immediate_treatment');
      expect(recommendations.warnings).toContain('high_severity_disease');
    });

    it('should recommend more images for low consensus', () => {
      const data = {
        isReliable: false,
        consensus: { confidence: 'low' },
        validResults: [],
        topDisease: { classId: 1 },
      };

      const recommendations = MultiImageAnalyzer._generateRecommendations(data);

      expect(recommendations.primaryAction).toBe('capture_more_images');
      expect(recommendations.warnings).toContain('inconsistent_predictions');
    });
  });

  describe('analyzeConsistency()', () => {
    it('should detect consistent predictions', () => {
      const imageResults = [
        createMockPrediction(1, 0.85, 'img1'),
        createMockPrediction(1, 0.80, 'img2'),
        createMockPrediction(1, 0.82, 'img3'),
      ];

      const analysis = MultiImageAnalyzer.analyzeConsistency(imageResults);

      expect(analysis.consistent).toBe(true);
      expect(analysis.consistencyPercent).toBeGreaterThan(70);
    });

    it('should detect inconsistent predictions', () => {
      const imageResults = [
        createMockPrediction(1, 0.75, 'img1'),
        createMockPrediction(5, 0.70, 'img2'),
        createMockPrediction(10, 0.72, 'img3'),
      ];

      const analysis = MultiImageAnalyzer.analyzeConsistency(imageResults);

      expect(analysis.consistent).toBe(false);
      expect(analysis.message).toContain('vary');
    });

    it('should handle single image', () => {
      const imageResults = [createMockPrediction(1, 0.85, 'img1')];

      const analysis = MultiImageAnalyzer.analyzeConsistency(imageResults);

      expect(analysis.consistent).toBe(true);
    });
  });

  describe('formatForDisplay()', () => {
    it('should format aggregated results for UI', () => {
      const aggregatedResult = {
        consensusDisease: {
          disease: { nameEn: 'Disease 1', nameUr: 'بیماری 1' },
          confidence: 0.85,
          confidenceLevel: 'high',
        },
        alternativeDiseases: [],
        consensus: {
          isReliable: true,
          confidence: 'high',
          agreementPercent: 95,
        },
        recommendations: {},
      };

      const formatted = MultiImageAnalyzer.formatForDisplay(aggregatedResult);

      expect(formatted).toHaveProperty('primaryDisease');
      expect(formatted).toHaveProperty('alternatives');
      expect(formatted).toHaveProperty('reliability');
      expect(formatted).toHaveProperty('summary');
    });

    it('should format confidence as percentage', () => {
      const aggregatedResult = {
        consensusDisease: {
          disease: { nameEn: 'Disease 1', nameUr: 'بیماری 1' },
          confidence: 0.85,
          confidenceLevel: 'high',
        },
        alternativeDiseases: [],
        consensus: {
          isReliable: true,
          confidence: 'high',
          agreementPercent: 95,
        },
        recommendations: {},
      };

      const formatted = MultiImageAnalyzer.formatForDisplay(aggregatedResult);

      expect(formatted.primaryDisease.confidence).toBe(85);
    });

    it('should support localization', () => {
      const aggregatedResult = {
        consensusDisease: {
          disease: { nameEn: 'Disease 1', nameUr: 'بیماری 1' },
          confidence: 0.85,
          confidenceLevel: 'high',
        },
        alternativeDiseases: [],
        consensus: {
          isReliable: true,
          confidence: 'high',
          agreementPercent: 95,
        },
        recommendations: {},
      };

      const formattedUr = MultiImageAnalyzer.formatForDisplay(aggregatedResult, 'ur');
      const formattedEn = MultiImageAnalyzer.formatForDisplay(aggregatedResult, 'en');

      expect(formattedUr.primaryDisease.name).toBe('بیماری 1');
      expect(formattedEn.primaryDisease.name).toBe('Disease 1');
    });
  });
});

