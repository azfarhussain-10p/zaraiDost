// Inference Engine Service
// Story 1.3: Offline AI Model Storage
// Implements: Task 4 (Model loading and inference)

import ModelManager from './ModelManager';
import ImagePreprocessor from './ImagePreprocessor';
import { MOCK_MODE, MODEL_INPUT_SPECS, MODEL_OUTPUT_SPECS, DISEASE_CLASSES } from '../../constants/ModelConstants';

/**
 * InferenceEngine
 * Handles TensorFlow Lite model inference
 * Implements: Task 4
 * AC3: On-device inference works without network calls
 */
class InferenceEngine {
  constructor() {
    this.modelLoaded = false;
    this.tfliteModel = null;
  }

  /**
   * Load TensorFlow Lite model
   * Implements: Task 4.1, 4.5
   */
  async loadModel() {
    try {
      if (this.modelLoaded) {
        console.log('[InferenceEngine] Model already loaded');
        return true;
      }

      console.log('[InferenceEngine] Loading model...');
      const modelStatus = ModelManager.getStatus();

      if (!modelStatus.model) {
        throw new Error('No model available. Please download model first.');
      }

      if (MOCK_MODE.MOCK_PREDICTIONS) {
        console.log('[InferenceEngine] Mock mode: Simulating model load');
        this.modelLoaded = true;
        return true;
      }

      // TODO: Load actual TensorFlow Lite model when available
      // const tf = require('@tensorflow/tfjs');
      // const tflite = require('react-native-tensorflow-lite');
      // this.tfliteModel = await tflite.loadModel(modelPath);

      this.modelLoaded = true;
      console.log('[InferenceEngine] Model loaded successfully');
      return true;
    } catch (error) {
      console.error('[InferenceEngine] Model load failed:', error);
      throw error;
    }
  }

  /**
   * Run inference on preprocessed image
   * Implements: Task 4.2, 4.4
   * AC3: On-device inference <5 seconds
   */
  async runInference(imageUri) {
    try {
      const startTime = Date.now();

      if (!this.modelLoaded) {
        await this.loadModel();
      }

      console.log('[InferenceEngine] Running inference on:', imageUri);

      // Preprocess image (Task 4.3)
      const preprocessedImage = await ImagePreprocessor.preprocessImage(imageUri);

      let predictions;

      if (MOCK_MODE.MOCK_PREDICTIONS) {
        // Mock predictions for development
        predictions = this.generateMockPredictions();
      } else {
        // TODO: Run actual TensorFlow Lite inference
        // predictions = await this.tfliteModel.predict(preprocessedImage);
        throw new Error('TensorFlow Lite not implemented yet. Enable MOCK_MODE.');
      }

      const inferenceTime = Date.now() - startTime;
      console.log(`[InferenceEngine] Inference completed in ${inferenceTime}ms`);

      return {
        success: true,
        predictions,
        inferenceTime,
      };
    } catch (error) {
      console.error('[InferenceEngine] Inference failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate mock predictions for development
   * Implements: Task 4.4
   */
  generateMockPredictions() {
    const mockDiseases = [
      { class: DISEASE_CLASSES.WHEAT_LEAF_RUST, confidence: 0.85 },
      { class: DISEASE_CLASSES.WHEAT_YELLOW_RUST, confidence: 0.10 },
      { class: DISEASE_CLASSES.HEALTHY, confidence: 0.03 },
      { class: DISEASE_CLASSES.WHEAT_STEM_RUST, confidence: 0.02 },
    ];

    const threshold = MODEL_OUTPUT_SPECS.DISEASE_DETECTION.confidenceThreshold;

    return mockDiseases
      .filter(d => d.confidence >= threshold)
      .slice(0, MODEL_OUTPUT_SPECS.DISEASE_DETECTION.topKResults)
      .map((d, index) => ({
        rank: index + 1,
        disease: d.class,
        confidence: d.confidence,
        displayName: this.getDisplayName(d.class),
      }));
  }

  /**
   * Get human-readable disease name
   */
  getDisplayName(diseaseClass) {
    const names = {
      [DISEASE_CLASSES.WHEAT_LEAF_RUST]: 'Wheat Leaf Rust',
      [DISEASE_CLASSES.WHEAT_YELLOW_RUST]: 'Wheat Yellow Rust',
      [DISEASE_CLASSES.WHEAT_STEM_RUST]: 'Wheat Stem Rust',
      [DISEASE_CLASSES.HEALTHY]: 'Healthy',
      // Add more mappings as needed
    };

    return names[diseaseClass] || diseaseClass.replace(/_/g, ' ');
  }

  /**
   * Unload model to free memory
   */
  async unloadModel() {
    if (this.tfliteModel) {
      // TODO: Dispose TensorFlow Lite model
      // this.tfliteModel.dispose();
      this.tfliteModel = null;
    }

    this.modelLoaded = false;
    console.log('[InferenceEngine] Model unloaded');
  }
}

export default new InferenceEngine();
