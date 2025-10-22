// LastUpdatedLabel Component
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 6 (Last updated timestamp display)

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import StalenessDetector from '../../services/cache/StalenessDetector';

/**
 * Component to display last updated timestamp
 */
const LastUpdatedLabel = ({ lastUpdated, style = {} }) => {
  if (!lastUpdated) {
    return <Text style={[styles.text, style]}>Never updated</Text>;
  }

  const relativeTime = StalenessDetector.getRelativeTimeString(lastUpdated);

  return <Text style={[styles.text, style]}>Updated {relativeTime}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default LastUpdatedLabel;
