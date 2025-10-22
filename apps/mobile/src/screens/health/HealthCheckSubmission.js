// Health Check Submission Screen
// Story 3.1: Image Capture and Upload Interface
// Final step: Submit health check with crop type and optional description

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import CropTypeSelector from '../../components/health/CropTypeSelector';
import HealthCheckRepository from '../../database/repositories/HealthCheckRepository';
import ImageRepository from '../../database/repositories/ImageRepository';
import LocationService from '../../services/image/LocationService';
import { HEALTH_CHECK_STATUS } from '../../constants/ImageQualityConstants';

/**
 * HealthCheckSubmission Screen
 * 
 * Final submission screen where user:
 * - Reviews captured images
 * - Selects crop type (dropdown or voice)
 * - Adds optional description
 * - Confirms submission
 * - Health check is saved to local database
 * - Images are queued for upload
 * - On-device analysis is triggered (Story 3.2)
 */
const HealthCheckSubmission = ({ navigation, route }) => {
  const { images = [], validationResults = [] } = route.params || {};

  const [selectedCropType, setSelectedCropType] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate crop type selection
    if (!selectedCropType) {
      Alert.alert('Crop Type Required', 'Please select a crop type before submitting.');
      return;
    }

    // Confirm submission
    Alert.alert(
      'Submit Health Check?',
      `Submit ${images.length} image(s) for ${selectedCropType} analysis?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitHealthCheck },
      ]
    );
  };

  const submitHealthCheck = async () => {
    setIsSubmitting(true);

    try {
      // Get farmer ID (TODO: From auth context or user session)
      const farmerId = 'farmer-001'; // Placeholder

      // Create health check record
      const healthCheckId = uuidv4();

      // Get location from first image or current location
      let location = images[0]?.location;
      if (!location) {
        location = await LocationService.getLocationWithFallback();
      }

      const healthCheck = await HealthCheckRepository.create({
        farmerId,
        cropType: selectedCropType,
        description: description.trim() || null,
        locationLatitude: location?.latitude || null,
        locationLongitude: location?.longitude || null,
        locationAccuracy: location?.accuracy || null,
      });

      console.log('[HealthCheckSubmission] Health check created:', healthCheck.id);

      // Save images to database
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const validation = validationResults[i];

        await ImageRepository.create({
          healthCheckId: healthCheck.id,
          localFilePath: image.uri,
          imageSequence: i + 1,
          width: image.width,
          height: image.height,
          fileSizeBytes: image.fileSize || null,
          qualityScore: validation?.qualityScore || null,
          blurScore: validation?.details?.blur?.score || null,
          hasGps: !!image.location,
          locationGps: image.location ? JSON.stringify(image.location) : null,
        });
      }

      // Update health check image count
      await HealthCheckRepository.updateImageCount(healthCheck.id, images.length);

      console.log('[HealthCheckSubmission] Images saved:', images.length);

      // Update status to analyzing
      await HealthCheckRepository.updateStatus(healthCheck.id, HEALTH_CHECK_STATUS.ANALYZING);

      // Success!
      setIsSubmitting(false);

      Alert.alert(
        'Health Check Submitted!',
        'Your images are being analyzed. You will receive results shortly.',
        [
          {
            text: 'View Results',
            onPress: () => {
              // Navigate to results screen (Story 3.2)
              navigation.navigate('FarmDashboard', {
                healthCheckId: healthCheck.id,
              });
            },
          },
        ]
      );

      // TODO: Trigger on-device analysis (Story 3.2 integration)
      // TODO: Queue images for S3 upload when online (Story 1.4 integration)
    } catch (error) {
      console.error('[HealthCheckSubmission] Submission failed:', error);
      setIsSubmitting(false);

      Alert.alert(
        'Submission Failed',
        'Failed to save health check. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No images to submit</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.buttonText}>Take Photos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Crop Health Check</Text>
        <Text style={styles.subtitle}>Review and submit your images</Text>
      </View>

      {/* Image Gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Captured Images ({images.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageCard}>
              <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
              <View style={styles.imageSequence}>
                <Text style={styles.imageSequenceText}>{index + 1}</Text>
              </View>
              {validationResults[index]?.warnings.length > 0 && (
                <View style={styles.imageWarningBadge}>
                  <Text style={styles.imageWarningText}>⚠</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Crop Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Crop Type <Text style={styles.required}>*</Text>
        </Text>
        <CropTypeSelector
          selectedCropType={selectedCropType}
          onSelectCropType={setSelectedCropType}
          language="ur"
          showVoiceInput={false}
        />
      </View>

      {/* Optional Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Description (Optional)
        </Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe the problem you're observing..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {description.length}/500
        </Text>
      </View>

      {/* Location Info */}
      {images[0]?.location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {LocationService.formatLocation(images[0].location)}
              </Text>
              {images[0].location.accuracy && (
                <Text style={styles.locationAccuracy}>
                  Accuracy: ±{Math.round(images[0].location.accuracy)}m
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedCropType || isSubmitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedCropType || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </>
        ) : (
          <Text style={styles.submitButtonText}>Submit for Analysis</Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      {!isSubmitting && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#F44336',
  },
  imageGallery: {
    flexDirection: 'row',
  },
  imageCard: {
    marginRight: 12,
    position: 'relative',
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  imageSequence: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSequenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageWarningBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFC107',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWarningText: {
    fontSize: 14,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HealthCheckSubmission;

