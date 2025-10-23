// Supplier List Screen
// Story 3.5: Local Supplier Integration
// Main screen showing list of suppliers for a product or general search

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import SupplierCard from '../../components/supplier/SupplierCard';
import SupplierSearchService from '../../services/supplier/SupplierSearchService';
import LocationService from '../../services/image/LocationService';
import { SORT_OPTIONS, SEARCH_RADIUS } from '../../constants/SupplierConstants';

/**
 * SupplierListScreen
 * Lists suppliers with search and filter capabilities
 *
 * Props/Route Params:
 * - productId: Optional product ID to filter suppliers
 * - farmerId: Farmer ID for favorites and tracking
 * - initialLocation: Initial location (optional, will fetch if not provided)
 * - navigation: Navigation object for routing
 */
const SupplierListScreen = ({ route, navigation }) => {
  const { productId = null, farmerId = 'farmer-001', initialLocation = null } = route?.params || {};

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DISTANCE);
  const [radiusKm, setRadiusKm] = useState(SEARCH_RADIUS.FAR);

  const searchService = new SupplierSearchService();
  const locationService = new LocationService();

  useEffect(() => {
    loadSuppliers();
  }, [productId, sortBy, radiusKm]);

  const loadSuppliers = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get location if not already available
      let currentLocation = location;
      if (!currentLocation) {
        try {
          currentLocation = await locationService.getCurrentLocation();
          setLocation(currentLocation);
        } catch (locError) {
          console.warn('[SupplierList] Location not available:', locError);
          // Continue without location - will show all suppliers without distance
        }
      }

      let results;

      if (productId) {
        // Search for suppliers carrying specific product
        results = await searchService.findSuppliersForProduct(
          productId,
          currentLocation || { latitude: 31.5497, longitude: 74.3436 }, // Default to Lahore
          radiusKm,
          farmerId
        );
      } else {
        // General supplier search
        results = await searchService.findNearestSuppliers(
          currentLocation || { latitude: 31.5497, longitude: 74.3436 },
          radiusKm,
          farmerId
        );
      }

      // Sort results
      const sorted = searchService.sortSuppliers(results, sortBy);
      setSuppliers(sorted);

      if (sorted.length === 0) {
        setError('No suppliers found nearby. Try expanding the search radius.');
      }
    } catch (err) {
      console.error('[SupplierList] Error loading suppliers:', err);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSuppliers(true);
  };

  const handleSupplierPress = (supplier) => {
    navigation.navigate('SupplierDetail', {
      supplier,
      farmerId,
      productId,
    });
  };

  const handleExpandRadius = () => {
    const newRadius = radiusKm === SEARCH_RADIUS.FAR
      ? SEARCH_RADIUS.VERY_FAR
      : SEARCH_RADIUS.EXTENDED;
    setRadiusKm(newRadius);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        {productId ? 'Suppliers for Product' : 'Nearby Suppliers'}
      </Text>
      <Text style={styles.subtitle}>
        {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} within {radiusKm}km
      </Text>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === SORT_OPTIONS.DISTANCE && styles.sortButtonActive]}
          onPress={() => setSortBy(SORT_OPTIONS.DISTANCE)}
        >
          <Text style={[styles.sortButtonText, sortBy === SORT_OPTIONS.DISTANCE && styles.sortButtonTextActive]}>
            Distance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === SORT_OPTIONS.RATING && styles.sortButtonActive]}
          onPress={() => setSortBy(SORT_OPTIONS.RATING)}
        >
          <Text style={[styles.sortButtonText, sortBy === SORT_OPTIONS.RATING && styles.sortButtonTextActive]}>
            Rating
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === SORT_OPTIONS.FAVORITES_FIRST && styles.sortButtonActive]}
          onPress={() => setSortBy(SORT_OPTIONS.FAVORITES_FIRST)}
        >
          <Text style={[styles.sortButtonText, sortBy === SORT_OPTIONS.FAVORITES_FIRST && styles.sortButtonTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏪</Text>
      <Text style={styles.emptyTitle}>No Suppliers Found</Text>
      <Text style={styles.emptyMessage}>{error || 'Try adjusting your search criteria'}</Text>
      {radiusKm < SEARCH_RADIUS.EXTENDED && (
        <TouchableOpacity style={styles.expandButton} onPress={handleExpandRadius}>
          <Text style={styles.expandButtonText}>Expand Search Radius</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSupplier = ({ item }) => (
    <SupplierCard
      supplier={item}
      farmerId={farmerId}
      onPress={() => handleSupplierPress(item)}
      showAvailability={!!productId}
      showDistance={!!location}
      showFavorite={true}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding nearby suppliers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
          />
        }
        contentContainerStyle={suppliers.length === 0 ? styles.emptyContainer : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  expandButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  expandButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SupplierListScreen;
