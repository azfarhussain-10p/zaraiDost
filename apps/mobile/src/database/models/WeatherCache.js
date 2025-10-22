// WeatherCache Model
// Story 1.5: Offline Weather and Advisory Cache

export class WeatherCache {
  constructor(data) {
    this.id = data.id;
    this.location_id = data.location_id;
    this.forecast_date = data.forecast_date;
    this.temperature_high_c = data.temperature_high_c || null;
    this.temperature_low_c = data.temperature_low_c || null;
    this.humidity_percent = data.humidity_percent || null;
    this.rainfall_mm = data.rainfall_mm || null;
    this.wind_speed_kmh = data.wind_speed_kmh || null;
    this.wind_direction = data.wind_direction || null;
    this.weather_condition = data.weather_condition || null;
    this.uv_index = data.uv_index || null;
    this.sunrise = data.sunrise || null;
    this.sunset = data.sunset || null;
    this.forecast_type = data.forecast_type || 'daily';
    this.data_source = data.data_source || null;
    this.last_updated = data.last_updated || new Date().toISOString();
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      location_id: this.location_id,
      forecast_date: this.forecast_date,
      temperature_high_c: this.temperature_high_c,
      temperature_low_c: this.temperature_low_c,
      humidity_percent: this.humidity_percent,
      rainfall_mm: this.rainfall_mm,
      wind_speed_kmh: this.wind_speed_kmh,
      wind_direction: this.wind_direction,
      weather_condition: this.weather_condition,
      uv_index: this.uv_index,
      sunrise: this.sunrise,
      sunset: this.sunset,
      forecast_type: this.forecast_type,
      data_source: this.data_source,
      last_updated: this.last_updated,
      created_at: this.created_at,
    };
  }

  static fromDatabase(row) {
    return new WeatherCache(row);
  }

  /**
   * Helper to get temperature range string
   */
  getTemperatureRange() {
    if (this.temperature_high_c && this.temperature_low_c) {
      return `${this.temperature_low_c}°C - ${this.temperature_high_c}°C`;
    }
    return null;
  }

  /**
   * Check if this is a forecast for today
   */
  isToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.forecast_date === today;
  }

  /**
   * Get formatted date
   */
  getFormattedDate() {
    const date = new Date(this.forecast_date);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}
