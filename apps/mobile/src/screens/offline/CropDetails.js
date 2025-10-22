// Crop Details Screen
// Story 1.1: Local Data Storage Foundation
// Implements: Task 4.3 (Crop Details screen with images and analysis history)
// AC4: App functions without internet for viewing historical data

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CropRepository from '../../database/repositories/CropRepository';
import FieldRepository from '../../database/repositories/FieldRepository';
import ImageRepository from '../../database/repositories/ImageRepository';

export default function CropDetails({ route, navigation }) {
  const { cropId } = route.params;
  const [crop, setCrop] = useState(null);
  const [field, setField] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadCropDetails();
  }, [cropId]);

  const loadCropDetails = async () => {
    try {
      // Load crop
      const cropData = await CropRepository.findById(cropId);
      setCrop(cropData);

      // Load field
      if (cropData) {
        const fieldData = await FieldRepository.findById(cropData.field_id);
        setField(fieldData);

        // Load images
        const cropImages = await ImageRepository.findByCropId(cropId);
        setImages(cropImages);
      }
    } catch (error) {
      console.error('[CropDetails] Load failed:', error);
      Alert.alert('Error', 'Failed to load crop details');
    }
  };

  const updateCropStatus = async (newStatus) => {
    try {
      await CropRepository.updateStatus(cropId, newStatus);
      await loadCropDetails();
      Alert.alert('Success', `Crop status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update crop status');
    }
  };

  if (!crop) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Crop Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crop Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{crop.crop_type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, styles.statusBadge]}>
            {crop.status}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Planted:</Text>
          <Text style={styles.value}>
            {crop.planting_date ? new Date(crop.planting_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        {crop.expected_harvest_date && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Expected Harvest:</Text>
            <Text style={styles.value}>
              {new Date(crop.expected_harvest_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Field Info Card */}
      {field && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Field Name:</Text>
            <Text style={styles.value}>{field.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Size:</Text>
            <Text style={styles.value}>{field.size_acres} acres</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Soil Type:</Text>
            <Text style={styles.value}>{field.soil_type}</Text>
          </View>
        </View>
      )}

      {/* Images Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Images ({images.length})</Text>
        {images.length === 0 ? (
          <Text style={styles.emptyText}>
            No images yet. Capture photos for health analysis.
          </Text>
        ) : (
          images.map((image) => (
            <View key={image.id} style={styles.imageItem}>
              <Text style={styles.imageText}>
                📷 Image - {new Date(image.timestamp).toLocaleDateString()}
              </Text>
              {image.analysis_result_json && (
                <Text style={styles.analysisText}>
                  ✓ Analysis complete ({(image.confidence_score * 100).toFixed(0)}% confidence)
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Status Update Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update Status</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateCropStatus('growing')}
          >
            <Text style={styles.actionButtonText}>Growing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateCropStatus('mature')}
          >
            <Text style={styles.actionButtonText}>Mature</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.harvestButton]}
            onPress={() => updateCropStatus('harvested')}
          >
            <Text style={styles.actionButtonText}>Harvested</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.syncStatusCard}>
        <Text style={styles.syncText}>
          Sync Status: {crop.sync_status === 'pending' ? '⏳ Pending' : '✓ Synced'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    color: '#22c55e',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  imageItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  imageText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 12,
    color: '#22c55e',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  harvestButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncStatusCard: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#78350f',
  },
});

