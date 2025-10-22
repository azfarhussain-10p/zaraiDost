// Multi-Image Analyzer Service
// Story 3.2: On-Device Disease Detection Model
// Aggregates predictions from multiple images for consensus

import DiseaseResultParser from './DiseaseResultParser';
import {
  MULTI_IMAGE_CONFIG,
  PREDICTION_CONFIG,
  getConfidenceLevel,
} from '../../constants/InferenceConstants';
import { getDiseaseByClassId } from '../../constants/DiseaseClasses';

/**
 * MultiImageAnalyzer
 * Analyzes predictions from multiple images to provide aggregated consensus
 */
class MultiImageAnalyzer {
  /**
   * Aggregate predictions from multiple images
   * @param {Array<Object>} imageResults - Array of prediction results
   * @param {Object} options - Aggregation options
   * @param {string} options.votingMethod - 'weighted_confidence' or 'majority_vote'
   * @param {string} options.language - Language for results
   * @returns {Object} Aggregated prediction with consensus
   */
  static aggregate(imageResults, options = {}) {
    const {
      votingMethod = MULTI_IMAGE_CONFIG.VOTING_METHOD,
      language = 'ur',
    } = options;

    try {
      // Validate input
      if (!Array.isArray(imageResults) || imageResults.length === 0) {
        throw new Error('No image results provided for aggregation');
      }

      // Filter out error results
      const validResults = imageResults.filter((result) => !result.error && result.predictions);

      if (validResults.length === 0) {
        throw new Error('No valid predictions to aggregate');
      }

      // Get voting results
      const votes = votingMethod === 'weighted_confidence'
        ? this._weightedConfidenceVoting(validResults)
        : this._majorityVoting(validResults);

      // Analyze consensus
      const consensus = this._analyzeConsensus(validResults, votes);

      // Get aggregated disease prediction
      const topDiseaseId = votes[0].classId;
      const topDisease = getDiseaseByClassId(topDiseaseId);

      // Calculate aggregated confidence
      const aggregatedConfidence = this._calculateAggregatedConfidence(
        validResults,
        topDiseaseId
      );

      // Determine if consensus is reliable
      const isReliable = consensus.agreementPercent >= PREDICTION_CONFIG.CONSENSUS_THRESHOLD * 100;

      return {
        // Metadata
        totalImages: imageResults.length,
        validImages: validResults.length,
        errorImages: imageResults.length - validResults.length,
        
        // Aggregated prediction
        consensusDisease: {
          classId: topDiseaseId,
          disease: topDisease,
          confidence: aggregatedConfidence,
          confidenceLevel: getConfidenceLevel(aggregatedConfidence),
          voteCount: votes[0].voteScore,
        },

        // Alternative diseases
        alternativeDiseases: votes.slice(1, 3).map((vote) => ({
          classId: vote.classId,
          disease: getDiseaseByClassId(vote.classId),
          confidence: vote.averageConfidence,
          voteCount: vote.voteScore,
        })),

        // Consensus analysis
        consensus: {
          hasConsensus: consensus.hasConsensus,
          agreementPercent: consensus.agreementPercent,
          confidence: consensus.confidence,
          isReliable,
        },

        // Individual results summary
        individualResults: validResults.map((result) => ({
          imageId: result.imageId,
          topPrediction: result.topPrediction.classId,
          confidence: result.topPrediction.confidence,
          confidenceLevel: result.topPrediction.confidenceLevel,
        })),

        // Disagreements
        disagreements: consensus.disagreements,

        // Recommendations
        recommendations: this._generateRecommendations({
          isReliable,
          consensus,
          validResults,
          topDisease,
        }),
      };

    } catch (error) {
      console.error('[MultiImageAnalyzer] Aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Weighted confidence voting
   * @private
   * @param {Array<Object>} results - Prediction results
   * @returns {Array<Object>} Sorted votes
   */
  static _weightedConfidenceVoting(results) {
    const votes = {};

    // Accumulate weighted votes
    results.forEach((result) => {
      const predictions = result.predictions.slice(0, 3); // Top 3 from each image

      predictions.forEach((pred, index) => {
        const classId = pred.classId;
        const weight = index === 0
          ? MULTI_IMAGE_CONFIG.TOP_PREDICTION_WEIGHT
          : index === 1
          ? MULTI_IMAGE_CONFIG.SECOND_PREDICTION_WEIGHT
          : MULTI_IMAGE_CONFIG.THIRD_PREDICTION_WEIGHT;

        const weightedVote = pred.confidence * weight;

        if (!votes[classId]) {
          votes[classId] = {
            classId,
            voteScore: 0,
            confidenceSum: 0,
            count: 0,
          };
        }

        votes[classId].voteScore += weightedVote;
        votes[classId].confidenceSum += pred.confidence;
        votes[classId].count++;
      });
    });

    // Calculate averages and sort
    const sortedVotes = Object.values(votes)
      .map((vote) => ({
        ...vote,
        averageConfidence: vote.confidenceSum / vote.count,
      }))
      .sort((a, b) => b.voteScore - a.voteScore);

    return sortedVotes;
  }

  /**
   * Simple majority voting
   * @private
   * @param {Array<Object>} results - Prediction results
   * @returns {Array<Object>} Sorted votes
   */
  static _majorityVoting(results) {
    const votes = {};

    // Count votes for top predictions
    results.forEach((result) => {
      const topClassId = result.topPrediction.classId;
      
      if (!votes[topClassId]) {
        votes[topClassId] = {
          classId: topClassId,
          voteScore: 0,
          confidenceSum: 0,
          count: 0,
        };
      }

      votes[topClassId].voteScore += 1; // Simple count
      votes[topClassId].confidenceSum += result.topPrediction.confidence;
      votes[topClassId].count++;
    });

    // Calculate averages and sort
    const sortedVotes = Object.values(votes)
      .map((vote) => ({
        ...vote,
        averageConfidence: vote.confidenceSum / vote.count,
      }))
      .sort((a, b) => b.voteScore - a.voteScore);

    return sortedVotes;
  }

  /**
   * Analyze consensus among predictions
   * @private
   * @param {Array<Object>} results - Prediction results
   * @param {Array<Object>} votes - Sorted votes
   * @returns {Object} Consensus analysis
   */
  static _analyzeConsensus(results, votes) {
    const topDiseaseId = votes[0].classId;
    const topVotes = votes[0].voteScore;
    const totalImages = results.length;

    // Calculate agreement percentage
    const topPredictionsCount = results.filter(
      (r) => r.topPrediction.classId === topDiseaseId
    ).length;

    const agreementPercent = (topPredictionsCount / totalImages) * 100;

    // Identify disagreements
    const disagreements = results
      .filter((r) => r.topPrediction.classId !== topDiseaseId)
      .map((r) => ({
        imageId: r.imageId,
        predictedClassId: r.topPrediction.classId,
        predictedDisease: r.topPrediction.diseaseNameEn,
        confidence: r.topPrediction.confidence,
      }));

    // Determine consensus quality
    const hasConsensus = agreementPercent >= PREDICTION_CONFIG.CONSENSUS_THRESHOLD * 100;
    
    let confidence;
    if (agreementPercent >= 80) {
      confidence = 'high';
    } else if (agreementPercent >= 60) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      hasConsensus,
      agreementPercent,
      confidence,
      disagreements,
      topVotes,
      totalImages,
    };
  }

  /**
   * Calculate aggregated confidence score
   * @private
   * @param {Array<Object>} results - Prediction results
   * @param {number} diseaseId - Target disease class ID
   * @returns {number} Aggregated confidence
   */
  static _calculateAggregatedConfidence(results, diseaseId) {
    // Get confidence scores for this disease from all images
    const confidences = results
      .map((result) => {
        const pred = result.predictions.find((p) => p.classId === diseaseId);
        return pred ? pred.confidence : 0;
      })
      .filter((conf) => conf > 0);

    if (confidences.length === 0) {
      return 0;
    }

    // Use weighted average (give more weight to higher confidences)
    const sortedConfidences = confidences.sort((a, b) => b - a);
    const weights = sortedConfidences.map((_, i) => 1 / (i + 1)); // 1, 0.5, 0.33, 0.25, ...
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const weightedSum = sortedConfidences.reduce(
      (sum, conf, i) => sum + conf * weights[i],
      0
    );

    return weightedSum / totalWeight;
  }

  /**
   * Generate recommendations based on aggregated results
   * @private
   * @param {Object} data - Analysis data
   * @returns {Object} Recommendations
   */
  static _generateRecommendations(data) {
    const { isReliable, consensus, validResults, topDisease } = data;

    const recommendations = {
      primaryAction: null,
      secondaryActions: [],
      warnings: [],
    };

    // High confidence consensus
    if (isReliable && consensus.confidence === 'high') {
      if (topDisease.classId === 0) {
        // Healthy
        recommendations.primaryAction = 'continue_monitoring';
        recommendations.secondaryActions.push('maintain_good_practices');
      } else {
        // Disease detected
        recommendations.primaryAction = 'immediate_treatment';
        recommendations.secondaryActions.push('consult_expert', 'prevent_spread');
        
        if (topDisease.severity === 'severe' || topDisease.severity === 'critical') {
          recommendations.warnings.push('high_severity_disease');
        }
      }
      return recommendations;
    }

    // Low consensus - conflicting predictions
    if (!isReliable || consensus.confidence === 'low') {
      recommendations.primaryAction = 'capture_more_images';
      recommendations.secondaryActions.push(
        'capture_different_angles',
        'improve_lighting',
        'consult_expert'
      );
      recommendations.warnings.push('inconsistent_predictions');
      return recommendations;
    }

    // Moderate consensus
    recommendations.primaryAction = 'monitor_closely';
    recommendations.secondaryActions.push(
      'capture_additional_images',
      'track_symptom_progression'
    );

    return recommendations;
  }

  /**
   * Compare individual results for consistency
   * @param {Array<Object>} imageResults - Prediction results
   * @returns {Object} Consistency analysis
   */
  static analyzeConsistency(imageResults) {
    if (imageResults.length < 2) {
      return { consistent: true, message: 'Only one image provided' };
    }

    const validResults = imageResults.filter((r) => !r.error);
    if (validResults.length < 2) {
      return { consistent: false, message: 'Not enough valid predictions' };
    }

    // Compare each pair
    const comparisons = [];
    for (let i = 0; i < validResults.length - 1; i++) {
      for (let j = i + 1; j < validResults.length; j++) {
        const comparison = DiseaseResultParser.compareResults(
          validResults[i],
          validResults[j]
        );
        comparisons.push(comparison);
      }
    }

    // Calculate overall consistency
    const consistentCount = comparisons.filter((c) => c.consistent).length;
    const consistencyPercent = (consistentCount / comparisons.length) * 100;

    return {
      consistent: consistencyPercent >= 70,
      consistencyPercent,
      comparisons,
      message: consistencyPercent >= 70
        ? 'Predictions are consistent across images'
        : 'Predictions vary significantly - more images recommended',
    };
  }

  /**
   * Format aggregated results for UI display
   * @param {Object} aggregatedResult - Aggregated prediction
   * @param {string} language - Display language
   * @returns {Object} Formatted result
   */
  static formatForDisplay(aggregatedResult, language = 'ur') {
    const { consensusDisease, consensus, alternativeDiseases } = aggregatedResult;

    return {
      primaryDisease: {
        name: language === 'en'
          ? consensusDisease.disease.nameEn
          : consensusDisease.disease.nameUr,
        confidence: Math.round(consensusDisease.confidence * 100),
        confidenceLevel: consensusDisease.confidenceLevel,
        imagesInAgreement: consensus.hasConsensus
          ? `${Math.round(consensus.agreementPercent)}%`
          : 'Low agreement',
      },
      alternatives: alternativeDiseases.map((alt) => ({
        name: language === 'en' ? alt.disease.nameEn : alt.disease.nameUr,
        confidence: Math.round(alt.confidence * 100),
      })),
      reliability: {
        isReliable: consensus.isReliable,
        confidenceLabel: consensus.confidence,
        agreementPercent: Math.round(consensus.agreementPercent),
      },
      summary: aggregatedResult.recommendations,
    };
  }
}

export default MultiImageAnalyzer;

