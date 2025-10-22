// Network Monitor Service
// Story 1.2: Background Synchronization Service
// Implements: Task 1 (Network connectivity detection)

import NetInfo from '@react-native-community/netinfo';

class NetworkMonitor {
  constructor() {
    this.isConnected = false;
    this.connectionType = 'none';
    this.listeners = [];
    this.unsubscribe = null;
  }

  /**
   * Initialize network monitoring
   * Implements: Task 1.2, 1.3
   */
  async init() {
    console.log('[NetworkMonitor] Initializing...');

    // Get initial state
    const state = await NetInfo.fetch();
    this.updateConnectionState(state);

    // Subscribe to network changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.updateConnectionState(state);
    });

    console.log('[NetworkMonitor] Initialized. Connected:', this.isConnected);
    return this.isConnected;
  }

  /**
   * Update connection state and notify listeners
   * Implements: Task 1.4 (Distinguish between WiFi, cellular, and no connection)
   */
  updateConnectionState(state) {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected;
    this.connectionType = state.type; // wifi, cellular, none

    console.log(`[NetworkMonitor] Connection: ${this.connectionType}, Connected: ${this.isConnected}`);

    // Notify listeners of connection change
    if (wasConnected !== this.isConnected) {
      this.notifyListeners({
        isConnected: this.isConnected,
        connectionType: this.connectionType,
        wasConnected,
      });
    }
  }

  /**
   * Add listener for connection changes
   */
  addListener(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(connectionInfo) {
    this.listeners.forEach(callback => {
      try {
        callback(connectionInfo);
      } catch (error) {
        console.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }

  /**
   * Check if connected to WiFi (for data-conscious syncing)
   */
  isWiFi() {
    return this.connectionType === 'wifi';
  }

  /**
   * Check if connected (any type)
   */
  isNetworkAvailable() {
    return this.isConnected;
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
      isWiFi: this.isWiFi(),
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
    console.log('[NetworkMonitor] Destroyed');
  }
}

// Singleton instance
export default new NetworkMonitor();

