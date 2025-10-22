// CachedDataBanner Component
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 6 (Offline mode banner)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Banner to indicate when displaying cached/offline data
 */
const CachedDataBanner = ({ isOnline, message = null }) => {
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {message || 'Offline Mode - Showing cached data'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CachedDataBanner;
