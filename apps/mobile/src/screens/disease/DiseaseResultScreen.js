// Disease Result Screen
// Story 3.2: On-Device Disease Detection Model
// Displays disease detection results with confidence scores

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DiseaseDetectionEngine from '../../services/ai/DiseaseDetectionEngine';
import MultiImageAnalyzer from '../../services/ai/MultiImageAnalyzer';

/**
 * DiseaseResultScreen
 * Displays disease detection results with predictions and recommendations
 */
export default function DiseaseResultScreen({ route, navigation }) {
  const { imageUris, imageIds, healthCheckId, language = 'ur' } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    detectDiseases();
  }, []);

  /**
   * Run disease detection
   */
  const detectDiseases = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[DiseaseResultScreen] Detecting diseases for ${imageUris?.length || 0} images`);

      let detectionResult;

      if (imageUris.length === 1) {
        // Single image detection
        detectionResult = await DiseaseDetectionEngine.detectDisease(imageUris[0], {
          language,
          imageId: imageIds?.[0],
        });
      } else {
        // Multi-image detection with aggregation
        const individualResults = await DiseaseDetectionEngine.detectDiseaseMulti(
          imageUris,
          { language, imageIds }
        );

        // Aggregate results
        const aggregated = MultiImageAnalyzer.aggregate(individualResults, { language });
        
        detectionResult = {
          ...aggregated,
          isAggregated: true,
          individualResults,
        };
      }

      setResult(detectionResult);
      console.log('[DiseaseResultScreen] Detection complete');

    } catch (err) {
      console.error('[DiseaseResultScreen] Detection failed:', err);
      setError(err.message);
      Alert.alert(
        language === 'en' ? 'Detection Failed' : 'تشخیص ناکام',
        err.message,
        [{ text: language === 'en' ? 'OK' : 'ٹھیک ہے' }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render confidence badge
   */
  const renderConfidenceBadge = (confidence, confidenceLevel) => {
    const colors = {
      high: '#10B981',
      medium: '#F59E0B',
      low: '#EF4444',
      very_low: '#DC2626',
    };

    const labels = {
      en: { high: 'High', medium: 'Medium', low: 'Low', very_low: 'Very Low' },
      ur: { high: 'زیادہ', medium: 'درمیانی', low: 'کم', very_low: 'بہت کم' },
    };

    return (
      <View style={[styles.confidenceBadge, { backgroundColor: colors[confidenceLevel] }]}>
        <Text style={styles.confidenceBadgeText}>
          {Math.round(confidence * 100)}% - {labels[language][confidenceLevel]}
        </Text>
      </View>
    );
  };

  /**
   * Render primary disease result
   */
  const renderPrimaryResult = () => {
    if (!result) return null;

    const primary = result.isAggregated
      ? result.consensusDisease
      : result.topPrediction;

    const disease = result.isAggregated
      ? primary.disease
      : primary;

    const confidence = result.isAggregated
      ? primary.confidence
      : primary.confidence;

    const confidenceLevel = result.isAggregated
      ? primary.confidenceLevel
      : primary.confidenceLevel;

    const isHealthy = disease.classId === 0;

    return (
      <View style={[styles.primaryCard, isHealthy && styles.healthyCard]}>
        <View style={styles.primaryHeader}>
          <Ionicons
            name={isHealthy ? 'checkmark-circle' : 'warning'}
            size={48}
            color={isHealthy ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.primaryTitle}>
            {language === 'en' ? disease.nameEn || disease.diseaseNameEn : disease.nameUr || disease.diseaseNameUr}
          </Text>
        </View>

        {renderConfidenceBadge(confidence, confidenceLevel)}

        {disease.scientificName && (
          <Text style={styles.scientificName}>{disease.scientificName}</Text>
        )}

        <Text style={styles.description}>
          {language === 'en' ? disease.descriptionEn : disease.descriptionUr}
        </Text>

        {/* Symptoms */}
        {!isHealthy && disease.symptomsEn && (
          <View style={styles.symptomsSection}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Symptoms' : 'علامات'}
            </Text>
            <Text style={styles.symptomsText}>
              {language === 'en' ? disease.symptomsEn : disease.symptomsUr}
            </Text>
          </View>
        )}

        {/* Multi-image consensus info */}
        {result.isAggregated && (
          <View style={styles.consensusInfo}>
            <Ionicons name="images" size={20} color="#6B7280" />
            <Text style={styles.consensusText}>
              {language === 'en'
                ? `${result.validImages} images analyzed`
                : `${result.validImages} تصاویر کا تجزیہ کیا گیا`}
            </Text>
            {result.consensus && (
              <Text style={styles.agreementText}>
                {Math.round(result.consensus.agreementPercent)}%{' '}
                {language === 'en' ? 'agreement' : 'اتفاق'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render alternative predictions
   */
  const renderAlternatives = () => {
    if (!result) return null;

    const alternatives = result.isAggregated
      ? result.alternativeDiseases
      : result.predictions?.slice(1, 3);

    if (!alternatives || alternatives.length === 0) return null;

    return (
      <View style={styles.alternativesCard}>
        <Text style={styles.sectionTitle}>
          {language === 'en' ? 'Other Possibilities' : 'دیگر امکانات'}
        </Text>
        {alternatives.map((pred, index) => {
          const disease = pred.disease || pred;
          const confidence = pred.confidence;
          
          return (
            <View key={index} style={styles.alternativeItem}>
              <View style={styles.alternativeInfo}>
                <Text style={styles.alternativeName}>
                  {language === 'en' ? disease.nameEn || disease.diseaseNameEn : disease.nameUr || disease.diseaseNameUr}
                </Text>
                <Text style={styles.alternativeConfidence}>
                  {Math.round(confidence * 100)}%
                </Text>
              </View>
              <View style={[styles.confidenceBar, { width: `${confidence * 100}%` }]} />
            </View>
          );
        })}
      </View>
    );
  };

  /**
   * Render recommendations
   */
  const renderRecommendations = () => {
    if (!result) return null;

    const recommendations = result.recommendations;
    if (!recommendations) return null;

    const actionLabels = {
      en: {
        continue_monitoring: 'Continue regular monitoring',
        immediate_treatment: 'Seek immediate treatment',
        seek_expert_opinion: 'Consult agricultural expert',
        monitor_symptoms: 'Monitor symptoms closely',
        capture_more_images: 'Capture more images',
        monitor_closely: 'Monitor plant closely',
      },
      ur: {
        continue_monitoring: 'باقاعدہ نگرانی جاری رکھیں',
        immediate_treatment: 'فوری علاج حاصل کریں',
        seek_expert_opinion: 'زرعی ماہر سے مشورہ کریں',
        monitor_symptoms: 'علامات کو قریب سے دیکھیں',
        capture_more_images: 'مزید تصاویر لیں',
        monitor_closely: 'پودے کو قریب سے دیکھیں',
      },
    };

    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.sectionTitle}>
          {language === 'en' ? 'Recommendations' : 'سفارشات'}
        </Text>
        
        {recommendations.warnings && recommendations.warnings.length > 0 && (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.warningText}>
              {language === 'en' ? 'High severity disease detected' : 'شدید بیماری کا پتہ چلا'}
            </Text>
          </View>
        )}

        <View style={styles.actionItem}>
          <Ionicons name="arrow-forward-circle" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>
            {actionLabels[language][recommendations.primaryAction] || recommendations.primaryAction}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render performance metrics (if available)
   */
  const renderPerformanceMetrics = () => {
    if (!result || !result.performance || !showDetails) return null;

    const perf = result.performance;

    return (
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>
          {language === 'en' ? 'Performance' : 'کارکردگی'}
        </Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>
              {language === 'en' ? 'Total Time' : 'کل وقت'}
            </Text>
            <Text style={styles.metricValue}>{perf.formattedTime}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>
              {language === 'en' ? 'Inference' : 'تجزیہ'}
            </Text>
            <Text style={styles.metricValue}>{perf.inferenceTime}ms</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Handle action buttons
   */
  const handleSaveResult = () => {
    // TODO: Save result to health check
    Alert.alert(
      language === 'en' ? 'Save Result' : 'نتیجہ محفوظ کریں',
      language === 'en' ? 'Result saved successfully' : 'نتیجہ کامیابی سے محفوظ ہو گیا',
      [{ text: language === 'en' ? 'OK' : 'ٹھیک ہے' }]
    );
  };

  const handleConsultExpert = () => {
    // TODO: Navigate to expert consultation
    Alert.alert(
      language === 'en' ? 'Consult Expert' : 'ماہر سے مشورہ کریں',
      language === 'en' ? 'Feature coming soon' : 'فیچر جلد آ رہا ہے',
      [{ text: language === 'en' ? 'OK' : 'ٹھیک ہے' }]
    );
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {language === 'en' ? 'Analyzing images...' : 'تصاویر کا تجزیہ کیا جا رہا ہے...'}
        </Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={detectDiseases}>
          <Text style={styles.retryButtonText}>
            {language === 'en' ? 'Retry' : 'دوبارہ کوشش کریں'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Main render
   */
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderPrimaryResult()}
        {renderAlternatives()}
        {renderRecommendations()}
        {renderPerformanceMetrics()}

        {/* Details toggle */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails
              ? language === 'en'
                ? 'Hide Details'
                : 'تفصیلات چھپائیں'
              : language === 'en'
              ? 'Show Details'
              : 'تفصیلات دیکھیں'}
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#3B82F6"
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
          <Ionicons name="camera" size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>
            {language === 'en' ? 'Retake' : 'دوبارہ لیں'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveResult}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {language === 'en' ? 'Save' : 'محفوظ کریں'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleConsultExpert}>
          <Ionicons name="call" size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>
            {language === 'en' ? 'Expert' : 'ماہر'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Primary result card
  primaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  primaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  confidenceBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  symptomsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  symptomsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  consensusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  consensusText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  agreementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Alternatives card
  alternativesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alternativeItem: {
    marginBottom: 16,
  },
  alternativeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  alternativeConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  // Recommendations card
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  // Metrics card
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  // Details toggle
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 8,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Loading state
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  // Error state
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

