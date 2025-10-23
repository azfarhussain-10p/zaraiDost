// Supplier Constants
// Story 3.5: Local Supplier Integration
// Configuration for supplier search, contact, and availability tracking

/**
 * Supplier Types
 * AC1: Supplier database linked to treatment recommendations
 */
export const SUPPLIER_TYPES = {
  SHOP: 'shop',
  WHOLESALER: 'wholesaler',
  COOPERATIVE: 'cooperative',
  ONLINE: 'online',
  GOVERNMENT_STORE: 'government_store',
};

/**
 * Availability Status
 * AC4: Product availability status when known
 */
export const AVAILABILITY_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  UNKNOWN: 'unknown',
  SEASONAL: 'seasonal',
};

/**
 * Availability Confidence Levels
 * Based on how recent the update is
 */
export const AVAILABILITY_CONFIDENCE = {
  HIGH: 'high', // 0-7 days old
  MEDIUM: 'medium', // 8-30 days old
  LOW: 'low', // >30 days old
  UNKNOWN: 'unknown',
};

/**
 * Search Radius Options (in kilometers)
 * AC2: Nearest suppliers displayed based on farmer location
 */
export const SEARCH_RADIUS = {
  VERY_NEAR: 5,
  NEAR: 10,
  MODERATE: 25,
  FAR: 50,
  VERY_FAR: 100,
  EXTENDED: 200,
};

/**
 * Default Search Configuration
 */
export const SEARCH_CONFIG = {
  DEFAULT_RADIUS_KM: SEARCH_RADIUS.FAR,
  MAX_RESULTS: 20,
  AUTO_EXPAND_RADIUS: true,
  EXPANSION_MULTIPLIER: 2,
  MAX_RADIUS_KM: SEARCH_RADIUS.EXTENDED,
};

/**
 * Contact Methods
 * AC6: Option to call supplier directly from app
 */
export const CONTACT_METHODS = {
  PHONE: 'phone',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  EMAIL: 'email',
};

/**
 * Product Equivalence Types
 * AC5: Alternative products suggested if primary unavailable
 */
export const EQUIVALENCE_TYPES = {
  SAME_INGREDIENT: 'same_ingredient', // Same active ingredient
  SIMILAR_EFFECT: 'similar_effect', // Similar effectiveness
  GENERIC_BRAND: 'generic_brand', // Generic version of branded product
  ALTERNATIVE_FORMULATION: 'alternative_formulation', // Different form (e.g., powder vs liquid)
};

/**
 * Supplier Verification Status
 */
export const VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  UNVERIFIED: 'unverified',
  REPORTED: 'reported',
};

/**
 * Contact Intent Types
 */
export const CONTACT_INTENT = {
  INQUIRY: 'inquiry',
  ORDER: 'order',
  CHECK_AVAILABILITY: 'check_availability',
  REPORT_ISSUE: 'report_issue',
};

/**
 * Distance Display Units
 */
export const DISTANCE_UNITS = {
  METERS: 'meters',
  KILOMETERS: 'kilometers',
};

/**
 * Sorting Options for Supplier List
 */
export const SORT_OPTIONS = {
  DISTANCE: 'distance',
  RATING: 'rating',
  AVAILABILITY: 'availability',
  FAVORITES_FIRST: 'favorites_first',
};

/**
 * Availability Indicators (UI)
 */
export const AVAILABILITY_INDICATORS = {
  [AVAILABILITY_STATUS.IN_STOCK]: {
    color: '#4CAF50',
    icon: '✓',
    label: 'In Stock',
    labelUr: 'دستیاب',
    labelPa: 'ਉਪਲਬਧ',
    labelSd: 'موجود',
  },
  [AVAILABILITY_STATUS.LOW_STOCK]: {
    color: '#FF9800',
    icon: '⚠',
    label: 'Low Stock',
    labelUr: 'کم اسٹاک',
    labelPa: 'ਘੱਟ ਸਟਾਕ',
    labelSd: 'گهٽ اسٽاڪ',
  },
  [AVAILABILITY_STATUS.OUT_OF_STOCK]: {
    color: '#F44336',
    icon: '✗',
    label: 'Out of Stock',
    labelUr: 'اسٹاک ختم',
    labelPa: 'ਸਟਾਕ ਖਤਮ',
    labelSd: 'اسٽاڪ ختم',
  },
  [AVAILABILITY_STATUS.UNKNOWN]: {
    color: '#9E9E9E',
    icon: '?',
    label: 'Unknown',
    labelUr: 'نامعلوم',
    labelPa: 'ਅਣਜਾਣ',
    labelSd: 'اڻڄاتل',
  },
  [AVAILABILITY_STATUS.SEASONAL]: {
    color: '#2196F3',
    icon: '⏰',
    label: 'Seasonal',
    labelUr: 'موسمی',
    labelPa: 'ਮੌਸਮੀ',
    labelSd: 'موسمي',
  },
};

/**
 * Confidence Indicators (UI)
 */
export const CONFIDENCE_INDICATORS = {
  [AVAILABILITY_CONFIDENCE.HIGH]: {
    color: '#4CAF50',
    label: 'Recently Updated',
    labelUr: 'حال ہی میں اپ ڈیٹ',
    labelPa: 'ਹਾਲ ਹੀ ਵਿੱਚ ਅੱਪਡੇਟ',
    labelSd: 'تازو اپڊيٽ',
  },
  [AVAILABILITY_CONFIDENCE.MEDIUM]: {
    color: '#FF9800',
    label: 'May Be Outdated',
    labelUr: 'پرانا ہو سکتا ہے',
    labelPa: 'ਪੁਰਾਣਾ ਹੋ ਸਕਦਾ ਹੈ',
    labelSd: 'پراڻو ٿي سگھي ٿو',
  },
  [AVAILABILITY_CONFIDENCE.LOW]: {
    color: '#F44336',
    label: 'Outdated Information',
    labelUr: 'پرانی معلومات',
    labelPa: 'ਪੁਰਾਣੀ ਜਾਣਕਾਰੀ',
    labelSd: 'پراڻي ڄاڻ',
  },
  [AVAILABILITY_CONFIDENCE.UNKNOWN]: {
    color: '#9E9E9E',
    label: 'No Information',
    labelUr: 'معلومات نہیں',
    labelPa: 'ਕੋਈ ਜਾਣਕਾਰੀ ਨਹੀਂ',
    labelSd: 'ڄاڻ ناهي',
  },
};

/**
 * Supplier Type Labels
 */
export const SUPPLIER_TYPE_LABELS = {
  [SUPPLIER_TYPES.SHOP]: {
    en: 'Retail Shop',
    ur: 'ریٹیل شاپ',
    pa: 'ਰਿਟੇਲ ਦੁਕਾਨ',
    sd: 'پرچون دڪان',
  },
  [SUPPLIER_TYPES.WHOLESALER]: {
    en: 'Wholesaler',
    ur: 'تھوک فروش',
    pa: 'ਥੋਕ ਵਿਕਰੇਤਾ',
    sd: 'هول سيلر',
  },
  [SUPPLIER_TYPES.COOPERATIVE]: {
    en: 'Cooperative',
    ur: 'کوآپریٹو',
    pa: 'ਸਹਿਕਾਰੀ',
    sd: 'ڪوآپريٽو',
  },
  [SUPPLIER_TYPES.ONLINE]: {
    en: 'Online Store',
    ur: 'آن لائن اسٹور',
    pa: 'ਔਨਲਾਈਨ ਸਟੋਰ',
    sd: 'آنلائن اسٽور',
  },
  [SUPPLIER_TYPES.GOVERNMENT_STORE]: {
    en: 'Government Store',
    ur: 'سرکاری اسٹور',
    pa: 'ਸਰਕਾਰੀ ਸਟੋਰ',
    sd: 'سرڪاري اسٽور',
  },
};

/**
 * Contact Button Labels
 */
export const CONTACT_LABELS = {
  CALL: {
    en: 'Call',
    ur: 'کال کریں',
    pa: 'ਕਾਲ ਕਰੋ',
    sd: 'ڪال ڪريو',
  },
  WHATSAPP: {
    en: 'WhatsApp',
    ur: 'واٹس ایپ',
    pa: 'ਵਟਸਐਪ',
    sd: 'واٽس ايپ',
  },
  SMS: {
    en: 'Message',
    ur: 'پیغام',
    pa: 'ਸੁਨੇਹਾ',
    sd: 'پيغام',
  },
  DIRECTIONS: {
    en: 'Get Directions',
    ur: 'سمت حاصل کریں',
    pa: 'ਦਿਸ਼ਾ ਪ੍ਰਾਪਤ ਕਰੋ',
    sd: 'رستو وٺو',
  },
};

/**
 * Pakistani Phone Number Patterns
 */
export const PHONE_PATTERNS = {
  MOBILE: /^(03\d{9}|923\d{9}|\+923\d{9})$/,
  LANDLINE: /^(0\d{2,4}\d{6,8})$/,
};

/**
 * Default Contact Messages
 */
export const DEFAULT_MESSAGES = {
  PRODUCT_INQUIRY: {
    en: 'Assalam-o-Alaikum. I need information about ',
    ur: 'السلام علیکم۔ مجھے معلومات چاہیے ',
    pa: 'ਸਲਾਮ। ਮੈਨੂੰ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ ',
    sd: 'سلام. مون کي ڄاڻ گهرجي ',
  },
  AVAILABILITY_CHECK: {
    en: 'Is this product available? ',
    ur: 'کیا یہ پروڈکٹ دستیاب ہے؟ ',
    pa: 'ਕੀ ਇਹ ਉਤਪਾਦ ਉਪਲਬਧ ਹੈ? ',
    sd: 'ڇا هي پراڊڪٽ موجود آهي؟ ',
  },
};

/**
 * Staleness Thresholds (in days)
 */
export const STALENESS_THRESHOLDS = {
  FRESH: 7,
  MODERATE: 30,
  STALE: 90,
};

/**
 * Favorite Limits
 * AC7: User can mark suppliers as favorites
 */
export const FAVORITE_LIMITS = {
  MAX_FAVORITES: 50,
  SHOW_WARNING_AT: 45,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NO_LOCATION: {
    en: 'Location not available. Please enable location services.',
    ur: 'مقام دستیاب نہیں۔ براہ کرم لوکیشن سروسز فعال کریں۔',
    pa: 'ਸਥਾਨ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਸਥਾਨ ਸੇਵਾਵਾਂ ਨੂੰ ਸਮਰੱਥ ਬਣਾਓ।',
    sd: 'جڳھ موجود ناهي. مھرباني ڪري لوڪيشن سروسز کي فعال ڪريو.',
  },
  NO_SUPPLIERS_FOUND: {
    en: 'No suppliers found nearby. Try expanding the search radius.',
    ur: 'قریب کوئی سپلائر نہیں ملا۔ تلاش کی حد بڑھانے کی کوشش کریں۔',
    pa: 'ਨੇੜੇ ਕੋਈ ਸਪਲਾਇਰ ਨਹੀਂ ਮਿਲਿਆ। ਖੋਜ ਦਾ ਦਾਇਰਾ ਵਧਾਉਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    sd: 'ويجھو ڪو سپلائر نه مليو. ڳولا جي دائري کي وڌائڻ جي ڪوشش ڪريو.',
  },
  CALL_FAILED: {
    en: 'Unable to make call. Please check the number or try again.',
    ur: 'کال نہیں کر سکے۔ براہ کرم نمبر چیک کریں یا دوبارہ کوشش کریں۔',
    pa: 'ਕਾਲ ਨਹੀਂ ਕੀਤੀ ਜਾ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਨੰਬਰ ਦੀ ਜਾਂਚ ਕਰੋ ਜਾਂ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    sd: 'ڪال نه ٿي سگھي. مھرباني ڪري نمبر چيڪ ڪريو يا ٻيهر ڪوشش ڪريو.',
  },
  WHATSAPP_NOT_INSTALLED: {
    en: 'WhatsApp is not installed on this device.',
    ur: 'اس ڈیوائس پر واٹس ایپ انسٹال نہیں ہے۔',
    pa: 'ਇਸ ਡਿਵਾਈਸ ਤੇ WhatsApp ਇੰਸਟਾਲ ਨਹੀਂ ਹੈ।',
    sd: 'هن ڊوائيس تي WhatsApp انسٽال نه آهي.',
  },
  FAVORITE_LIMIT_REACHED: {
    en: 'You have reached the maximum number of favorites.',
    ur: 'آپ نے پسندیدہ کی زیادہ سے زیادہ تعداد تک پہنچ لیا ہے۔',
    pa: 'ਤੁਸੀਂ ਪਸੰਦੀਦਾ ਦੀ ਵੱਧ ਤੋਂ ਵੱਧ ਸੰਖਿਆ ਤੱਕ ਪਹੁੰਚ ਗਏ ਹੋ।',
    sd: 'توهان پسنديده جي وڌ ۾ وڌ تعداد تائين پهچي ويا آهيو.',
  },
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  FAVORITE_ADDED: {
    en: 'Supplier added to favorites',
    ur: 'سپلائر پسندیدہ میں شامل ہوا',
    pa: 'ਸਪਲਾਇਰ ਪਸੰਦੀਦਾ ਵਿੱਚ ਸ਼ਾਮਲ ਕੀਤਾ ਗਿਆ',
    sd: 'سپلائر پسنديده ۾ شامل ٿيو',
  },
  FAVORITE_REMOVED: {
    en: 'Supplier removed from favorites',
    ur: 'سپلائر پسندیدہ سے ہٹایا گیا',
    pa: 'ਸਪਲਾਇਰ ਪਸੰਦੀਦਾ ਤੋਂ ਹਟਾਇਆ ਗਿਆ',
    sd: 'سپلائر پسنديده مان هٽايو ويو',
  },
  AVAILABILITY_UPDATED: {
    en: 'Availability updated. Thank you for your contribution!',
    ur: 'دستیابی اپ ڈیٹ ہو گئی۔ آپ کے تعاون کا شکریہ!',
    pa: 'ਉਪਲਬਧਤਾ ਅੱਪਡੇਟ ਕੀਤੀ ਗਈ। ਤੁਹਾਡੇ ਯੋਗਦਾਨ ਲਈ ਧੰਨਵਾਦ!',
    sd: 'موجودگي اپڊيٽ ٿي وئي. توهان جي مدد جو شڪريو!',
  },
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_GEOLOCATION: true,
  ENABLE_MAP_VIEW: true,
  ENABLE_PHONE_CALLS: true,
  ENABLE_WHATSAPP: true,
  ENABLE_SMS: true,
  ENABLE_FAVORITES: true, // AC7
  ENABLE_AVAILABILITY_UPDATES: true, // AC4
  ENABLE_ALTERNATIVE_PRODUCTS: true, // AC5
  ENABLE_DIRECTIONS: true,
  ENABLE_RATINGS: false, // Future feature
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 8,
  MAX_ZOOM: 18,
  CLUSTER_THRESHOLD: 10, // Number of suppliers before clustering
  MARKER_COLOR_IN_STOCK: '#4CAF50',
  MARKER_COLOR_LOW_STOCK: '#FF9800',
  MARKER_COLOR_OUT_OF_STOCK: '#F44336',
  MARKER_COLOR_UNKNOWN: '#9E9E9E',
};

export default {
  SUPPLIER_TYPES,
  AVAILABILITY_STATUS,
  AVAILABILITY_CONFIDENCE,
  SEARCH_RADIUS,
  SEARCH_CONFIG,
  CONTACT_METHODS,
  EQUIVALENCE_TYPES,
  VERIFICATION_STATUS,
  CONTACT_INTENT,
  DISTANCE_UNITS,
  SORT_OPTIONS,
  AVAILABILITY_INDICATORS,
  CONFIDENCE_INDICATORS,
  SUPPLIER_TYPE_LABELS,
  CONTACT_LABELS,
  PHONE_PATTERNS,
  DEFAULT_MESSAGES,
  STALENESS_THRESHOLDS,
  FAVORITE_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURE_FLAGS,
  MAP_CONFIG,
};
