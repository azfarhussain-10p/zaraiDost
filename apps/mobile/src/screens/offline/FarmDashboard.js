// Farm Dashboard Screen
// Story 1.1: Local Data Storage Foundation
// Implements: Task 4.1 (Farm Dashboard showing fields and crops)
// AC4: App functions without internet for viewing historical data

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import FarmerRepository from '../../database/repositories/FarmerRepository';
import FieldRepository from '../../database/repositories/FieldRepository';
import CropRepository from '../../database/repositories/CropRepository';
import StorageManager from '../../utils/StorageManager';

export default function FarmDashboard({ navigation }) {
  const [farmer, setFarmer] = useState(null);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [stats, setStats] = useState(null);
  const [storage, setStorage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(true); // Default offline mode

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get or create default farmer
      let farmers = await FarmerRepository.findAll();
      
      if (farmers.length === 0) {
        // Create default farmer for demo
        const newFarmer = await FarmerRepository.create({
          name: 'محمد احمد (Demo Farmer)',
          phone: '+92-300-1234567',
          location: 'Lahore, Punjab',
          language_preference: 'ur',
        });
        farmers = [newFarmer];
      }
      
      const currentFarmer = farmers[0];
      setFarmer(currentFarmer);

      // Load fields and crops
      const farmerFields = await FieldRepository.findByFarmerId(currentFarmer.id);
      setFields(farmerFields);

      const farmerCrops = await CropRepository.findByFarmerId(currentFarmer.id);
      setCrops(farmerCrops);

      // Load statistics
      const farmerStats = await FarmerRepository.getStatistics(currentFarmer.id);
      setStats(farmerStats);

      // Load storage info
      const storageInfo = await StorageManager.getTotalStorage();
      setStorage(storageInfo);

    } catch (error) {
      console.error('[FarmDashboard] Load failed:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const createSampleField = async () => {
    try {
      console.log('[FarmDashboard] 🌾 Creating sample field...');
      await FieldRepository.create({
        farmer_id: farmer.id,
        name: `Field ${fields.length + 1}`,
        size_acres: 5,
        soil_type: 'loamy',
        location_gps: '31.5204,74.3587',
      });
      
      await loadDashboardData();
      console.log('[FarmDashboard] ✅ Sample field created successfully!');
      Alert.alert('Success', 'Sample field created');
    } catch (error) {
      console.error('[FarmDashboard] ❌ Failed to create field:', error);
      Alert.alert('Error', 'Failed to create field');
    }
  };

  const createSampleCrop = async () => {
    if (fields.length === 0) {
      console.log('[FarmDashboard] ⚠️ Please create a field first');
      Alert.alert('Notice', 'Please create a field first');
      return;
    }

    try {
      console.log('[FarmDashboard] 🌱 Creating sample crop...');
      await CropRepository.create({
        field_id: fields[0].id,
        crop_type: 'wheat',
        planting_date: new Date().toISOString(),
        status: 'planted',
      });
      
      await loadDashboardData();
      console.log('[FarmDashboard] ✅ Sample crop created successfully!');
      Alert.alert('Success', 'Sample crop created');
    } catch (error) {
      console.error('[FarmDashboard] ❌ Failed to create crop:', error);
      Alert.alert('Error', 'Failed to create crop');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Offline Indicator */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📱 Offline Mode - All data stored locally</Text>
        </View>
      )}

      {/* Farmer Info */}
      {farmer && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farmer Profile</Text>
          <Text style={styles.infoText}>Name: {farmer.name}</Text>
          <Text style={styles.infoText}>Phone: {farmer.phone}</Text>
          <Text style={styles.infoText}>Location: {farmer.location}</Text>
        </View>
      )}

      {/* Statistics */}
      {stats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farm Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.field_count}</Text>
              <Text style={styles.statLabel}>Fields</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.crop_count}</Text>
              <Text style={styles.statLabel}>Crops</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.query_count}</Text>
              <Text style={styles.statLabel}>Queries</Text>
            </View>
          </View>
        </View>
      )}

      {/* Fields List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fields ({fields.length})</Text>
          <TouchableOpacity onPress={createSampleField}>
            <Text style={styles.addButton}>+ Add Field</Text>
          </TouchableOpacity>
        </View>
        {fields.length === 0 ? (
          <Text style={styles.emptyText}>No fields yet. Add your first field!</Text>
        ) : (
          fields.map((field) => (
            <View key={field.id} style={styles.listItem}>
              <Text style={styles.listItemTitle}>{field.name}</Text>
              <Text style={styles.listItemDetail}>
                {field.size_acres} acres • {field.soil_type}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Crops List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Crops ({crops.length})</Text>
          <TouchableOpacity onPress={createSampleCrop}>
            <Text style={styles.addButton}>+ Add Crop</Text>
          </TouchableOpacity>
        </View>
        {crops.length === 0 ? (
          <Text style={styles.emptyText}>No crops yet. Add your first crop!</Text>
        ) : (
          crops.map((crop) => (
            <TouchableOpacity
              key={crop.id}
              style={styles.listItem}
              onPress={() => navigation.navigate('CropDetails', { cropId: crop.id })}
            >
              <Text style={styles.listItemTitle}>{crop.crop_type}</Text>
              <Text style={styles.listItemDetail}>
                Status: {crop.status} • Planted: {new Date(crop.planting_date).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Storage Info */}
      {storage && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Storage Usage</Text>
          <Text style={styles.infoText}>
            Used: {storage.totalMB.toFixed(2)} MB / {storage.limitMB} MB ({storage.percentageUsed}%)
          </Text>
          <Text style={styles.infoText}>
            Database: {storage.databaseMB.toFixed(2)} MB
          </Text>
        </View>
      )}

      {/* Navigation Buttons */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('QueryHistory')}
      >
        <Text style={styles.navButtonText}>View Query History</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Zarai Dost v1.0 - Offline-First Agriculture App</Text>
        <Text style={styles.footerText}>Story 1.1: Local Data Storage Foundation ✓</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  offlineBanner: {
    backgroundColor: '#fbbf24',
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#78350f',
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 14,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listItemDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  navButton: {
    backgroundColor: '#22c55e',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});

