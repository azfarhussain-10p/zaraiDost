// Camera Screen
// Story 3.1: Image Capture and Upload Interface
// AC1: Camera interface accessible from main dashboard
// AC2: Photo capture with crop type selection (dropdown or voice)
// AC3: Image preview with retake/confirm options

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LocationService from '../../services/image/LocationService';
import ImageValidator from '../../services/image/ImageValidator';
import { GALLERY_SETTINGS } from '../../constants/ImageQualityConstants';

// Platform-specific imports
let Camera = null;
let CameraType = null;
let FlashMode = null;
let ImagePicker = null;

if (Platform.OS !== 'web') {
  const ExpoCamera = require('expo-camera');
  Camera = ExpoCamera.Camera;
  CameraType = ExpoCamera.CameraType;
  FlashMode = ExpoCamera.FlashMode;
  ImagePicker = require('expo-image-picker');
}

/**
 * CameraScreen Component
 * 
 * Features:
 * - Camera capture with quality settings
 * - Front/back camera toggle
 * - Flash control
 * - Gallery selection (up to 5 images)
 * - GPS location capture
 * - Image quality validation
 * - Navigation to preview screen
 */
const CameraScreen = ({ navigation, route }) => {
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType?.back);
  const [flashMode, setFlashMode] = useState(FlashMode?.off);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera Unavailable', 'Camera is not available on web platform.');
      return;
    }

    if (!Camera) {
      Alert.alert('Camera Unavailable', 'Camera module is not available.');
      return;
    }

    // Request camera permission
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Zarai Dost needs camera access to capture photos of your crops for disease detection.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Request location permission (optional)
    const locationResult = await LocationService.requestPermissions();
    setHasLocationPermission(locationResult.granted);

    if (!locationResult.granted) {
      Alert.alert(
        'Location Permission',
        'Location helps provide region-specific crop advice. Continue without GPS?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => console.log('User opted to continue without GPS') },
        ]
      );
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    // Check image limit
    const limitCheck = ImageValidator.checkImageLimit(
      capturedImages.length,
      1,
      GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK
    );

    if (!limitCheck.valid) {
      Alert.alert('Image Limit Reached', limitCheck.message);
      return;
    }

    try {
      setIsCapturing(true);

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      console.log('[CameraScreen] Photo captured:', {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
      });

      // Capture GPS location
      const location = await LocationService.getCurrentLocation();

      // Quick validation
      const quickValidation = ImageValidator.quickValidate({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        type: 'image/jpeg',
      });

      if (!quickValidation.isValid) {
        Alert.alert(
          'Image Quality Issue',
          quickValidation.errors.map((e) => e.message).join('\n'),
          [{ text: 'Retry', onPress: () => setIsCapturing(false) }]
        );
        return;
      }

      // Navigate to preview screen
      navigation.navigate('ImagePreview', {
        images: [
          ...capturedImages,
          {
            ...photo,
            location,
            validationResult: quickValidation,
          },
        ],
        captureMode: 'camera',
      });

      setCapturedImages([...capturedImages, photo]);
    } catch (error) {
      console.error('[CameraScreen] Capture failed:', error);
      Alert.alert('Capture Failed', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      Alert.alert('Gallery Unavailable', 'Gallery picker is not available on this platform.');
      return;
    }

    // Check image limit
    const remainingSlots = GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK - capturedImages.length;

    if (remainingSlots === 0) {
      Alert.alert(
        'Image Limit Reached',
        `Maximum ${GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK} images allowed. Remove an image to add another.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`[CameraScreen] Selected ${result.assets.length} images from gallery`);

        // Quick validate all selected images
        const validationResults = await ImageValidator.validateMultiple(result.assets);

        const invalidImages = validationResults.filter((v) => !v.isValid);

        if (invalidImages.length > 0) {
          Alert.alert(
            'Some Images Invalid',
            `${invalidImages.length} of ${result.assets.length} images failed validation. Continue with valid images?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Continue',
                onPress: () => {
                  const validImages = result.assets.filter((_, index) => validationResults[index].isValid);
                  navigateToPreviewWithImages(validImages);
                },
              },
            ]
          );
        } else {
          navigateToPreviewWithImages(result.assets);
        }
      }
    } catch (error) {
      console.error('[CameraScreen] Gallery picker failed:', error);
      Alert.alert('Gallery Error', 'Failed to open gallery. Please try again.');
    }
  };

  const navigateToPreviewWithImages = (images) => {
    navigation.navigate('ImagePreview', {
      images: [...capturedImages, ...images],
      captureMode: 'gallery',
    });

    setCapturedImages([...capturedImages, ...images]);
  };

  const toggleCameraType = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const toggleFlashMode = () => {
    setFlashMode((current) => {
      if (current === FlashMode.off) return FlashMode.on;
      if (current === FlashMode.on) return FlashMode.auto;
      return FlashMode.off;
    });
  };

  const getFlashIcon = () => {
    if (flashMode === FlashMode.on) return '⚡';
    if (flashMode === FlashMode.auto) return '⚡A';
    return '⚡✕';
  };

  // Platform check
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>Camera is not available on web platform.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Permission check
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>No access to camera</Text>
        <Text style={styles.instructionText}>
          Please grant camera permission in your device settings.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlashMode}
          >
            <Text style={styles.controlIcon}>{getFlashIcon()}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Gallery Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickFromGallery}
          >
            <Text style={styles.secondaryButtonText}>📁</Text>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Flip Camera Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={toggleCameraType}
          >
            <Text style={styles.secondaryButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Image Counter */}
        {capturedImages.length > 0 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {capturedImages.length}/{GALLERY_SETTINGS.MAX_IMAGES_PER_HEALTH_CHECK}
            </Text>
          </View>
        )}

        {/* GPS Indicator */}
        {hasLocationPermission && (
          <View style={styles.gpsIndicator}>
            <Text style={styles.gpsIndicatorText}>📍 GPS</Text>
          </View>
        )}
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 28,
  },
  imageCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gpsIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gpsIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unavailableText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
  },
  backButton: {
    marginTop: 40,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen;

