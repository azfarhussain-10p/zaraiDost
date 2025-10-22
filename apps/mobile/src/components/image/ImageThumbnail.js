// ImageThumbnail.js
// Story 1.4: Offline Image Processing Queue
// Implements: Task 5 (UI components for image display)

import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SyncStatusBadge from './SyncStatusBadge';

/**
 * ImageThumbnail
 *
 * Reusable component for displaying image thumbnails with metadata.
 * Shows thumbnail, sync status, confidence score, and disease info.
 *
 * Props:
 * - image: Image object from database
 * - size: Thumbnail size ('small', 'medium', 'large')
 * - showStatus: Whether to show sync status badge
 * - onPress: Callback when thumbnail is pressed
 * - showDetails: Whether to show disease and confidence info
 */
const ImageThumbnail = ({
  image,
  size = 'medium',
  showStatus = true,
  onPress = null,
  showDetails = false,
}) => {
  // Determine size dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 80 };
      case 'large':
        return { width: 150, height: 150 };
      case 'medium':
      default:
        return { width: 120, height: 120 };
    }
  };

  // Get disease name from analysis result
  const getDiseaseName = () => {
    try {
      if (!image.analysis_result_json) return null;

      const analysis =
        typeof image.analysis_result_json === 'string'
          ? JSON.parse(image.analysis_result_json)
          : image.analysis_result_json;

      if (Array.isArray(analysis) && analysis.length > 0) {
        return analysis[0].class || analysis[0].disease;
      }

      return analysis.disease || analysis.class || null;
    } catch (error) {
      console.error('[ImageThumbnail] Error parsing analysis:', error);
      return null;
    }
  };

  // Get confidence score
  const getConfidence = () => {
    if (image.confidence_score) {
      return `${(image.confidence_score * 100).toFixed(0)}%`;
    }
    return null;
  };

  // Format disease name for display
  const formatDiseaseName = (name) => {
    if (!name) return 'Unknown';
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const sizeStyles = getSizeStyles();
  const diseaseName = getDiseaseName();
  const confidence = getConfidence();

  const content = (
    <View style={[styles.container, sizeStyles]}>
      {/* Thumbnail Image */}
      <Image
        source={{
          uri: image.thumbnail_path || image.local_file_path || image.remote_url,
        }}
        style={[styles.image, sizeStyles]}
        resizeMode="cover"
      />

      {/* Sync Status Badge */}
      {showStatus && (
        <View style={styles.statusBadge}>
          <SyncStatusBadge status={image.sync_status} compact />
        </View>
      )}

      {/* Details Overlay */}
      {showDetails && diseaseName && (
        <View style={styles.detailsOverlay}>
          <Text style={styles.diseaseName} numberOfLines={1}>
            {formatDiseaseName(diseaseName)}
          </Text>
          {confidence && <Text style={styles.confidence}>{confidence}</Text>}
        </View>
      )}

      {/* Upload Error Indicator */}
      {image.sync_status === 'failed' && (
        <View style={styles.errorIndicator}>
          <Ionicons name="warning" size={20} color="#fff" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(image)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    borderRadius: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  detailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
  },
  diseaseName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  confidence: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  errorIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageThumbnail;
