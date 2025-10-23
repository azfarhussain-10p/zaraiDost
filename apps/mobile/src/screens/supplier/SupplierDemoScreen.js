// Supplier Demo Screen
// Story 3.5: Local Supplier Integration
// Demo/Test screen for supplier functionality

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { initDatabase } from '../../database/config/db.config';
import SupplierDataSeeder from '../../services/supplier/SupplierDataSeeder';
import SupplierSearchService from '../../services/supplier/SupplierSearchService';
import SupplierCard from '../../components/supplier/SupplierCard';

/**
 * SupplierDemoScreen
 * Demonstrates and tests supplier functionality
 *
 * Features:
 * - Initialize database
 * - Seed sample data
 * - Search suppliers
 * - View supplier list
 */
const SupplierDemoScreen = ({ navigation }) => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dataSeeded, setDataSeeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState('Ready to initialize');

  const seeder = new SupplierDataSeeder();
  const searchService = new SupplierSearchService();

  const farmerId = 'demo-farmer-001';
  const lahoreLat = 31.5497;
  const lahoreLon = 74.3436;

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      await initDatabase();
      setDbInitialized(true);
      setStatus('Database initialized');

      const seeded = await seeder.isSeeded();
      setDataSeeded(seeded);

      if (seeded) {
        setStatus('Database initialized and seeded');
        await loadSuppliers();
      }
    } catch (error) {
      console.error('[SupplierDemo] Error checking database:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleInitializeDatabase = async () => {
    try {
      setLoading(true);
      setStatus('Initializing database...');

      await initDatabase();
      setDbInitialized(true);
      setStatus('Database initialized successfully');

      Alert.alert('Success', 'Database initialized');
    } catch (error) {
      console.error('[SupplierDemo] Error initializing database:', error);
      Alert.alert('Error', `Failed to initialize database: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setStatus('Seeding sample data...');

      const result = await seeder.seedAll();

      setDataSeeded(true);
      setStatus(`Seeded: ${result.suppliers} suppliers, ${result.products} products`);

      Alert.alert(
        'Data Seeded',
        `Suppliers: ${result.suppliers}\nProducts: ${result.products}\nAlternatives: ${result.alternatives}`
      );

      await loadSuppliers();
    } catch (error) {
      console.error('[SupplierDemo] Error seeding data:', error);
      Alert.alert('Error', `Failed to seed data: ${error.message}`);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear Data',
      'This will delete all supplier data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setStatus('Clearing data...');

              await seeder.clearAll();

              setDataSeeded(false);
              setSuppliers([]);
              setStatus('All data cleared');

              Alert.alert('Success', 'All supplier data cleared');
            } catch (error) {
              console.error('[SupplierDemo] Error clearing data:', error);
              Alert.alert('Error', `Failed to clear data: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setStatus('Loading suppliers...');

      const results = await searchService.findNearestSuppliers(
        { latitude: lahoreLat, longitude: lahoreLon },
        50,
        farmerId
      );

      setSuppliers(results);
      setStatus(`Found ${results.length} suppliers`);
    } catch (error) {
      console.error('[SupplierDemo] Error loading suppliers:', error);
      setStatus(`Error loading suppliers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSupplierList = () => {
    navigation.navigate('SupplierList', {
      farmerId,
      initialLocation: { latitude: lahoreLat, longitude: lahoreLon },
    });
  };

  const handleViewSupplierDetail = (supplier) => {
    navigation.navigate('SupplierDetail', {
      supplier,
      farmerId,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Supplier Demo</Text>
        <Text style={styles.subtitle}>Story 3.5: Local Supplier Integration</Text>
      </View>

      {/* Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusText}>{status}</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Database</Text>
            <Text style={[styles.statusDot, dbInitialized && styles.statusDotActive]}>
              {dbInitialized ? '●' : '○'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Data Seeded</Text>
            <Text style={[styles.statusDot, dataSeeded && styles.statusDotActive]}>
              {dataSeeded ? '●' : '○'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusItemLabel}>Suppliers</Text>
            <Text style={styles.statusItemValue}>{suppliers.length}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, !dbInitialized && styles.buttonDisabled]}
          onPress={handleSeedData}
          disabled={!dbInitialized || loading}
        >
          <Text style={styles.buttonText}>
            {dataSeeded ? 'Re-seed Sample Data' : 'Seed Sample Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={loadSuppliers}
          disabled={!dataSeeded || loading}
        >
          <Text style={styles.buttonText}>Refresh Suppliers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleViewSupplierList}
          disabled={!dataSeeded || loading}
        >
          <Text style={styles.buttonText}>View Full Supplier List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleClearData}
          disabled={!dataSeeded || loading}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Suppliers Preview */}
      {suppliers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Nearby Suppliers ({suppliers.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tap any supplier to view details
          </Text>

          {suppliers.slice(0, 3).map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              farmerId={farmerId}
              onPress={() => handleViewSupplierDetail(supplier)}
              showDistance={true}
              showFavorite={true}
            />
          ))}

          {suppliers.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewSupplierList}
            >
              <Text style={styles.viewAllText}>
                View all {suppliers.length} suppliers →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusItemLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statusDot: {
    fontSize: 20,
    color: '#ccc',
  },
  statusDotActive: {
    color: '#4CAF50',
  },
  statusItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonDanger: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 32,
  },
});

export default SupplierDemoScreen;
