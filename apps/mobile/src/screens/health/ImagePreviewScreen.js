// Image Preview Screen
// Story 3.1: Image Capture and Upload Interface
// AC3: Image preview with retake/confirm options
// AC6: Multiple images uploadable for same crop issue (max 5)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ImageValidator from '../../services/image/ImageValidator';
import LocationService from '../../services/image/LocationService';
import { GALLERY_SETTINGS } from '../../constants/ImageQualityConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_PREVIEW_SIZE = SCREEN_WIDTH - 40;

/**
 * ImagePreviewScreen Component
 * 
 * Features:
 * - Display captured/selected images
 * - Image carousel for multiple images
 * - Retake/Remove options
 * - Full validation display
 * - GPS location display
 * - Confirm and proceed to submission
 */
const ImagePreviewScreen = ({ navigation, route }) => {
  const { images = [], captureMode = 'camera' } = route.params || {};

  const [imageList, setImageList] = useState(images);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validationResults, setValidationResults] = useState([]);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validateAllImages();
  }, [imageList]);

  const validateAllImages = async () => {
    setIsValidating(true);

    try {
      const results = await Promise.all(
        imageList.map(async (img) => {
          const result = await ImageValidator.validate({
            uri: img.uri,
            width: img.width,
            height: img.height,
            type: img.type || 'image/jpeg',
            fileSize: img.fileSize,
          });
          return result;
        })
      );

      setValidationResults(results);
      console.log('[ImagePreview] Validation complete:', {
        total: results.length,
        valid: results.filter((r) => r.isValid).length,
        warnings: results.filter((r) => r.warnings.length > 0).length,
      });
    } catch (error) {
      console.error('[ImagePreview] Validation failed:', error);
      Alert.alert('Validation Error', 'Failed to validate images. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveImage = (index) => {
    Alert.alert(
      'Remove Image?',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImageList = imageList.filter((_, i) => i !== index);
            setImageList(newImageList);

            if (newImageList.length === 0) {
              navigation.goBack();
            } else if (currentIndex >= newImageList.length) {
              setCurrentIndex(newImageList.length - 1);
            }
          },
        },
      ]
    );
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleConfirm = () => {
    const invalidImages = validationResults.filter((r) => !r.isValid);

    if (invalidImages.length > 0) {
      Alert.alert(
        'Invalid Images',
        `${invalidImages.length} of ${imageList.length} images failed validation. Remove invalid images or retake.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove Invalid',
            onPress: () => {
              const validImages = imageList.filter((_, index) => validationResults[index].isValid);
              if (validImages.length > 0) {
                setImageList(validImages);
                Alert.alert('Invalid Images Removed', 'Proceed with valid images?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Proceed', onPress: proceedToSubmission },
                ]);
              } else {
                Alert.alert('No Valid Images', 'All images failed validation. Please retake.');
              }
            },
          },
        ]
      );
      return;
    }

    // Check for warnings
    const imagesWithWarnings = validationResults.filter((r) => r.warnings.length > 0);

    if (imagesWithWarnings.length > 0) {
      Alert.alert(
        'Image Quality Warnings',
        `${imagesWithWarnings.length} images have quality warnings (e.g., slightly blurry). Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: proceedToSubmission },
        ]
      );
      return;
    }

    proceedToSubmission();
  };

  const proceedToSubmission = () => {
    // Navigate to health check submission screen
    navigation.navigate('HealthCheckSubmission', {
      images: imageList,
      validationResults,
    });
  };

  const renderImageThumbnail = ({ item, index }) => {
    const isSelected = index === currentIndex;
    const validation = validationResults[index];

    return (
      <TouchableOpacity
        style={[styles.thumbnail, isSelected && styles.thumbnailSelected]}
        onPress={() => setCurrentIndex(index)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
        {validation && !validation.isValid && (
          <View style={styles.thumbnailErrorBadge}>
            <Text style={styles.thumbnailErrorText}>!</Text>
          </View>
        )}
        {validation && validation.warnings.length > 0 && validation.isValid && (
          <View style={styles.thumbnailWarningBadge}>
            <Text style={styles.thumbnailWarningText}>⚠</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const currentImage = imageList[currentIndex];
  const currentValidation = validationResults[currentIndex];

  if (imageList.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No images to preview</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake}>
          <Text style={styles.headerButton}>← Retake</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Image {currentIndex + 1} of {imageList.length}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveImage(currentIndex)}>
          <Text style={[styles.headerButton, styles.headerButtonDanger]}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Main Image Display */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: currentImage.uri }}
          style={styles.mainImage}
          resizeMode="contain"
        />

        {/* Validation Indicator */}
        {isValidating && (
          <View style={styles.validatingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.validatingText}>Validating quality...</Text>
          </View>
        )}

        {!isValidating && currentValidation && (
          <View style={styles.validationBadge}>
            {currentValidation.isValid ? (
              <Text style={styles.validationGood}>✓ Good Quality</Text>
            ) : (
              <Text style={styles.validationBad}>✗ Quality Issue</Text>
            )}
          </View>
        )}
      </View>

      {/* Image Details */}
      {!isValidating && currentValidation && (
        <View style={styles.detailsContainer}>
          {/* Resolution */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Resolution:</Text>
            <Text style={styles.detailValue}>
              {currentImage.width} × {currentImage.height}
            </Text>
          </View>

          {/* Location */}
          {currentImage.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>
                {LocationService.formatLocation(currentImage.location)}
              </Text>
            </View>
          )}

          {/* Quality Score */}
          {currentValidation.qualityScore !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quality Score:</Text>
              <Text style={styles.detailValue}>
                {(currentValidation.qualityScore * 100).toFixed(0)}%
              </Text>
            </View>
          )}

          {/* Errors */}
          {currentValidation.errors.length > 0 && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Errors:</Text>
              {currentValidation.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error.message}
                </Text>
              ))}
            </View>
          )}

          {/* Warnings */}
          {currentValidation.warnings.length > 0 && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>Warnings:</Text>
              {currentValidation.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  • {warning.message}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Thumbnail Strip */}
      {imageList.length > 1 && (
        <View style={styles.thumbnailContainer}>
          <FlatList
            data={imageList}
            renderItem={renderImageThumbnail}
            keyExtractor={(item, index) => `image-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleRetake}
        >
          <Text style={styles.actionButtonTextSecondary}>Add More Images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonPrimary,
            (isValidating || imageList.length === 0) && styles.actionButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={isValidating || imageList.length === 0}
        >
          <Text style={styles.actionButtonText}>
            Confirm ({imageList.length}/{GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  headerButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerButtonDanger: {
    color: '#F44336',
  },
  headerTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainImage: {
    width: IMAGE_PREVIEW_SIZE,
    height: IMAGE_PREVIEW_SIZE,
    borderRadius: 8,
  },
  validatingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  validatingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  validationBadge: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  validationGood: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  validationBad: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 4,
  },
  errorTitle: {
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
  },
  warningContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 4,
  },
  warningTitle: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#FFC107',
    fontSize: 12,
  },
  thumbnailContainer: {
    paddingVertical: 10,
  },
  thumbnailList: {
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#4CAF50',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  thumbnailErrorBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailErrorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  thumbnailWarningBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailWarningText: {
    color: '#000',
    fontSize: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextSecondary: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
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

export default ImagePreviewScreen;

