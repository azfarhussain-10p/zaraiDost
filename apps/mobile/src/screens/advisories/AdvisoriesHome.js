// AdvisoriesHome Screen
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 6 (Categorized advisories display)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AdvisoryCacheService from '../../services/cache/AdvisoryCacheService';
import CacheRefreshOrchestrator from '../../services/cache/CacheRefreshOrchestrator';
import DataFreshnessIndicator from '../../components/cache/DataFreshnessIndicator';
import CachedDataBanner from '../../components/cache/CachedDataBanner';
import LastUpdatedLabel from '../../components/cache/LastUpdatedLabel';
import NetworkMonitor from '../../services/sync/NetworkMonitor';
import { ADVISORY_TYPES } from '../../constants/CacheConstants';

/**
 * Advisories home screen with categorized tabs
 */
const AdvisoriesHome = () => {
  const [selectedType, setSelectedType] = useState(ADVISORY_TYPES.IRRIGATION);
  const [advisories, setAdvisories] = useState([]);
  const [criticalAdvisories, setCriticalAdvisories] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAdvisories();
    loadCriticalAdvisories();
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
  }, []);

  useEffect(() => {
    loadAdvisories();
  }, [selectedType]);

  const checkNetworkStatus = async () => {
    const online = await NetworkMonitor.isOnline();
    setIsOnline(online);
  };

  const loadAdvisories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AdvisoryCacheService.getAdvisoriesByType(selectedType);

      setAdvisories(result.data || []);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.error('[AdvisoriesHome] Load advisories failed:', err);
      setError('Failed to load advisories');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCriticalAdvisories = async () => {
    try {
      const result = await AdvisoryCacheService.getCriticalAdvisories();
      setCriticalAdvisories(result.data || []);
    } catch (err) {
      console.error('[AdvisoriesHome] Load critical advisories failed:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      await CacheRefreshOrchestrator.refreshAdvisoriesOnly();
      await loadAdvisories();
      await loadCriticalAdvisories();
    } catch (err) {
      console.error('[AdvisoriesHome] Refresh failed:', err);
      setError('Failed to refresh advisories');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderAdvisoryItem = (advisory) => {
    const isExpired = advisory.isExpired();
    const expiryInfo = advisory.getDaysUntilExpiration();

    return (
      <TouchableOpacity key={advisory.id} style={styles.advisoryItem}>
        <View style={styles.advisoryHeader}>
          <Text style={styles.advisoryTitle}>{advisory.title}</Text>
          {advisory.isCritical() && <View style={styles.criticalBadge}>
            <Text style={styles.criticalBadgeText}>Critical</Text>
          </View>}
        </View>

        <Text style={styles.advisoryContent} numberOfLines={3}>
          {advisory.content}
        </Text>

        <View style={styles.advisoryFooter}>
          <View style={styles.metaInfo}>
            {advisory.applicable_crops && (
              <Text style={styles.cropsText}>
                Crops: {advisory.getApplicableCropsArray().slice(0, 3).join(', ')}
              </Text>
            )}
            <LastUpdatedLabel lastUpdated={advisory.last_updated} />
          </View>

          {expiryInfo && !isExpired && expiryInfo.daysRemaining <= 7 && (
            <Text style={styles.expiryText}>{expiryInfo.message}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCriticalAdvisories = () => {
    if (criticalAdvisories.length === 0) return null;

    return (
      <View style={styles.criticalSection}>
        <Text style={styles.criticalSectionTitle}>Critical Alerts</Text>
        {criticalAdvisories.slice(0, 3).map(renderAdvisoryItem)}
      </View>
    );
  };

  const renderTabButton = (type, label) => {
    const isSelected = selectedType === type;

    return (
      <TouchableOpacity
        key={type}
        style={[styles.tab, isSelected && styles.tabSelected]}
        onPress={() => setSelectedType(type)}
      >
        <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CachedDataBanner isOnline={isOnline} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Advisories</Text>
          <LastUpdatedLabel lastUpdated={lastUpdated} />
        </View>
        <DataFreshnessIndicator lastUpdated={lastUpdated} isLive={false} showDetails={false} />
      </View>

      <View style={styles.tabBar}>
        {renderTabButton(ADVISORY_TYPES.IRRIGATION, 'Irrigation')}
        {renderTabButton(ADVISORY_TYPES.MARKET, 'Market')}
        {renderTabButton(ADVISORY_TYPES.CLIMATE, 'Climate')}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
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
          {renderCriticalAdvisories()}

          {advisories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No advisories available</Text>
              <Text style={styles.emptySubtext}>
                {isOnline
                  ? 'Pull down to refresh'
                  : 'Connect to internet to download advisories'}
              </Text>
            </View>
          ) : (
            advisories.map(renderAdvisoryItem)
          )}
        </ScrollView>
      )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabSelected: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextSelected: {
    color: '#FFFFFF',
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
  criticalSection: {
    marginBottom: 16,
  },
  criticalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  advisoryItem: {
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
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  advisoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  criticalBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  criticalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  advisoryContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  advisoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaInfo: {
    flex: 1,
  },
  cropsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
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

export default AdvisoriesHome;
