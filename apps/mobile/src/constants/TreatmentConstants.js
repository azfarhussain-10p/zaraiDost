// Treatment Constants
// Story 3.4: Treatment Recommendations Engine
// Configuration for treatment recommendations, safety, and application

/**
 * Treatment Types
 * AC2: Multiple treatment options (chemical, organic, cultural practices)
 */
export const TREATMENT_TYPES = {
  CHEMICAL: 'chemical',
  ORGANIC: 'organic',
  CULTURAL: 'cultural',
  BIOLOGICAL: 'biological',
};

/**
 * Treatment Categories
 */
export const TREATMENT_CATEGORIES = {
  FUNGICIDE: 'fungicide',
  INSECTICIDE: 'insecticide',
  HERBICIDE: 'herbicide',
  FERTILIZER: 'fertilizer',
  PRACTICE: 'practice',
  BIOLOGICAL_CONTROL: 'biological_control',
  SOIL_AMENDMENT: 'soil_amendment',
};

/**
 * Cost Categories
 * AC4: Budget-friendly options highlighted
 */
export const COST_CATEGORIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/**
 * Application Methods
 * AC6: Application instructions included
 */
export const APPLICATION_METHODS = {
  SPRAY: 'spray',
  FOLIAR: 'foliar',
  SOIL_DRENCH: 'soil_drench',
  SOIL_BROADCAST: 'soil_broadcast',
  SEED_TREATMENT: 'seed_treatment',
  GRANULAR: 'granular',
  INJECTION: 'injection',
  MANUAL_REMOVAL: 'manual_removal',
};

/**
 * Safety Classes
 * AC7: Safety precautions and PPE recommendations
 */
export const SAFETY_CLASSES = {
  LOW_RISK: 'low_risk',
  MODERATE_RISK: 'moderate_risk',
  HIGH_RISK: 'high_risk',
  EXTREME_RISK: 'extreme_risk',
};

/**
 * Protective Equipment (PPE)
 * AC7: Protective equipment recommendations
 */
export const PPE_TYPES = {
  GLOVES: 'gloves',
  MASK: 'mask',
  GOGGLES: 'goggles',
  LONG_SLEEVES: 'long_sleeves',
  BOOTS: 'boots',
  RESPIRATOR: 'respirator',
  FULL_BODY_SUIT: 'full_body_suit',
  FACE_SHIELD: 'face_shield',
};

/**
 * Organic Preferences
 * AC3: Consider user's organic preference
 */
export const ORGANIC_PREFERENCES = {
  ORGANIC_ONLY: 'organic_only',
  PREFER_ORGANIC: 'prefer_organic',
  NO_PREFERENCE: 'no_preference',
  CHEMICAL_OK: 'chemical_ok',
};

/**
 * Budget Levels
 * AC4: Budget-friendly options for low-income farmers
 */
export const BUDGET_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

/**
 * Severity Applicability
 */
export const SEVERITY_APPLICABILITY = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  ALL: 'all',
};

/**
 * Treatment Effectiveness Thresholds
 */
export const EFFECTIVENESS_THRESHOLDS = {
  VERY_HIGH: 0.9, // 90%+
  HIGH: 0.75, // 75-90%
  MODERATE: 0.60, // 60-75%
  LOW: 0.45, // 45-60%
  MINIMAL: 0.3, // 30-45%
};

/**
 * Application Timing
 */
export const APPLICATION_TIMING = {
  EARLY_MORNING: 'early_morning',
  LATE_EVENING: 'late_evening',
  AVOID_MIDDAY: 'avoid_midday',
  BEFORE_RAIN: 'before_rain',
  AFTER_RAIN: 'after_rain',
  PRE_FLOWERING: 'pre_flowering',
  POST_FLOWERING: 'post_flowering',
  PRE_HARVEST: 'pre_harvest',
};

/**
 * Weather Conditions for Application
 */
export const WEATHER_CONDITIONS = {
  CALM: 'calm',
  LOW_WIND: 'low_wind',
  NO_RAIN_FORECAST: 'no_rain_forecast',
  MODERATE_TEMPERATURE: 'moderate_temperature',
  HIGH_HUMIDITY: 'high_humidity',
};

/**
 * Treatment Status
 */
export const TREATMENT_STATUS = {
  RECOMMENDED: 'recommended',
  APPLIED: 'applied',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  INEFFECTIVE: 'ineffective',
  CANCELLED: 'cancelled',
};

/**
 * Availability Status
 * AC5: Local product availability indicated
 */
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  LIMITED: 'limited',
  OUT_OF_STOCK: 'out_of_stock',
  UNKNOWN: 'unknown',
  SEASONAL: 'seasonal',
};

/**
 * Recommendation Configuration
 */
export const RECOMMENDATION_CONFIG = {
  MAX_RECOMMENDATIONS: 5,
  MIN_EFFECTIVENESS: 0.3, // 30% minimum effectiveness
  BUDGET_FRIENDLY_THRESHOLD: COST_CATEGORIES.LOW,
  ORGANIC_BOOST_FACTOR: 1.1, // 10% boost for organic when preferred
  DEFAULT_FIELD_SIZE_ACRES: 1,
  MAX_SUPPLIER_DISTANCE_KM: 50,
};

/**
 * Dosage Units
 */
export const DOSAGE_UNITS = {
  ML: 'ml',
  LITER: 'liter',
  GRAM: 'gram',
  KG: 'kg',
  PACKET: 'packet',
  BAG: 'bag',
};

/**
 * Safety Icons/Colors
 * AC7: Safety warnings with icons and colors
 */
export const SAFETY_INDICATORS = {
  [SAFETY_CLASSES.LOW_RISK]: {
    color: '#4CAF50',
    icon: '✓',
    label: 'Low Risk',
    labelUr: 'کم خطرہ',
  },
  [SAFETY_CLASSES.MODERATE_RISK]: {
    color: '#FF9800',
    icon: '⚠',
    label: 'Moderate Risk',
    labelUr: 'اوسط خطرہ',
  },
  [SAFETY_CLASSES.HIGH_RISK]: {
    color: '#F44336',
    icon: '⚠',
    label: 'High Risk',
    labelUr: 'زیادہ خطرہ',
  },
  [SAFETY_CLASSES.EXTREME_RISK]: {
    color: '#D32F2F',
    icon: '⛔',
    label: 'Extreme Risk',
    labelUr: 'انتہائی خطرہ',
  },
};

/**
 * Effectiveness Display Configuration
 * AC2: Effectiveness ratings (visual indicators)
 */
export const EFFECTIVENESS_DISPLAY = {
  VERY_HIGH: {
    stars: 5,
    color: '#4CAF50',
    label: 'Very Effective',
    labelUr: 'بہت مؤثر',
  },
  HIGH: {
    stars: 4,
    color: '#8BC34A',
    label: 'Highly Effective',
    labelUr: 'انتہائی مؤثر',
  },
  MODERATE: {
    stars: 3,
    color: '#FF9800',
    label: 'Moderately Effective',
    labelUr: 'اوسط مؤثر',
  },
  LOW: {
    stars: 2,
    color: '#FF5722',
    label: 'Less Effective',
    labelUr: 'کم مؤثر',
  },
  MINIMAL: {
    stars: 1,
    color: '#F44336',
    label: 'Minimally Effective',
    labelUr: 'کم سے کم مؤثر',
  },
};

/**
 * Environmental Precautions
 */
export const ENVIRONMENTAL_PRECAUTIONS = {
  NO_WATER_SOURCES: 'Do not spray near water sources (wells, ponds, streams)',
  NO_WATER_SOURCES_UR: 'پانی کے ذرائع کے قریب سپرے نہ کریں',
  NO_SPRAY_DRIFT: 'Avoid spray drift to neighboring fields',
  NO_SPRAY_DRIFT_UR: 'پڑوسی کھیتوں میں سپرے نہ پھیلائیں',
  PROPER_DISPOSAL: 'Dispose of empty containers at designated collection points',
  PROPER_DISPOSAL_UR: 'خالی کنٹینرز کو مخصوص جگہوں پر ڈسپوز کریں',
  NO_LIVESTOCK: 'Keep livestock away from treated areas',
  NO_LIVESTOCK_UR: 'مویشیوں کو علاج شدہ علاقوں سے دور رکھیں',
};

/**
 * Standard Safety Precautions
 * AC7: Safety precautions included
 */
export const STANDARD_SAFETY_PRECAUTIONS = {
  READ_LABEL: {
    en: 'Read product label completely before use',
    ur: 'استعمال سے پہلے پروڈکٹ لیبل مکمل پڑھیں',
  },
  ORIGINAL_CONTAINER: {
    en: 'Store chemicals in original containers only',
    ur: 'کیمیکلز کو صرف اصل کنٹینرز میں رکھیں',
  },
  KEEP_AWAY: {
    en: 'Keep out of reach of children and animals',
    ur: 'بچوں اور جانوروں کی پہنچ سے دور رکھیں',
  },
  NO_EATING: {
    en: 'Do not eat, drink, or smoke while handling chemicals',
    ur: 'کیمیکل ہینڈل کرتے وقت کھانا، پینا یا سگریٹ نہ پئیں',
  },
  WASH_AFTER: {
    en: 'Wash hands and face thoroughly after use',
    ur: 'استعمال کے بعد ہاتھ اور چہرہ اچھی طرح دھوئیں',
  },
  PROPER_DISPOSAL: {
    en: 'Dispose of empty containers properly',
    ur: 'خالی کنٹینرز کو صحیح طریقے سے ٹھکانے لگائیں',
  },
  EMERGENCY_CONTACTS: {
    en: 'Keep emergency contact numbers handy',
    ur: 'ایمرجنسی رابطہ نمبر ہاتھ میں رکھیں',
  },
};

/**
 * Treatment Application Validation
 */
export const APPLICATION_VALIDATION = {
  MIN_FIELD_SIZE: 0.1, // 0.1 acres minimum
  MAX_FIELD_SIZE: 1000, // 1000 acres maximum
  MIN_DOSAGE_MULTIPLIER: 0.5, // 50% of recommended minimum
  MAX_DOSAGE_MULTIPLIER: 2.0, // 200% of recommended maximum
  WEATHER_CHECK_REQUIRED: true,
};

/**
 * Default Values
 */
export const DEFAULTS = {
  FIELD_SIZE_ACRES: 1,
  WATER_PER_ACRE_LITERS: 100,
  RE_ENTRY_INTERVAL_HOURS: 24,
  PRE_HARVEST_INTERVAL_DAYS: 7,
  APPLICATION_FREQUENCY_DAYS: 7,
  MAX_APPLICATIONS_PER_SEASON: 3,
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_AI_RECOMMENDATIONS: true,
  ENABLE_SUPPLIER_LOOKUP: true, // AC5
  ENABLE_COST_ESTIMATES: true,
  ENABLE_WEATHER_VALIDATION: true,
  ENABLE_TREATMENT_TRACKING: true,
  ENABLE_FEEDBACK_COLLECTION: true,
};

export default {
  TREATMENT_TYPES,
  TREATMENT_CATEGORIES,
  COST_CATEGORIES,
  APPLICATION_METHODS,
  SAFETY_CLASSES,
  PPE_TYPES,
  ORGANIC_PREFERENCES,
  BUDGET_LEVELS,
  SEVERITY_APPLICABILITY,
  EFFECTIVENESS_THRESHOLDS,
  APPLICATION_TIMING,
  WEATHER_CONDITIONS,
  TREATMENT_STATUS,
  AVAILABILITY_STATUS,
  RECOMMENDATION_CONFIG,
  DOSAGE_UNITS,
  SAFETY_INDICATORS,
  EFFECTIVENESS_DISPLAY,
  ENVIRONMENTAL_PRECAUTIONS,
  STANDARD_SAFETY_PRECAUTIONS,
  APPLICATION_VALIDATION,
  DEFAULTS,
  FEATURE_FLAGS,
};
