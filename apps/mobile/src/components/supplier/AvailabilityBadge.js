// Availability Badge Component
// Story 3.5: Local Supplier Integration
// Displays product availability status with color coding

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_INDICATORS,
  AVAILABILITY_CONFIDENCE,
  CONFIDENCE_INDICATORS,
} from '../../constants/SupplierConstants';
import AvailabilityTracker from '../../services/supplier/AvailabilityTracker';

/**
 * AvailabilityBadge Component
 * Shows availability status with color-coded badge
 *
 * Props:
 * - status: Availability status (in_stock, low_stock, out_of_stock, unknown)
 * - lastUpdated: Timestamp of last update (optional)
 * - showConfidence: Whether to show confidence indicator (default: false)
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 */
const AvailabilityBadge = ({
  status = AVAILABILITY_STATUS.UNKNOWN,
  lastUpdated = null,
  showConfidence = false,
  size = 'medium',
  language = 'en',
}) => {
  const availabilityTracker = new AvailabilityTracker();

  // Get indicator config
  const indicator = AVAILABILITY_INDICATORS[status] || AVAILABILITY_INDICATORS[AVAILABILITY_STATUS.UNKNOWN];

  // Get confidence if available
  let confidence = null;
  if (showConfidence && lastUpdated) {
    const confidenceData = availabilityTracker.getAvailabilityConfidence(lastUpdated);
    confidence = confidenceData;
  }

  // Get label based on language
  const getLabel = () => {
    switch (language) {
      case 'ur':
        return indicator.labelUr;
      case 'pa':
        return indicator.labelPa;
      case 'sd':
        return indicator.labelSd;
      default:
        return indicator.label;
    }
  };

  // Size styles
  const sizeStyles = {
    small: {
      fontSize: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
    },
    medium: {
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    large: {
      fontSize: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 5,
    },
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.badge,
        { backgroundColor: indicator.color },
        sizeStyles[size],
      ]}>
        <Text style={[styles.icon, { fontSize: sizeStyles[size].fontSize }]}>
          {indicator.icon}
        </Text>
        <Text style={[styles.label, { fontSize: sizeStyles[size].fontSize }]}>
          {getLabel()}
        </Text>
      </View>

      {showConfidence && confidence && (
        <View style={styles.confidenceContainer}>
          <Text style={[
            styles.confidenceText,
            { color: CONFIDENCE_INDICATORS[confidence.level]?.color || '#9E9E9E' }
          ]}>
            {confidence.daysOld !== null ? `${confidence.daysOld}d ago` : 'Unknown'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 4,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confidenceContainer: {
    marginLeft: 6,
  },
  confidenceText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default AvailabilityBadge;
