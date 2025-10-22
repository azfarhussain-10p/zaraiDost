// Gemini Vision Provider
// Story 3.3: Cloud-Based Enhanced Analysis
// Integrates Gemini Vision API as alternative to GPT-4 Vision

import { CLOUD_PROVIDERS, PROMPT_TEMPLATES } from '../../constants/CloudAnalysisConstants';
import { DISEASE_CLASSES } from '../../constants/DiseaseClasses';

/**
 * GeminiVisionProvider
 * Handles communication with Gemini Vision API via backend
 *
 * NOTE: This is a client-side adapter that calls the backend API.
 * The backend should implement actual Gemini Vision integration.
 */
class GeminiVisionProvider {
  constructor() {
    this.providerName = CLOUD_PROVIDERS.GEMINI_VISION;
    this.backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    // Mock mode for development
    this.mockMode = true; // TODO: Set to false when backend is implemented
  }

  /**
   * Analyze single image
   * @param {string} imageUrl - S3 URL or image identifier
   * @param {object} context - Analysis context
   * @returns {Promise<object>} Analysis result
   */
  async analyze(imageUrl, context = {}) {
    console.log('[GeminiVisionProvider] Analyzing single image');

    if (this.mockMode) {
      return this._mockAnalyze(imageUrl, context);
    }

    try {
      const response = await fetch(`${this.backendUrl}/cloud-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          context,
          provider: this.providerName,
          singleImage: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const result = await response.json();
      return this._parseResponse(result);
    } catch (error) {
      console.error('[GeminiVisionProvider] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze multiple images
   * @param {string[]} imageUrls - Array of S3 URLs
   * @param {object} context - Analysis context
   * @returns {Promise<object>} Aggregated analysis result
   */
  async analyzeMultiple(imageUrls, context = {}) {
    console.log('[GeminiVisionProvider] Analyzing multiple images');
    console.log('[GeminiVisionProvider] Image count:', imageUrls.length);

    if (this.mockMode) {
      return this._mockAnalyzeMultiple(imageUrls, context);
    }

    try {
      const response = await fetch(`${this.backendUrl}/cloud-analysis/analyze-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls,
          context,
          provider: this.providerName,
          multiImage: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const result = await response.json();
      return this._parseResponse(result);
    } catch (error) {
      console.error('[GeminiVisionProvider] Multi-image analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse response from Gemini Vision
   * @private
   */
  _parseResponse(response) {
    if (!response || !response.predictions) {
      throw new Error('Invalid response format from Gemini Vision');
    }

    return {
      provider: this.providerName,
      predictions: response.predictions || [],
      reasoning: response.reasoning || '',
      severity: response.severity || 'unknown',
      confidence: response.confidence || 0,
      visualIndicators: response.visualIndicators || [],
      urgency: response.urgency || 'medium',
      multiImageConsensus: response.multiImageConsensus || false,
      treatmentSummary: response.treatmentSummary || '',
      rawResponse: response,
    };
  }

  /**
   * Mock analyze for development
   * @private
   */
  async _mockAnalyze(imageUrl, context) {
    console.log('[GeminiVisionProvider] MOCK MODE: Simulating Gemini Vision analysis');

    // Simulate slightly faster API delay than GPT-4 (1.5-4 seconds)
    await this._delay(1500 + Math.random() * 2500);

    const onDevicePred = context.onDevicePrediction;
    let primaryDisease;

    if (onDevicePred && onDevicePred.diseaseId) {
      primaryDisease = DISEASE_CLASSES.find(d => d.id === onDevicePred.diseaseId);
    }

    if (!primaryDisease) {
      const cropDiseases = DISEASE_CLASSES.filter(d =>
        d.affectedCrops.includes(context.cropType?.toLowerCase())
      );
      primaryDisease = cropDiseases[Math.floor(Math.random() * cropDiseases.length)] ||
        DISEASE_CLASSES[1];
    }

    // Gemini typically has similar confidence to GPT-4
    const baseConfidence = onDevicePred?.confidence || 0.7;
    const cloudConfidence = Math.min(0.97, baseConfidence + 0.05 + Math.random() * 0.12);

    const predictions = [
      {
        rank: 1,
        diseaseId: primaryDisease.id,
        diseaseName: primaryDisease.nameEn,
        diseaseNameLocal: primaryDisease.nameUr,
        category: primaryDisease.category,
        severity: primaryDisease.severity,
        confidence: cloudConfidence,
        confidencePercent: Math.round(cloudConfidence * 100),
      },
      ...this._generateAlternativePredictions(context.cropType, primaryDisease.id, 2),
    ];

    return {
      provider: this.providerName,
      predictions,
      reasoning: `Gemini Vision analysis identifies ${primaryDisease.nameEn} based on comprehensive visual pattern recognition. The observed symptoms and disease progression are consistent with ${primaryDisease.category} pathology.`,
      severity: primaryDisease.severity,
      confidence: cloudConfidence,
      visualIndicators: [
        'Disease signature detected in image analysis',
        'Symptom distribution pattern identified',
        'Severity level assessed from visual cues',
      ],
      urgency: this._mapSeverityToUrgency(primaryDisease.severity),
      multiImageConsensus: false,
      treatmentSummary: `Treatment with ${primaryDisease.category}-specific measures recommended. Consult local agricultural extension for product recommendations.`,
      mock: true,
    };
  }

  /**
   * Mock analyze multiple for development
   * @private
   */
  async _mockAnalyzeMultiple(imageUrls, context) {
    console.log('[GeminiVisionProvider] MOCK MODE: Simulating Gemini Vision multi-image analysis');

    await this._delay(2500 + Math.random() * 3500);

    const singleResult = await this._mockAnalyze(imageUrls[0], context);

    const enhancedPredictions = singleResult.predictions.map(pred => ({
      ...pred,
      confidence: Math.min(0.98, pred.confidence + 0.04),
      confidencePercent: Math.min(98, pred.confidencePercent + 4),
    }));

    return {
      ...singleResult,
      predictions: enhancedPredictions,
      imageCount: imageUrls.length,
      multiImageConsensus: true,
      reasoning: `Multi-image analysis using Gemini Vision across ${imageUrls.length} images reveals consistent disease patterns, providing higher diagnostic accuracy through cross-image validation.`,
    };
  }

  /**
   * Generate alternative predictions
   * @private
   */
  _generateAlternativePredictions(cropType, excludeDiseaseId, count = 2) {
    const alternatives = DISEASE_CLASSES
      .filter(d => d.id !== excludeDiseaseId && d.affectedCrops.includes(cropType?.toLowerCase()))
      .slice(0, count);

    return alternatives.map((disease, index) => ({
      rank: index + 2,
      diseaseId: disease.id,
      diseaseName: disease.nameEn,
      diseaseNameLocal: disease.nameUr,
      category: disease.category,
      severity: disease.severity,
      confidence: 0.25 - (index * 0.08),
      confidencePercent: Math.round((0.25 - (index * 0.08)) * 100),
    }));
  }

  /**
   * Map severity to urgency
   * @private
   */
  _mapSeverityToUrgency(severity) {
    const severityMap = {
      mild: 'low',
      moderate: 'medium',
      severe: 'high',
      critical: 'critical',
    };
    return severityMap[severity] || 'medium';
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if provider is available
   * @returns {Promise<boolean>}
   */
  async checkAvailability() {
    if (this.mockMode) {
      return true;
    }

    try {
      const response = await fetch(`${this.backendUrl}/cloud-analysis/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default GeminiVisionProvider;
