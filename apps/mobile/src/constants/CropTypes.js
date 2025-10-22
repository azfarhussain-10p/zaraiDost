// Crop Types Constants
// Story 3.1: Image Capture and Upload Interface
// Defines supported crop types for health check submissions

/**
 * Supported crop types with multilingual names
 * Primary language: Urdu (ur) for rural Pakistani farmers
 * Secondary: English (en) for UI consistency
 */
export const CROP_TYPES = [
  {
    id: 'wheat',
    name_en: 'Wheat',
    name_ur: 'گندم',
    name_pun: 'کڻک', // Punjabi
    icon: '🌾',
    season: 'rabi', // Winter crop
    commonDiseases: [
      'leaf_rust',
      'stem_rust',
      'yellow_rust',
      'powdery_mildew',
      'septoria',
    ],
  },
  {
    id: 'rice',
    name_en: 'Rice',
    name_ur: 'چاول',
    name_pun: 'چول',
    icon: '🌾',
    season: 'kharif', // Summer crop
    commonDiseases: ['blast', 'bacterial_blight', 'sheath_blight', 'brown_spot'],
  },
  {
    id: 'cotton',
    name_en: 'Cotton',
    name_ur: 'کپاس',
    name_pun: 'کپاہ',
    icon: '☁️',
    season: 'kharif',
    commonDiseases: [
      'cotton_leaf_curl',
      'boll_rot',
      'bacterial_blight',
      'fusarium_wilt',
    ],
  },
  {
    id: 'sugarcane',
    name_en: 'Sugarcane',
    name_ur: 'گنا',
    name_pun: 'ګنا',
    icon: '🎋',
    season: 'perennial',
    commonDiseases: ['red_rot', 'smut', 'wilt', 'rust'],
  },
  {
    id: 'corn',
    name_en: 'Corn',
    name_ur: 'مکئی',
    name_pun: 'مکئی',
    icon: '🌽',
    season: 'kharif',
    commonDiseases: ['common_rust', 'northern_leaf_blight', 'gray_leaf_spot'],
  },
  {
    id: 'potato',
    name_en: 'Potato',
    name_ur: 'آلو',
    name_pun: 'آلو',
    icon: '🥔',
    season: 'rabi',
    commonDiseases: ['late_blight', 'early_blight', 'bacterial_wilt'],
  },
  {
    id: 'tomato',
    name_en: 'Tomato',
    name_ur: 'ٹماٹر',
    name_pun: 'ٹماٹر',
    icon: '🍅',
    season: 'both',
    commonDiseases: [
      'early_blight',
      'late_blight',
      'bacterial_wilt',
      'fusarium_wilt',
    ],
  },
  {
    id: 'onion',
    name_en: 'Onion',
    name_ur: 'پیاز',
    name_pun: 'پیاز',
    icon: '🧅',
    season: 'rabi',
    commonDiseases: ['purple_blotch', 'downy_mildew', 'basal_rot'],
  },
  {
    id: 'chili',
    name_en: 'Chili',
    name_ur: 'مرچ',
    name_pun: 'مرچ',
    icon: '🌶️',
    season: 'kharif',
    commonDiseases: ['anthracnose', 'bacterial_wilt', 'powdery_mildew'],
  },
  {
    id: 'mango',
    name_en: 'Mango',
    name_ur: 'آم',
    name_pun: 'آم',
    icon: '🥭',
    season: 'perennial',
    commonDiseases: ['anthracnose', 'powdery_mildew', 'bacterial_canker'],
  },
  {
    id: 'citrus',
    name_en: 'Citrus',
    name_ur: 'کینو/نارنگی',
    name_pun: 'کینو',
    icon: '🍊',
    season: 'perennial',
    commonDiseases: ['citrus_canker', 'greening', 'black_spot'],
  },
  {
    id: 'other',
    name_en: 'Other',
    name_ur: 'دیگر',
    name_pun: 'ہور',
    icon: '🌱',
    season: 'any',
    commonDiseases: [],
  },
];

/**
 * Get crop by ID
 * @param {string} cropId - Crop identifier
 * @returns {Object|null} Crop object or null if not found
 */
export function getCropById(cropId) {
  return CROP_TYPES.find((crop) => crop.id === cropId) || null;
}

/**
 * Get crop name in specified language
 * @param {string} cropId - Crop identifier
 * @param {string} lang - Language code ('en', 'ur', 'pun')
 * @returns {string} Localized crop name
 */
export function getCropName(cropId, lang = 'ur') {
  const crop = getCropById(cropId);
  if (!crop) return 'Unknown';

  switch (lang) {
    case 'en':
      return crop.name_en;
    case 'ur':
      return crop.name_ur;
    case 'pun':
      return crop.name_pun;
    default:
      return crop.name_ur; // Default to Urdu
  }
}

/**
 * Search crops by name (fuzzy matching for voice input)
 * @param {string} searchText - Search query
 * @param {string} lang - Language code
 * @returns {Array} Matching crops
 */
export function searchCropsByName(searchText, lang = 'ur') {
  if (!searchText || searchText.trim() === '') {
    return CROP_TYPES;
  }

  const query = searchText.toLowerCase().trim();

  return CROP_TYPES.filter((crop) => {
    const nameEn = crop.name_en.toLowerCase();
    const nameUr = crop.name_ur.toLowerCase();
    const namePun = crop.name_pun.toLowerCase();

    return (
      nameEn.includes(query) ||
      nameUr.includes(query) ||
      namePun.includes(query) ||
      crop.id.includes(query)
    );
  });
}

/**
 * Match crop from voice transcript (fuzzy matching)
 * @param {string} transcript - Voice input transcript
 * @returns {Object|null} Best matching crop or null
 */
export function matchCropFromVoice(transcript) {
  if (!transcript || transcript.trim() === '') {
    return null;
  }

  const query = transcript.toLowerCase().trim();

  // Exact match first
  let match = CROP_TYPES.find(
    (crop) =>
      crop.name_en.toLowerCase() === query ||
      crop.name_ur === query ||
      crop.name_pun === query ||
      crop.id === query
  );

  if (match) return match;

  // Fuzzy match (contains)
  match = CROP_TYPES.find(
    (crop) =>
      crop.name_en.toLowerCase().includes(query) ||
      crop.name_ur.includes(query) ||
      crop.name_pun.includes(query)
  );

  return match || null;
}

/**
 * Get crops by season
 * @param {string} season - 'rabi', 'kharif', 'perennial', or 'any'
 * @returns {Array} Crops for that season
 */
export function getCropsBySeason(season) {
  if (season === 'any' || season === 'both') {
    return CROP_TYPES;
  }

  return CROP_TYPES.filter(
    (crop) => crop.season === season || crop.season === 'both' || crop.season === 'perennial'
  );
}

/**
 * Get all crop IDs
 * @returns {Array<string>} Array of crop IDs
 */
export function getAllCropIds() {
  return CROP_TYPES.map((crop) => crop.id);
}

export default {
  CROP_TYPES,
  getCropById,
  getCropName,
  searchCropsByName,
  matchCropFromVoice,
  getCropsBySeason,
  getAllCropIds,
};

