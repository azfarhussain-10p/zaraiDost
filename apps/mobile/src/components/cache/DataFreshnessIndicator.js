// DataFreshnessIndicator Component
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 6 (Staleness indicator UI component)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StalenessDetector from '../../services/cache/StalenessDetector';

/**
 * Component to display data freshness indicator
 * Shows staleness badge with color coding and last updated time
 */
const DataFreshnessIndicator = ({ lastUpdated, isLive = false, showDetails = true }) => {
  const staleness = StalenessDetector.analyzeStaleness(lastUpdated);

  const getBadgeStyle = () => {
    return {
      ...styles.badge,
      backgroundColor: isLive ? '#10B981' : staleness.color,
    };
  };

  const badgeText = StalenessDetector.getBadgeText(lastUpdated, isLive);

  return (
    <View style={styles.container}>
      <View style={getBadgeStyle()}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>
      {showDetails && lastUpdated && (
        <Text style={styles.detailsText}>{staleness.message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default DataFreshnessIndicator;
