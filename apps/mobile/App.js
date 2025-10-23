// Main App Component
// Story 1.1: Local Data Storage Foundation
// Initializes database and sets up navigation

// CRITICAL: Import crypto polyfill FIRST to fix uuid on web
import './src/utils/crypto-polyfill';

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initDatabase } from './src/database/config/db.config';

// Import screens
import FarmDashboard from './src/screens/offline/FarmDashboard';
import QueryHistory from './src/screens/offline/QueryHistory';
import CropDetails from './src/screens/offline/CropDetails';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing Zarai Dost...');
      
      // Initialize database
      await initDatabase();
      
      console.log('[App] Initialization complete');
      setIsLoading(false);
    } catch (err) {
      console.error('[App] Initialization failed:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Initializing Zarai Dost...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorDetails}>{error}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="FarmDashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#22c55e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="FarmDashboard" 
          component={FarmDashboard}
          options={{ title: 'زرعی دوست | Zarai Dost' }}
        />
        <Stack.Screen 
          name="QueryHistory" 
          component={QueryHistory}
          options={{ title: 'Query History' }}
        />
        <Stack.Screen 
          name="CropDetails" 
          component={CropDetails}
          options={{ title: 'Crop Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
