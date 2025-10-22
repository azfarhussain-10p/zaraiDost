// GPT-4 Vision Provider
// Story 3.3: Cloud-Based Enhanced Analysis
// Integrates GPT-4 Vision API for enhanced disease detection

import { CLOUD_PROVIDERS, PROMPT_TEMPLATES } from '../../constants/CloudAnalysisConstants';
import { DISEASE_CLASSES } from '../../constants/DiseaseClasses';

/**
 * GPT4VisionProvider
 * Handles communication with GPT-4 Vision API via backend
 *
 * NOTE: This is a client-side adapter that calls the backend API.
 * The backend (apps/api) should implement the actual GPT-4 Vision integration
 * using the AI Wrapper and LangChain for security reasons (API keys on backend only).
 */
class GPT4VisionProvider {
  constructor() {
    this.providerName = CLOUD_PROVIDERS.GPT4_VISION;
    this.backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    // Mock mode for development (until backend is ready)
    this.mockMode = true; // TODO: Set to false when backend is implemented
  }

  /**
   * Analyze single image
   * @param {string} imageUrl - S3 URL or image identifier
   * @param {object} context - Analysis context
   * @returns {Promise<object>} Analysis result
   */
  async analyze(imageUrl, context = {}) {
    console.log('[GPT4VisionProvider] Analyzing single image');
    console.log('[GPT4VisionProvider] Context:', context);

    // Mock mode for development
    if (this.mockMode) {
      return this._mockAnalyze(imageUrl, context);
    }

    // TODO: Implement actual backend API call
    // POST /api/cloud-analysis/analyze
    // Body: { imageUrl, context, provider: 'gpt4-vision' }

    try {
      const response = await fetch(`${this.backendUrl}/cloud-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
          // 'Authorization': `Bearer ${authToken}`,
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
      console.error('[GPT4VisionProvider] Analysis failed:', error);
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
    console.log('[GPT4VisionProvider] Analyzing multiple images');
    console.log('[GPT4VisionProvider] Image count:', imageUrls.length);

    // Mock mode for development
    if (this.mockMode) {
      return this._mockAnalyzeMultiple(imageUrls, context);
    }

    // TODO: Implement actual backend API call
    // POST /api/cloud-analysis/analyze-multiple
    // Body: { imageUrls, context, provider: 'gpt4-vision' }

    try {
      const response = await fetch(`${this.backendUrl}/cloud-analysis/analyze-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
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
      console.error('[GPT4VisionProvider] Multi-image analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for single image
   * @private
   */
  _buildPrompt(context) {
    return PROMPT_TEMPLATES.SINGLE_IMAGE
      .replace('{cropType}', context.cropType || 'Unknown')
      .replace('{location}', context.location || 'Unknown')
      .replace('{description}', context.description || 'None')
      .replace('{onDevicePrediction}', this._formatOnDevicePrediction(context));
  }

  /**
   * Build analysis prompt for multiple images
   * @private
   */
  _buildMultiImagePrompt(context) {
    return PROMPT_TEMPLATES.MULTI_IMAGE
      .replace('{imageCount}', context.imageCount || 1)
      .replace('{cropType}', context.cropType || 'Unknown')
      .replace('{location}', context.location || 'Unknown')
      .replace('{description}', context.description || 'None')
      .replace('{onDevicePrediction}', this._formatOnDevicePrediction(context));
  }

  /**
   * Format on-device prediction for context
   * @private
   */
  _formatOnDevicePrediction(context) {
    if (!context.onDevicePrediction) {
      return 'None';
    }

    if (typeof context.onDevicePrediction === 'string') {
      return context.onDevicePrediction;
    }

    if (context.onDevicePrediction.diseaseName) {
      const pred = context.onDevicePrediction;
      return `${pred.diseaseName} (${pred.confidencePercent || pred.confidence * 100}% confidence)`;
    }

    return JSON.stringify(context.onDevicePrediction);
  }

  /**
   * Parse response from GPT-4 Vision
   * @private
   */
  _parseResponse(response) {
    // Response should already be formatted by backend
    // Just ensure it has the required structure

    if (!response || !response.predictions) {
      throw new Error('Invalid response format from GPT-4 Vision');
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
    console.log('[GPT4VisionProvider] MOCK MODE: Simulating GPT-4 Vision analysis');

    // Simulate API delay (2-5 seconds)
    await this._delay(2000 + Math.random() * 3000);

    // Get on-device prediction or random disease
    const onDevicePred = context.onDevicePrediction;
    let primaryDisease;

    if (onDevicePred && onDevicePred.diseaseId) {
      // Use similar disease from on-device prediction
      primaryDisease = DISEASE_CLASSES.find(d => d.id === onDevicePred.diseaseId);
    }

    if (!primaryDisease) {
      // Random disease from matching crop type
      const cropDiseases = DISEASE_CLASSES.filter(d =>
        d.affectedCrops.includes(context.cropType?.toLowerCase())
      );
      primaryDisease = cropDiseases[Math.floor(Math.random() * cropDiseases.length)] ||
        DISEASE_CLASSES[1];
    }

    // Simulate improved confidence from cloud (typically 5-15% higher)
    const baseConfidence = onDevicePred?.confidence || 0.7;
    const cloudConfidence = Math.min(0.98, baseConfidence + 0.05 + Math.random() * 0.10);

    // Mock predictions
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
      // Add 2 more alternative predictions
      ...this._generateAlternativePredictions(context.cropType, primaryDisease.id, 2),
    ];

    return {
      provider: this.providerName,
      predictions,
      reasoning: `Advanced analysis using GPT-4 Vision reveals characteristic patterns of ${primaryDisease.nameEn}. High-resolution image analysis shows visual indicators consistent with ${primaryDisease.category} infection.`,
      severity: primaryDisease.severity,
      confidence: cloudConfidence,
      visualIndicators: [
        'Leaf discoloration patterns detected',
        'Lesion morphology analyzed',
        'Disease progression stage identified',
      ],
      urgency: this._mapSeverityToUrgency(primaryDisease.severity),
      multiImageConsensus: false,
      treatmentSummary: `Immediate treatment recommended with appropriate ${primaryDisease.category} control measures.`,
      mock: true,
    };
  }

  /**
   * Mock analyze multiple for development
   * @private
   */
  async _mockAnalyzeMultiple(imageUrls, context) {
    console.log('[GPT4VisionProvider] MOCK MODE: Simulating GPT-4 Vision multi-image analysis');

    // Simulate longer analysis time for multiple images
    await this._delay(3000 + Math.random() * 4000);

    const singleResult = await this._mockAnalyze(imageUrls[0], context);

    // Enhance with multi-image confidence boost
    const enhancedPredictions = singleResult.predictions.map(pred => ({
      ...pred,
      confidence: Math.min(0.99, pred.confidence + 0.03), // Multi-image boost
      confidencePercent: Math.min(99, pred.confidencePercent + 3),
    }));

    return {
      ...singleResult,
      predictions: enhancedPredictions,
      imageCount: imageUrls.length,
      multiImageConsensus: true,
      reasoning: `Comprehensive analysis of ${imageUrls.length} images using GPT-4 Vision shows consistent disease patterns across all images, increasing diagnostic confidence.`,
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
      confidence: 0.3 - (index * 0.1), // Decreasing confidence
      confidencePercent: Math.round((0.3 - (index * 0.1)) * 100),
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
   * Delay helper for mocking
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

export default GPT4VisionProvider;
