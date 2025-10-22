// WeatherForecast Screen
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 6 (7-day weather forecast display)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import WeatherCacheService from '../../services/cache/WeatherCacheService';
import CacheRefreshOrchestrator from '../../services/cache/CacheRefreshOrchestrator';
import DataFreshnessIndicator from '../../components/cache/DataFreshnessIndicator';
import CachedDataBanner from '../../components/cache/CachedDataBanner';
import LastUpdatedLabel from '../../components/cache/LastUpdatedLabel';
import NetworkMonitor from '../../services/sync/NetworkMonitor';

/**
 * 7-day weather forecast screen with offline cache support
 */
const WeatherForecast = ({ locationId = 'lahore_punjab' }) => {
  const [forecast, setForecast] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadForecast();
    checkNetworkStatus();

    // Set up network status monitoring
    const listener = NetworkMonitor.addListener((online) => {
      setIsOnline(online);
    });

    return () => {
      if (listener) {
        NetworkMonitor.removeListener(listener);
      }
    };
  }, [locationId]);

  const checkNetworkStatus = async () => {
    const online = await NetworkMonitor.isOnline();
    setIsOnline(online);
  };

  const loadForecast = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await WeatherCacheService.get7DayForecast(locationId);

      setForecast(result.data || []);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.error('[WeatherForecast] Load forecast failed:', err);
      setError('Failed to load weather forecast');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      await CacheRefreshOrchestrator.refreshWeatherOnly(locationId);
      await loadForecast();
    } catch (err) {
      console.error('[WeatherForecast] Refresh failed:', err);
      setError('Failed to refresh weather data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderForecastItem = (item) => {
    const date = new Date(item.forecast_date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <View key={item.id} style={styles.forecastItem}>
        <View style={styles.dateColumn}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        <View style={styles.weatherColumn}>
          <Text style={styles.conditionText}>{item.weather_condition}</Text>
          <Text style={styles.tempText}>
            {item.temperature_low_c}° - {item.temperature_high_c}°C
          </Text>
        </View>

        <View style={styles.detailsColumn}>
          {item.rainfall_mm > 0 && (
            <Text style={styles.detailText}>Rain: {item.rainfall_mm}mm</Text>
          )}
          <Text style={styles.detailText}>Humidity: {item.humidity_percent}%</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading weather forecast...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CachedDataBanner isOnline={isOnline} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>7-Day Weather Forecast</Text>
          <LastUpdatedLabel lastUpdated={lastUpdated} />
        </View>
        <DataFreshnessIndicator lastUpdated={lastUpdated} isLive={false} showDetails={false} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        {forecast.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No forecast data available</Text>
            <Text style={styles.emptySubtext}>
              {isOnline
                ? 'Pull down to refresh'
                : 'Connect to internet to download forecast'}
            </Text>
          </View>
        ) : (
          forecast.map((item) => renderForecastItem(item))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  forecastItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateColumn: {
    width: 80,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  weatherColumn: {
    flex: 1,
    paddingHorizontal: 12,
  },
  conditionText: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
  },
  tempText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  detailsColumn: {
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default WeatherForecast;
