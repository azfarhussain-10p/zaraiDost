// Supplier Detail Screen
// Story 3.5: Local Supplier Integration
// Detailed view of supplier with all contact options and product information

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ContactButtons from '../../components/supplier/ContactButtons';
import FavoriteToggleButton from '../../components/supplier/FavoriteToggleButton';
import AvailabilityBadge from '../../components/supplier/AvailabilityBadge';
import SupplierRepository from '../../database/repositories/SupplierRepository';
import SupplierSearchService from '../../services/supplier/SupplierSearchService';
import { SUPPLIER_TYPE_LABELS, CONTACT_INTENT } from '../../constants/SupplierConstants';

/**
 * SupplierDetailScreen
 * Shows detailed information about a supplier
 *
 * Props/Route Params:
 * - supplier: Supplier object
 * - farmerId: Farmer ID
 * - productId: Optional product ID for context
 * - navigation: Navigation object
 */
const SupplierDetailScreen = ({ route, navigation }) => {
  const {
    supplier: initialSupplier,
    farmerId = 'farmer-001',
    productId = null,
  } = route?.params || {};

  const [supplier, setSupplier] = useState(initialSupplier);
  const [products, setProducts] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);

  const supplierRepo = new SupplierRepository();
  const searchService = new SupplierSearchService();

  useEffect(() => {
    if (productId) {
      loadAlternatives();
    }
  }, [productId]);

  const loadAlternatives = async () => {
    try {
      setLoading(true);
      const alts = await searchService.findAlternativesWithSuppliers(
        productId,
        { latitude: supplier.latitude, longitude: supplier.longitude },
        50
      );
      setAlternatives(alts);
    } catch (error) {
      console.error('[SupplierDetail] Error loading alternatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierTypeLabel = () => {
    const typeLabel = SUPPLIER_TYPE_LABELS[supplier.type];
    if (!typeLabel) return supplier.type;
    return typeLabel.en;
  };

  const formatDistance = () => {
    if (!supplier.distanceKm) return null;
    return searchService.formatDistance(supplier.distanceKm);
  };

  if (!supplier) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Supplier not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{supplier.name}</Text>
            <Text style={styles.type}>{getSupplierTypeLabel()}</Text>
          </View>
          <FavoriteToggleButton
            supplierId={supplier.id}
            farmerId={farmerId}
            initialIsFavorite={supplier.isFavorite || false}
            size="large"
            showLabel={true}
          />
        </View>

        {supplier.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
            <Text style={styles.verifiedText}>Verified Supplier</Text>
          </View>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        {/* Address */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Address</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>
              {supplier.address}
              {supplier.city && `\n${supplier.city}, ${supplier.province}`}
            </Text>
          </View>
        </View>

        {/* Distance & Rating */}
        <View style={styles.infoGrid}>
          {supplier.distanceKm !== null && supplier.distanceKm !== undefined && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Distance</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🚗</Text>
                <Text style={styles.infoValue}>{formatDistance()}</Text>
              </View>
            </View>
          )}

          {supplier.rating > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Rating</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>⭐</Text>
                <Text style={styles.infoValue}>
                  {supplier.rating.toFixed(1)} ({supplier.totalRatings} reviews)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Business Hours */}
        {supplier.businessHours && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Business Hours</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕒</Text>
              <Text style={styles.infoText}>{supplier.businessHours}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Product Availability */}
      {productId && supplier.availabilityStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Availability</Text>
          <View style={styles.availabilityCard}>
            <AvailabilityBadge
              status={supplier.availabilityStatus}
              lastUpdated={supplier.lastUpdated}
              showConfidence={true}
              size="large"
            />
            {supplier.estimatedPricePkr && (
              <Text style={styles.price}>PKR {supplier.estimatedPricePkr}</Text>
            )}
          </View>
        </View>
      )}

      {/* Alternative Products */}
      {alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternative Products Available</Text>
          {alternatives.map((alt, index) => (
            <View key={index} style={styles.alternativeCard}>
              <Text style={styles.alternativeName}>{alt.alternative_name}</Text>
              <Text style={styles.alternativeType}>
                {alt.equivalence_type.replace('_', ' ')}
              </Text>
              <Text style={styles.alternativeSuppliers}>
                Available at {alt.availableCount} nearby supplier{alt.availableCount !== 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Contact Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Supplier</Text>
        <ContactButtons
          supplier={supplier}
          farmerId={farmerId}
          productName={productId ? 'Selected Product' : null}
          intent={productId ? CONTACT_INTENT.CHECK_AVAILABILITY : CONTACT_INTENT.INQUIRY}
          layout="grid"
        />
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  type: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  verifiedIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 6,
  },
  verifiedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  alternativeCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  alternativeType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  alternativeSuppliers: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});

export default SupplierDetailScreen;
