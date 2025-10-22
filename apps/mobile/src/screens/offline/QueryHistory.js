// Query History Screen
// Story 1.1: Local Data Storage Foundation
// Implements: Task 4.2 (Query History screen with search/filter)
// AC4: App functions without internet for viewing historical data

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import QueryRepository from '../../database/repositories/QueryRepository';
import { QUERY_TYPES } from '../../constants/DatabaseConstants';

export default function QueryHistory({ navigation }) {
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  useEffect(() => {
    filterQueries();
  }, [searchText, selectedType, queries]);

  const loadQueries = async () => {
    try {
      const allQueries = await QueryRepository.findAll('timestamp DESC', 100);
      setQueries(allQueries);
    } catch (error) {
      console.error('[QueryHistory] Load failed:', error);
    }
  };

  const filterQueries = () => {
    let filtered = queries;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(q => q.query_type === selectedType);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(q => 
        q.query_text.toLowerCase().includes(searchText.toLowerCase()) ||
        (q.response_text && q.response_text.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredQueries(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueries();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search queries..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Type Filter */}
      <ScrollView horizontal style={styles.filterSection} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
            All ({queries.length})
          </Text>
        </TouchableOpacity>
        {Object.entries(QUERY_TYPES).map(([key, value]) => {
          const count = queries.filter(q => q.query_type === value).length;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.filterButton, selectedType === value && styles.filterButtonActive]}
              onPress={() => setSelectedType(value)}
            >
              <Text style={[styles.filterText, selectedType === value && styles.filterTextActive]}>
                {key} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Query List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredQueries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No queries found</Text>
            <Text style={styles.emptySubtext}>
              {searchText || selectedType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Your query history will appear here'}
            </Text>
          </View>
        ) : (
          filteredQueries.map((query) => (
            <View key={query.id} style={styles.queryCard}>
              <View style={styles.queryHeader}>
                <Text style={styles.queryType}>{query.query_type.toUpperCase()}</Text>
                <Text style={styles.queryDate}>
                  {new Date(query.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.queryText}>{query.query_text}</Text>
              {query.response_text && (
                <View style={styles.responseSection}>
                  <Text style={styles.responseLabel}>Response:</Text>
                  <Text style={styles.responseText} numberOfLines={3}>
                    {query.response_text}
                  </Text>
                </View>
              )}
              {query.confidence_score && (
                <Text style={styles.confidenceText}>
                  Confidence: {(query.confidence_score * 100).toFixed(0)}%
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#22c55e',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  queryCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  queryType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  queryDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  queryText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    fontWeight: '500',
  },
  responseSection: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#374151',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
});

