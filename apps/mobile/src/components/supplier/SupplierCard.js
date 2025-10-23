// Supplier Card Component
// Story 3.5: Local Supplier Integration
// Displays supplier information in a card format

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AvailabilityBadge from './AvailabilityBadge';
import FavoriteToggleButton from './FavoriteToggleButton';
import { SUPPLIER_TYPE_LABELS } from '../../constants/SupplierConstants';
import SupplierSearchService from '../../services/supplier/SupplierSearchService';

/**
 * SupplierCard Component
 * Card showing supplier information with distance, availability, and favorite
 *
 * Props:
 * - supplier: Supplier object
 * - farmerId: Farmer ID for favorites
 * - onPress: Callback when card is pressed
 * - showAvailability: Show availability badge (default: false)
 * - showDistance: Show distance (default: true)
 * - showFavorite: Show favorite button (default: true)
 * - language: Language for labels (default: 'en')
 */
const SupplierCard = ({
  supplier,
  farmerId,
  onPress = null,
  showAvailability = false,
  showDistance = true,
  showFavorite = true,
  language = 'en',
}) => {
  const searchService = new SupplierSearchService();

  const getSupplierTypeLabel = () => {
    const typeLabel = SUPPLIER_TYPE_LABELS[supplier.type];
    if (!typeLabel) return supplier.type;
    return typeLabel[language] || typeLabel.en;
  };

  const formatDistance = () => {
    if (!supplier.distanceKm) return null;
    return searchService.formatDistance(supplier.distanceKm);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {supplier.name}
          </Text>
          <View style={styles.metadata}>
            <Text style={styles.type}>{getSupplierTypeLabel()}</Text>
            {supplier.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {showFavorite && (
          <FavoriteToggleButton
            supplierId={supplier.id}
            farmerId={farmerId}
            initialIsFavorite={supplier.isFavorite || false}
            size="medium"
          />
        )}
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.address} numberOfLines={2}>
          {supplier.address}
          {supplier.city && `, ${supplier.city}`}
        </Text>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        {/* Distance */}
        {showDistance && supplier.distanceKm !== null && supplier.distanceKm !== undefined && (
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚗</Text>
            <Text style={styles.infoText}>{formatDistance()}</Text>
          </View>
        )}

        {/* Phone */}
        {supplier.phone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {supplier.phone}
            </Text>
          </View>
        )}

        {/* Rating */}
        {supplier.rating > 0 && (
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⭐</Text>
            <Text style={styles.infoText}>
              {supplier.rating.toFixed(1)} ({supplier.totalRatings})
            </Text>
          </View>
        )}
      </View>

      {/* Availability Badge */}
      {showAvailability && supplier.availabilityStatus && (
        <View style={styles.availabilityRow}>
          <AvailabilityBadge
            status={supplier.availabilityStatus}
            lastUpdated={supplier.lastUpdated}
            showConfidence={true}
            size="small"
            language={language}
          />
          {supplier.estimatedPricePkr && (
            <Text style={styles.price}>
              PKR {supplier.estimatedPricePkr}
            </Text>
          )}
        </View>
      )}

      {/* Business Hours */}
      {supplier.businessHours && (
        <View style={styles.hoursRow}>
          <Text style={styles.hoursIcon}>🕒</Text>
          <Text style={styles.hoursText}>{supplier.businessHours}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  type: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#4CAF50',
  },
  verifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressIcon: {
    fontSize: 14,
    marginRight: 6,
    marginTop: 2,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  hoursIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  hoursText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default SupplierCard;
