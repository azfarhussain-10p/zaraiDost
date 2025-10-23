// Favorite Toggle Button Component
// Story 3.5: Local Supplier Integration
// Toggle button for adding/removing supplier from favorites

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Animated } from 'react-native';
import FavoritesManager from '../../services/supplier/FavoritesManager';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../constants/SupplierConstants';

/**
 * FavoriteToggleButton Component
 * Heart button to toggle favorite status with animation
 *
 * Props:
 * - supplierId: Supplier ID
 * - farmerId: Farmer ID
 * - initialIsFavorite: Initial favorite status (default: false)
 * - onToggle: Callback when toggled (optional)
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - showLabel: Whether to show label (default: false)
 * - language: Language for messages (default: 'en')
 */
const FavoriteToggleButton = ({
  supplierId,
  farmerId,
  initialIsFavorite = false,
  onToggle = null,
  size = 'medium',
  showLabel = false,
  language = 'en',
}) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const favoritesManager = new FavoritesManager();

  // Animation value
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await favoritesManager.toggleFavorite(farmerId, supplierId);

      if (result.success) {
        const newIsFavorite = !isFavorite;
        setIsFavorite(newIsFavorite);
        animateHeart();

        // Show success message
        const message = newIsFavorite
          ? SUCCESS_MESSAGES.FAVORITE_ADDED[language] || SUCCESS_MESSAGES.FAVORITE_ADDED.en
          : SUCCESS_MESSAGES.FAVORITE_REMOVED[language] || SUCCESS_MESSAGES.FAVORITE_REMOVED.en;

        // Call callback if provided
        if (onToggle) {
          onToggle(newIsFavorite, result);
        }
      } else {
        // Handle error
        if (result.error === 'FAVORITE_LIMIT_REACHED') {
          Alert.alert(
            'Limit Reached',
            ERROR_MESSAGES.FAVORITE_LIMIT_REACHED[language] || ERROR_MESSAGES.FAVORITE_LIMIT_REACHED.en
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to update favorite');
        }
      }
    } catch (error) {
      console.error('[FavoriteToggle] Error:', error);
      Alert.alert('Error', 'Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { fontSize: 20, padding: 4 },
    medium: { fontSize: 28, padding: 8 },
    large: { fontSize: 36, padding: 12 },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <TouchableOpacity
      style={[styles.button, { padding: config.padding }]}
      onPress={handleToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[styles.heart, { fontSize: config.fontSize }]}>
          {isFavorite ? '❤️' : '🤍'}
        </Text>
      </Animated.View>
      {showLabel && (
        <Text style={styles.label}>
          {isFavorite ? 'Favorite' : 'Add to Favorites'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});

export default FavoriteToggleButton;
