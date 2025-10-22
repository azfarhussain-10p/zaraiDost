// Result Comparison Service
// Story 3.3: Cloud-Based Enhanced Analysis
// AC4: Results compare on-device vs cloud predictions if different
// AC7: User notified when cloud provides different/updated diagnosis

import {
  COMPARISON_CONFIG,
  AGREEMENT_LEVELS,
  NOTIFICATION_CONFIG,
} from '../../constants/CloudAnalysisConstants';

/**
 * ResultComparison
 * Compares on-device and cloud analysis results
 * Determines agreement level and generates user notifications
 */
class ResultComparison {
  /**
   * Compare on-device and cloud results
   * AC4: Results compare on-device vs cloud predictions if different
   *
   * @param {object} onDeviceResult - Result from Story 3.2 (TensorFlow Lite)
   * @param {object} cloudResult - Result from cloud vision AI
   * @returns {object} Comparison analysis
   */
  static compare(onDeviceResult, cloudResult) {
    try {
      console.log('[ResultComparison] Comparing results...');

      // Handle missing results
      if (!onDeviceResult && !cloudResult) {
        return this._createEmptyComparison();
      }

      if (!onDeviceResult) {
        return this._createCloudOnlyComparison(cloudResult);
      }

      if (!cloudResult) {
        return this._createOnDeviceOnlyComparison(onDeviceResult);
      }

      // Get top predictions
      const onDeviceTop = this._getTopPrediction(onDeviceResult);
      const cloudTop = this._getTopPrediction(cloudResult);

      if (!onDeviceTop || !cloudTop) {
        console.warn('[ResultComparison] Missing top predictions');
        return this._createEmptyComparison();
      }

      // Check if top diseases match
      const topDiseaseMatch = onDeviceTop.diseaseId === cloudTop.diseaseId;

      // Calculate confidence difference
      const confidenceDelta = Math.abs(
        cloudTop.confidence - onDeviceTop.confidence
      );

      // Check if cloud result is in on-device top 3
      const cloudInOnDeviceTop3 = this._isInTopPredictions(
        cloudTop.diseaseId,
        onDeviceResult.predictions || onDeviceResult.results,
        3
      );

      // Check if on-device result is in cloud top 3
      const onDeviceInCloudTop3 = this._isInTopPredictions(
        onDeviceTop.diseaseId,
        cloudResult.predictions,
        3
      );

      // Calculate agreement score
      const agreementScore = this._calculateAgreementScore(
        topDiseaseMatch,
        confidenceDelta,
        cloudInOnDeviceTop3,
        onDeviceInCloudTop3
      );

      // Determine agreement level
      const agreementLevel = this._determineAgreementLevel(agreementScore);

      // Check if results are significantly different
      const isDifferent = !topDiseaseMatch || confidenceDelta > COMPARISON_CONFIG.SIGNIFICANT_CONFIDENCE_DELTA;

      // Determine if cloud has higher confidence
      const cloudMoreConfident = cloudTop.confidence > onDeviceTop.confidence;
      const confidenceImprovement = cloudTop.confidence - onDeviceTop.confidence;

      // Generate recommendation
      const recommendation = this._generateRecommendation(
        topDiseaseMatch,
        agreementScore,
        cloudMoreConfident,
        confidenceImprovement
      );

      // Determine if user should be notified (AC7)
      const shouldNotifyUser = this._shouldNotifyUser(
        isDifferent,
        agreementScore,
        confidenceImprovement,
        cloudResult.urgency
      );

      // Create comparison result
      const comparison = {
        // Core comparison
        topDiseaseMatch,
        agreementScore,
        agreementLevel,
        isDifferent,

        // Confidence analysis
        cloudMoreConfident,
        confidenceImprovement,
        confidenceDelta,

        // Predictions
        onDeviceTop,
        cloudTop,

        // Cross-validation
        cloudInOnDeviceTop3,
        onDeviceInCloudTop3,

        // Recommendations
        recommendation,
        shouldNotifyUser,

        // Additional metadata
        timestamp: new Date().toISOString(),
        comparisonType: 'on-device-vs-cloud',
      };

      console.log('[ResultComparison] Comparison complete:', {
        topDiseaseMatch,
        agreementScore,
        shouldNotifyUser,
      });

      return comparison;
    } catch (error) {
      console.error('[ResultComparison] Comparison failed:', error);
      return this._createErrorComparison(error);
    }
  }

  /**
   * Get top prediction from result
   * @private
   */
  static _getTopPrediction(result) {
    if (!result) return null;

    // Handle different result formats
    if (result.topPrediction) {
      return result.topPrediction;
    }

    if (result.predictions && result.predictions.length > 0) {
      return result.predictions[0];
    }

    if (result.results && result.results.length > 0) {
      return result.results[0];
    }

    return null;
  }

  /**
   * Check if disease ID is in top N predictions
   * @private
   */
  static _isInTopPredictions(diseaseId, predictions, topN = 3) {
    if (!predictions || predictions.length === 0) {
      return false;
    }

    return predictions
      .slice(0, topN)
      .some(pred => pred.diseaseId === diseaseId);
  }

  /**
   * Calculate agreement score (0-100)
   * @private
   */
  static _calculateAgreementScore(
    topDiseaseMatch,
    confidenceDelta,
    cloudInOnDeviceTop3,
    onDeviceInCloudTop3
  ) {
    let score = 0;

    if (topDiseaseMatch) {
      // Perfect match: base score 70, bonus for low confidence delta
      score = 70 + (30 * (1 - confidenceDelta));
    } else if (cloudInOnDeviceTop3 || onDeviceInCloudTop3) {
      // In top 3: medium agreement
      score = 50 - (confidenceDelta * 20);
    } else {
      // No match: low agreement
      score = Math.max(0, 20 - (confidenceDelta * 50));
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Determine agreement level from score
   * @private
   */
  static _determineAgreementLevel(agreementScore) {
    if (agreementScore >= COMPARISON_CONFIG.HIGH_AGREEMENT_THRESHOLD) {
      return AGREEMENT_LEVELS.HIGH;
    } else if (agreementScore >= COMPARISON_CONFIG.MEDIUM_AGREEMENT_THRESHOLD) {
      return AGREEMENT_LEVELS.MEDIUM;
    } else {
      return AGREEMENT_LEVELS.LOW;
    }
  }

  /**
   * Generate recommendation text
   * @private
   */
  static _generateRecommendation(
    topDiseaseMatch,
    agreementScore,
    cloudMoreConfident,
    confidenceImprovement
  ) {
    if (topDiseaseMatch) {
      if (cloudMoreConfident && confidenceImprovement > 0.15) {
        return 'Cloud analysis confirms diagnosis with significantly higher confidence. Proceed with recommended treatment.';
      } else if (agreementScore >= COMPARISON_CONFIG.HIGH_AGREEMENT_THRESHOLD) {
        return 'Cloud analysis confirms on-device diagnosis. High confidence in the result.';
      } else {
        return 'Cloud analysis confirms the disease but with different confidence levels. Review both results.';
      }
    } else if (agreementScore >= COMPARISON_CONFIG.MEDIUM_AGREEMENT_THRESHOLD) {
      return 'Cloud analysis suggests a different primary diagnosis, but both diseases are in top predictions. Consider expert consultation.';
    } else {
      return 'Cloud analysis provides a significantly different diagnosis. Expert review strongly recommended.';
    }
  }

  /**
   * Determine if user should be notified
   * AC7: User notified when cloud provides different/updated diagnosis
   * @private
   */
  static _shouldNotifyUser(isDifferent, agreementScore, confidenceImprovement, urgency) {
    if (!NOTIFICATION_CONFIG.ENABLED) {
      return false;
    }

    // Always notify for critical urgency
    if (NOTIFICATION_CONFIG.SHOW_FOR_CRITICAL_URGENCY && urgency === 'critical') {
      return true;
    }

    // Notify for different disease
    if (NOTIFICATION_CONFIG.SHOW_FOR_DIFFERENT_DISEASE && isDifferent) {
      return true;
    }

    // Notify for high confidence improvement
    if (
      NOTIFICATION_CONFIG.SHOW_FOR_HIGH_CONFIDENCE_IMPROVEMENT &&
      confidenceImprovement > 0.2
    ) {
      return true;
    }

    // Notify for low agreement (conflicting diagnoses)
    if (agreementScore < COMPARISON_CONFIG.NOTIFY_USER_THRESHOLD) {
      return true;
    }

    return false;
  }

  /**
   * Format comparison for UI display
   * @param {object} comparison - Comparison result
   * @returns {object} UI-friendly format
   */
  static formatForUI(comparison) {
    if (!comparison) {
      return null;
    }

    return {
      // Summary
      summary: {
        agreementLevel: comparison.agreementLevel,
        agreementScore: comparison.agreementScore,
        recommendation: comparison.recommendation,
        shouldNotifyUser: comparison.shouldNotifyUser,
      },

      // Predictions comparison
      predictions: {
        onDevice: {
          disease: comparison.onDeviceTop?.diseaseName || 'Unknown',
          diseaseLocal: comparison.onDeviceTop?.diseaseNameLocal,
          confidence: comparison.onDeviceTop?.confidencePercent || 0,
          severity: comparison.onDeviceTop?.severity,
        },
        cloud: {
          disease: comparison.cloudTop?.diseaseName || 'Unknown',
          diseaseLocal: comparison.cloudTop?.diseaseNameLocal,
          confidence: comparison.cloudTop?.confidencePercent || 0,
          severity: comparison.cloudTop?.severity,
        },
      },

      // Visual indicators
      indicators: {
        match: comparison.topDiseaseMatch,
        cloudBetter: comparison.cloudMoreConfident,
        improvement: Math.round(comparison.confidenceImprovement * 100),
        differenceLevel: comparison.isDifferent ? 'significant' : 'minor',
      },

      // User action
      userAction: comparison.shouldNotifyUser
        ? 'Review cloud analysis results'
        : 'No action needed',
    };
  }

  /**
   * Create empty comparison (no results available)
   * @private
   */
  static _createEmptyComparison() {
    return {
      topDiseaseMatch: null,
      agreementScore: 0,
      agreementLevel: AGREEMENT_LEVELS.NONE,
      isDifferent: false,
      cloudMoreConfident: false,
      confidenceImprovement: 0,
      confidenceDelta: 0,
      onDeviceTop: null,
      cloudTop: null,
      recommendation: 'No results available for comparison',
      shouldNotifyUser: false,
      timestamp: new Date().toISOString(),
      comparisonType: 'empty',
    };
  }

  /**
   * Create cloud-only comparison
   * @private
   */
  static _createCloudOnlyComparison(cloudResult) {
    const cloudTop = this._getTopPrediction(cloudResult);

    return {
      topDiseaseMatch: false,
      agreementScore: 0,
      agreementLevel: AGREEMENT_LEVELS.NONE,
      isDifferent: true,
      cloudMoreConfident: true,
      confidenceImprovement: cloudTop?.confidence || 0,
      confidenceDelta: cloudTop?.confidence || 0,
      onDeviceTop: null,
      cloudTop,
      recommendation: 'Cloud analysis completed without on-device result. Use cloud diagnosis.',
      shouldNotifyUser: true,
      timestamp: new Date().toISOString(),
      comparisonType: 'cloud-only',
    };
  }

  /**
   * Create on-device-only comparison
   * @private
   */
  static _createOnDeviceOnlyComparison(onDeviceResult) {
    const onDeviceTop = this._getTopPrediction(onDeviceResult);

    return {
      topDiseaseMatch: false,
      agreementScore: 0,
      agreementLevel: AGREEMENT_LEVELS.NONE,
      isDifferent: false,
      cloudMoreConfident: false,
      confidenceImprovement: 0,
      confidenceDelta: 0,
      onDeviceTop,
      cloudTop: null,
      recommendation: 'Using on-device result. Cloud analysis not available.',
      shouldNotifyUser: false,
      timestamp: new Date().toISOString(),
      comparisonType: 'on-device-only',
    };
  }

  /**
   * Create error comparison
   * @private
   */
  static _createErrorComparison(error) {
    return {
      topDiseaseMatch: false,
      agreementScore: 0,
      agreementLevel: AGREEMENT_LEVELS.NONE,
      isDifferent: false,
      cloudMoreConfident: false,
      confidenceImprovement: 0,
      confidenceDelta: 0,
      onDeviceTop: null,
      cloudTop: null,
      recommendation: 'Comparison failed due to error',
      shouldNotifyUser: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      comparisonType: 'error',
    };
  }

  /**
   * Generate notification message
   * AC7: User notified when cloud provides different/updated diagnosis
   *
   * @param {object} comparison - Comparison result
   * @returns {object} Notification data
   */
  static generateNotification(comparison) {
    if (!comparison || !comparison.shouldNotifyUser) {
      return null;
    }

    let title = '';
    let message = '';
    let priority = 'normal';

    if (comparison.agreementLevel === AGREEMENT_LEVELS.LOW) {
      title = 'Different Diagnosis from Cloud Analysis';
      message = `Cloud AI suggests ${comparison.cloudTop?.diseaseName} instead of ${comparison.onDeviceTop?.diseaseName}. Please review.`;
      priority = 'high';
    } else if (comparison.confidenceImprovement > 0.2) {
      title = 'Higher Confidence Diagnosis Available';
      message = `Cloud analysis confirms ${comparison.cloudTop?.diseaseName} with ${comparison.cloudTop?.confidencePercent}% confidence (improved from ${comparison.onDeviceTop?.confidencePercent}%).`;
      priority = 'medium';
    } else {
      title = 'Cloud Analysis Complete';
      message = comparison.recommendation;
      priority = 'normal';
    }

    return {
      title,
      message,
      priority,
      timestamp: comparison.timestamp,
      comparisonData: comparison,
    };
  }
}

export default ResultComparison;
