// WeatherCacheRepository
// Story 1.5: Offline Weather and Advisory Cache
// Implements: Task 1 (Weather cache storage and retrieval)

import { BaseRepository } from './BaseRepository';
import { WeatherCache } from '../models/WeatherCache';
import { TABLES } from '../../constants/DatabaseConstants';
import { RETENTION } from '../../constants/CacheConstants';
import { getDatabase } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository for managing weather cache data
 * Handles storage, retrieval, and cleanup of weather forecasts
 */
export class WeatherCacheRepository extends BaseRepository {
  constructor() {
    super(TABLES.WEATHER_CACHE, WeatherCache);
  }

  /**
   * Save weather forecast data
   * Uses upsert logic to update existing forecasts or insert new ones
   */
  async saveWeatherData(weatherData) {
    const db = getDatabase();

    try {
      const id = weatherData.id || uuidv4();
      const now = new Date().toISOString();

      const data = {
        id,
        location_id: weatherData.location_id,
        forecast_date: weatherData.forecast_date,
        temperature_high_c: weatherData.temperature_high_c,
        temperature_low_c: weatherData.temperature_low_c,
        humidity_percent: weatherData.humidity_percent,
        rainfall_mm: weatherData.rainfall_mm,
        wind_speed_kmh: weatherData.wind_speed_kmh,
        wind_direction: weatherData.wind_direction,
        weather_condition: weatherData.weather_condition,
        uv_index: weatherData.uv_index,
        sunrise: weatherData.sunrise,
        sunset: weatherData.sunset,
        forecast_type: weatherData.forecast_type || 'daily',
        data_source: weatherData.data_source,
        last_updated: now,
      };

      // Use REPLACE to upsert (insert or update if unique constraint exists)
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => data[key]);

      const query = `
        INSERT OR REPLACE INTO ${this.tableName} (${keys.join(', ')}, created_at)
        VALUES (${placeholders}, COALESCE((SELECT created_at FROM ${this.tableName}
          WHERE location_id = ? AND forecast_date = ? AND forecast_type = ?), ?))
      `;

      await db.runAsync(query, [
        ...values,
        data.location_id,
        data.forecast_date,
        data.forecast_type,
        now,
      ]);

      return this.findById(id);
    } catch (error) {
      console.error('[WeatherCacheRepository] Save weather data failed:', error);
      throw error;
    }
  }

  /**
   * Get weather forecast for a specific location and date range
   */
  async getWeatherForecast(locationId, startDate, endDate) {
    const db = getDatabase();

    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE location_id = ?
          AND forecast_date >= ?
          AND forecast_date <= ?
        ORDER BY forecast_date ASC
      `;

      const rows = await db.getAllAsync(query, [locationId, startDate, endDate]);
      return rows.map(row => this.ModelClass.fromDatabase(row));
    } catch (error) {
      console.error('[WeatherCacheRepository] Get weather forecast failed:', error);
      throw error;
    }
  }

  /**
   * Get 7-day forecast for a location
   */
  async get7DayForecast(locationId) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 6);
    const endDate = sevenDaysLater.toISOString().split('T')[0];

    return await this.getWeatherForecast(locationId, today, endDate);
  }

  /**
   * Get today's weather for a location
   */
  async getTodayWeather(locationId) {
    const today = new Date().toISOString().split('T')[0];

    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE location_id = ? AND forecast_date = ?
        LIMIT 1
      `;

      const db = getDatabase();
      const row = await db.getFirstAsync(query, [locationId, today]);

      return row ? this.ModelClass.fromDatabase(row) : null;
    } catch (error) {
      console.error('[WeatherCacheRepository] Get today weather failed:', error);
      throw error;
    }
  }

  /**
   * Delete weather data older than retention period (7 days)
   */
  async deleteOldWeather(locationId) {
    const db = getDatabase();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION.WEATHER_DAYS);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const query = `
        DELETE FROM ${this.tableName}
        WHERE location_id = ? AND forecast_date < ?
      `;

      const result = await db.runAsync(query, [locationId, cutoffDateStr]);

      console.log(
        `[WeatherCacheRepository] Deleted ${result.changes} old weather records for location ${locationId}`
      );

      return result.changes;
    } catch (error) {
      console.error('[WeatherCacheRepository] Delete old weather failed:', error);
      throw error;
    }
  }

  /**
   * Get last updated timestamp for a location
   */
  async getLastUpdated(locationId) {
    const db = getDatabase();

    try {
      const query = `
        SELECT MAX(last_updated) as last_updated
        FROM ${this.tableName}
        WHERE location_id = ?
      `;

      const result = await db.getFirstAsync(query, [locationId]);
      return result?.last_updated || null;
    } catch (error) {
      console.error('[WeatherCacheRepository] Get last updated failed:', error);
      throw error;
    }
  }

  /**
   * Get total cache size for weather data (in bytes)
   */
  async getCacheSize(locationId = null) {
    const db = getDatabase();

    try {
      let query = `
        SELECT SUM(LENGTH(weather_condition) + LENGTH(data_source) + 100) as total_size
        FROM ${this.tableName}
      `;

      const params = [];
      if (locationId) {
        query += ' WHERE location_id = ?';
        params.push(locationId);
      }

      const result = await db.getFirstAsync(query, params);
      return result?.total_size || 0;
    } catch (error) {
      console.error('[WeatherCacheRepository] Get cache size failed:', error);
      throw error;
    }
  }

  /**
   * Clear all weather cache for a location
   */
  async clearCache(locationId) {
    const db = getDatabase();

    try {
      const query = `DELETE FROM ${this.tableName} WHERE location_id = ?`;
      const result = await db.runAsync(query, [locationId]);

      console.log(
        `[WeatherCacheRepository] Cleared ${result.changes} weather records for location ${locationId}`
      );

      return result.changes;
    } catch (error) {
      console.error('[WeatherCacheRepository] Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Check if weather data exists for a date range
   */
  async hasWeatherData(locationId, startDate, endDate) {
    const count = await this.count(
      'location_id = ? AND forecast_date >= ? AND forecast_date <= ?',
      [locationId, startDate, endDate]
    );
    return count > 0;
  }

  /**
   * Get oldest forecast date for a location
   */
  async getOldestForecastDate(locationId) {
    const db = getDatabase();

    try {
      const query = `
        SELECT MIN(forecast_date) as oldest_date
        FROM ${this.tableName}
        WHERE location_id = ?
      `;

      const result = await db.getFirstAsync(query, [locationId]);
      return result?.oldest_date || null;
    } catch (error) {
      console.error('[WeatherCacheRepository] Get oldest forecast date failed:', error);
      throw error;
    }
  }
}

export default new WeatherCacheRepository();
