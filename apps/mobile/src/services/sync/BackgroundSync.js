// Background Sync Configuration
// Story 1.2: Background Synchronization Service
// Implements: Task 2.6 (Background sync using React Native Background Fetch)

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { BACKGROUND_SYNC_CONFIG, SYNC_PRIORITY } from '../../constants/SyncConstants';
import SyncService from './SyncService';
import NetworkMonitor from './NetworkMonitor';

const BACKGROUND_SYNC_TASK = 'ZARAI_DOST_BACKGROUND_SYNC';

/**
 * Background Sync Service
 * Handles periodic background synchronization
 */
class BackgroundSync {
  constructor() {
    this.isRegistered = false;
    this.settings = {
      ...BACKGROUND_SYNC_CONFIG,
    };
  }

  /**
   * Initialize and register background sync task
   * Implements: Task 2.6
   */
  async init() {
    console.log('[BackgroundSync] Initializing...');

    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        console.log('[BackgroundSync] Task triggered');

        try {
          // Check if we should perform sync
          if (!this.shouldPerformBackgroundSync()) {
            console.log('[BackgroundSync] Skipping sync (conditions not met)');
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }

          // Perform sync
          const result = await SyncService.performSync(false, SYNC_PRIORITY.LOW);

          if (result.success) {
            console.log(
              `[BackgroundSync] Success: ${result.totalSynced} items synced`
            );
            return BackgroundFetch.BackgroundFetchResult.NewData;
          } else {
            console.log('[BackgroundSync] No new data synced');
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }
        } catch (error) {
          console.error('[BackgroundSync] Task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the task
      await this.register();

      console.log('[BackgroundSync] Initialized successfully');
    } catch (error) {
      console.error('[BackgroundSync] Init failed:', error);
      throw error;
    }
  }

  /**
   * Register background fetch task
   */
  async register() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      console.log('[BackgroundSync] Status:', status);

      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: this.settings.MIN_INTERVAL, // 15 minutes
          stopOnTerminate: false, // Continue after app closes
          startOnBoot: true, // Start on device boot
        });

        this.isRegistered = true;
        console.log('[BackgroundSync] Task registered');
      } else {
        console.warn('[BackgroundSync] Background fetch not available:', status);
      }
    } catch (error) {
      console.error('[BackgroundSync] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister background fetch task
   */
  async unregister() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      console.log('[BackgroundSync] Task unregistered');
    } catch (error) {
      console.error('[BackgroundSync] Unregister failed:', error);
    }
  }

  /**
   * Check if background sync should be performed
   * Implements battery and WiFi-only checks
   */
  shouldPerformBackgroundSync() {
    // Check network availability
    if (!NetworkMonitor.isNetworkAvailable()) {
      console.log('[BackgroundSync] No network connection');
      return false;
    }

    // Check WiFi-only setting
    if (this.settings.WIFI_ONLY && !NetworkMonitor.isWiFi()) {
      console.log('[BackgroundSync] WiFi-only mode enabled, not on WiFi');
      return false;
    }

    // Note: Battery check would require expo-battery package
    // Skipping for now as it's optional
    // TODO: Add battery check when needed

    return true;
  }

  /**
   * Update background sync settings
   */
  async updateSettings(settings) {
    const needsReregister =
      settings.MIN_INTERVAL !== undefined &&
      settings.MIN_INTERVAL !== this.settings.MIN_INTERVAL;

    this.settings = {
      ...this.settings,
      ...settings,
    };

    // Re-register if interval changed
    if (needsReregister && this.isRegistered) {
      await this.unregister();
      await this.register();
    }

    console.log('[BackgroundSync] Settings updated:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Check if task is registered
   */
  async isTaskRegistered() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK
      );
      return isRegistered;
    } catch (error) {
      console.error('[BackgroundSync] Failed to check registration:', error);
      return false;
    }
  }

  /**
   * Get registration status
   */
  getStatus() {
    return {
      isRegistered: this.isRegistered,
      settings: this.settings,
      taskName: BACKGROUND_SYNC_TASK,
      platform: Platform.OS,
    };
  }
}

// Singleton instance
export default new BackgroundSync();
