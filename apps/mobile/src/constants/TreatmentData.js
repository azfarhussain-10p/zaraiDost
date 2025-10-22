// Treatment Data for Pakistani Crops
// Story 3.4: Treatment Recommendations Engine
// AC1: Treatment recommendations linked to each disease
// AC2: Multiple treatment options (chemical, organic, cultural)

import {
  TREATMENT_TYPES,
  TREATMENT_CATEGORIES,
  COST_CATEGORIES,
  APPLICATION_METHODS,
  SAFETY_CLASSES,
  PPE_TYPES,
} from './TreatmentConstants';

/**
 * Comprehensive Treatment Database
 * Links diseases to specific treatments with Pakistani context
 */
export const TREATMENTS = [
  // ============ FUNGICIDES - CHEMICAL ============
  {
    id: 'treatment-001',
    nameEn: 'Propiconazole Fungicide',
    nameUr: 'پروپیکونازول فنگسائڈ',
    namePa: 'ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ ਫੰਗੀਸਾਈਡ',
    nameSd: 'پراپيڪونازول فنگي سائيڊ',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.FUNGICIDE,
    activeIngredient: 'Propiconazole 25% EC',
    costCategory: COST_CATEGORIES.MEDIUM,
    effectivenessRating: 0.90,
    applicationMethod: APPLICATION_METHODS.SPRAY,
    dosagePerAcre: '200-250ml per acre',
    timingGuidance: 'Apply at first sign of disease or preventatively during susceptible growth stages',
    safetyClass: SAFETY_CLASSES.MODERATE_RISK,
    ppeRequired: [PPE_TYPES.GLOVES, PPE_TYPES.MASK, PPE_TYPES.LONG_SLEEVES, PPE_TYPES.GOGGLES],
    reentryIntervalHours: 24,
    preharvestIntervalDays: 14,
    descriptionEn: 'Systemic fungicide effective against rusts, leaf spots, and other fungal diseases',
    descriptionUr: 'زنگ، پتوں کے دھبوں اور دیگر فنگل بیماریوں کے خلاف مؤثر سیسٹمک فنگسائڈ',
    instructionsEn: 'Mix recommended dose in 80-100 liters of water per acre. Spray thoroughly covering all affected plant parts.',
    instructionsUr: 'تجویز کردہ مقدار کو فی ایکڑ 80-100 لیٹر پانی میں ملائیں۔ تمام متاثرہ پودوں کے حصوں کو اچھی طرح سپرے کریں۔',
    precautionsEn: 'Do not spray during flowering. Avoid drift to non-target areas. Store away from food and feed.',
    precautionsUr: 'پھول آنے کے دوران سپرے نہ کریں۔ غیر ہدف والے علاقوں میں بہاؤ سے بچیں۔ کھانے اور چارے سے دور رکھیں۔',
    diseases: ['disease-001', 'disease-002', 'disease-003'], // Wheat rusts
  },

  {
    id: 'treatment-002',
    nameEn: 'Mancozeb Fungicide',
    nameUr: 'مانکوزیب فنگسائڈ',
    namePa: 'ਮੈਨਕੋਜ਼ੇਬ ਫੰਗੀਸਾਈਡ',
    nameSd: 'منڪوزيب فنگي سائيڊ',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.FUNGICIDE,
    activeIngredient: 'Mancozeb 75% WP',
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.80,
    applicationMethod: APPLICATION_METHODS.SPRAY,
    dosagePerAcre: '500-600 grams per acre',
    timingGuidance: 'Apply as protective spray before disease appears or at first symptoms',
    safetyClass: SAFETY_CLASSES.MODERATE_RISK,
    ppeRequired: [PPE_TYPES.GLOVES, PPE_TYPES.MASK, PPE_TYPES.GOGGLES],
    reentryIntervalHours: 24,
    preharvestIntervalDays: 7,
    descriptionEn: 'Broad-spectrum protective fungicide for various fungal diseases',
    descriptionUr: 'مختلف فنگل بیماریوں کے لیے وسیع سپیکٹرم حفاظتی فنگسائڈ',
    instructionsEn: 'Mix powder in water and spray uniformly on crop',
    instructionsUr: 'پاؤڈر کو پانی میں ملائیں اور فصل پر یکساں طور پر سپرے کریں',
    precautionsEn: 'Wear protective clothing. Avoid inhalation of dust.',
    precautionsUr: 'حفاظتی لباس پہنیں۔ دھول کو سانس میں لینے سے بچیں۔',
    diseases: ['disease-004', 'disease-010', 'disease-011'], // Rice diseases
  },

  // ============ FUNGICIDES - ORGANIC ============
  {
    id: 'treatment-003',
    nameEn: 'Neem Oil Spray',
    nameUr: 'نیم کا تیل',
    namePa: 'ਨਿੰਮ ਦਾ ਤੇਲ',
    nameSd: 'نيم جو تيل',
    type: TREATMENT_TYPES.ORGANIC,
    category: TREATMENT_CATEGORIES.FUNGICIDE,
    activeIngredient: 'Neem oil (Azadirachtin)',
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.65,
    applicationMethod: APPLICATION_METHODS.SPRAY,
    dosagePerAcre: '500-750ml per acre',
    timingGuidance: 'Apply early morning or late evening for best results',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.GLOVES],
    reentryIntervalHours: 4,
    preharvestIntervalDays: 0,
    descriptionEn: 'Natural organic fungicide and pest repellent from neem tree',
    descriptionUr: 'نیم کے درخت سے قدرتی نامیاتی فنگسائڈ اور کیڑوں سے بچاؤ',
    instructionsEn: 'Mix 0.5-1% solution in water with mild soap as emulsifier. Spray weekly.',
    instructionsUr: '0.5-1% محلول پانی میں ہلکے صابن کے ساتھ ملائیں۔ ہفتہ وار سپرے کریں۔',
    precautionsEn: 'Safe for beneficial insects. Avoid direct sunlight after spray.',
    precautionsUr: 'مفید کیڑوں کے لیے محفوظ۔ سپرے کے بعد سیدھی دھوپ سے بچیں۔',
    diseases: ['disease-001', 'disease-004', 'disease-020', 'disease-030'],
  },

  {
    id: 'treatment-004',
    nameEn: 'Sulfur Dust',
    nameUr: 'گندھک کا پاؤڈر',
    namePa: 'ਗੰਧਕ ਪਾਊਡਰ',
    nameSd: 'گنڍڪ جو پائوڊر',
    type: TREATMENT_TYPES.ORGANIC,
    category: TREATMENT_CATEGORIES.FUNGICIDE,
    activeIngredient: 'Elemental Sulfur',
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.70,
    applicationMethod: APPLICATION_METHODS.SPRAY,
    dosagePerAcre: '3-4 kg per acre',
    timingGuidance: 'Apply in early stages of disease development',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.MASK, PPE_TYPES.GLOVES],
    reentryIntervalHours: 24,
    preharvestIntervalDays: 1,
    descriptionEn: 'Natural fungicide effective against powdery mildew and other fungal diseases',
    descriptionUr: 'پاؤڈری پھپھوندی اور دیگر فنگل بیماریوں کے خلاف قدرتی فنگسائڈ',
    instructionsEn: 'Dust or spray on plants. Do not apply when temperature exceeds 32°C',
    instructionsUr: 'پودوں پر دھول یا سپرے کریں۔ جب درجہ حرارت 32 ڈگری سے زیادہ ہو تو استعمال نہ کریں',
    precautionsEn: 'Can damage plants in high heat. Keep away from fire.',
    precautionsUr: 'زیادہ گرمی میں پودوں کو نقصان پہنچا سکتا ہے۔ آگ سے دور رکھیں۔',
    diseases: ['disease-005', 'disease-015'],
  },

  // ============ INSECTICIDES - CHEMICAL ============
  {
    id: 'treatment-005',
    nameEn: 'Imidacloprid Insecticide',
    nameUr: 'امیڈاکلوپرڈ کیڑے مار',
    namePa: 'ਇਮੀਡਾਕਲੋਪ੍ਰਿਡ ਕੀਟਨਾਸ਼ਕ',
    nameSd: 'اميڊاڪلوپريڊ ڪيڙا مار',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.INSECTICIDE,
    activeIngredient: 'Imidacloprid 17.8% SL',
    costCategory: COST_CATEGORIES.MEDIUM,
    effectivenessRating: 0.85,
    applicationMethod: APPLICATION_METHODS.SPRAY,
    dosagePerAcre: '100-125ml per acre',
    timingGuidance: 'Apply at early pest infestation stage',
    safetyClass: SAFETY_CLASSES.MODERATE_RISK,
    ppeRequired: [PPE_TYPES.GLOVES, PPE_TYPES.MASK, PPE_TYPES.LONG_SLEEVES],
    reentryIntervalHours: 24,
    preharvestIntervalDays: 21,
    descriptionEn: 'Systemic insecticide for sucking and chewing pests',
    descriptionUr: 'چوسنے اور چبانے والے کیڑوں کے لیے سیسٹمک کیڑے مار',
    instructionsEn: 'Mix with water and spray on affected plants. Effective against aphids, whiteflies, jassids.',
    instructionsUr: 'پانی میں ملائیں اور متاثرہ پودوں پر سپرے کریں۔ افڈز، سفید مکھیوں، جاسیڈز کے خلاف مؤثر۔',
    precautionsEn: 'Toxic to bees - avoid spraying during flowering. Keep away from water sources.',
    precautionsUr: 'شہد کی مکھیوں کے لیے زہریلا - پھول کے دوران سپرے نہ کریں۔ پانی کے ذرائع سے دور رکھیں۔',
    diseases: ['disease-020', 'disease-021', 'disease-022'], // Cotton pests
  },

  // ============ CULTURAL PRACTICES ============
  {
    id: 'treatment-006',
    nameEn: 'Remove Infected Plant Parts',
    nameUr: 'متاثرہ پودوں کے حصے ہٹائیں',
    namePa: 'ਪ੍ਰਭਾਵਿਤ ਪੌਦਿਆਂ ਦੇ ਹਿੱਸੇ ਹਟਾਓ',
    nameSd: 'متاثر ٻوٽن جا حصا هٽايو',
    type: TREATMENT_TYPES.CULTURAL,
    category: TREATMENT_CATEGORIES.PRACTICE,
    activeIngredient: null,
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.75,
    applicationMethod: APPLICATION_METHODS.MANUAL_REMOVAL,
    dosagePerAcre: null,
    timingGuidance: 'Immediately upon detection of disease',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.GLOVES],
    reentryIntervalHours: 0,
    preharvestIntervalDays: 0,
    descriptionEn: 'Manual removal and destruction of infected plant material to prevent disease spread',
    descriptionUr: 'بیماری کے پھیلاؤ کو روکنے کے لیے متاثرہ پودوں کے مواد کو دستی طور پر ہٹانا اور تباہ کرنا',
    instructionsEn: 'Carefully remove infected leaves, stems, or plants. Burn or bury deeply away from field. Do not compost diseased material.',
    instructionsUr: 'احتیاط سے متاثرہ پتے، تنے یا پودے ہٹائیں۔ کھیت سے دور جلائیں یا گہرائی میں دفن کریں۔ بیمار مواد کو کھاد نہ بنائیں۔',
    precautionsEn: 'Sanitize tools after use. Wash hands thoroughly.',
    precautionsUr: 'استعمال کے بعد آلات کو صاف کریں۔ ہاتھ اچھی طرح دھوئیں۔',
    diseases: ['disease-001', 'disease-002', 'disease-003', 'disease-004', 'disease-010', 'disease-020'],
  },

  {
    id: 'treatment-007',
    nameEn: 'Crop Rotation',
    nameUr: 'فصلوں کی تبدیلی',
    namePa: 'ਫਸਲ ਬਦਲੀ',
    nameSd: 'فصلن جي ڦيرڦار',
    type: TREATMENT_TYPES.CULTURAL,
    category: TREATMENT_CATEGORIES.PRACTICE,
    activeIngredient: null,
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.80,
    applicationMethod: null,
    dosagePerAcre: null,
    timingGuidance: 'Next planting season',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [],
    reentryIntervalHours: 0,
    preharvestIntervalDays: 0,
    descriptionEn: 'Rotate to non-host crops to break disease cycle',
    descriptionUr: 'بیماری کے چکر کو توڑنے کے لیے غیر میزبان فصلوں میں تبدیلی',
    instructionsEn: 'Plant non-susceptible crops for 1-2 seasons. Avoid same crop family. Good rotations: wheat-cotton, rice-vegetables.',
    instructionsUr: '1-2 موسموں کے لیے غیر حساس فصلیں لگائیں۔ ایک ہی فصل خاندان سے بچیں۔ اچھی تبدیلیاں: گندم-کپاس، چاول-سبزیاں۔',
    precautionsEn: 'Plan rotation based on disease history and soil health.',
    precautionsUr: 'بیماری کی تاریخ اور مٹی کی صحت کی بنیاد پر تبدیلی کی منصوبہ بندی کریں۔',
    diseases: ['disease-001', 'disease-010', 'disease-030'],
  },

  // ============ FERTILIZERS FOR DEFICIENCIES ============
  {
    id: 'treatment-008',
    nameEn: 'Urea Fertilizer (Nitrogen)',
    nameUr: 'یوریا کھاد (نائٹروجن)',
    namePa: 'ਯੂਰੀਆ ਖਾਦ (ਨਾਈਟ੍ਰੋਜਨ)',
    nameSd: 'يوريا کاڻ (نائيٽروجن)',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.FERTILIZER,
    activeIngredient: 'Urea 46% N',
    costCategory: COST_CATEGORIES.LOW,
    effectivenessRating: 0.95,
    applicationMethod: APPLICATION_METHODS.SOIL_BROADCAST,
    dosagePerAcre: '25-30 kg per acre for wheat, 30-35 kg for rice',
    timingGuidance: 'Apply in split doses - first at sowing, second at tillering/booting stage',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.GLOVES],
    reentryIntervalHours: 0,
    preharvestIntervalDays: 0,
    descriptionEn: 'Nitrogen fertilizer for treating nitrogen deficiency',
    descriptionUr: 'نائٹروجن کی کمی کے علاج کے لیے نائٹروجن کھاد',
    instructionsEn: 'Broadcast uniformly and incorporate into soil. Apply when soil has moisture. Water immediately if dry.',
    instructionsUr: 'یکساں طور پر پھیلائیں اور مٹی میں ملائیں۔ جب مٹی میں نمی ہو تو لگائیں۔ اگر خشک ہو تو فوری طور پر پانی دیں۔',
    precautionsEn: 'Store in dry place. Avoid over-application which can cause lodging.',
    precautionsUr: 'خشک جگہ پر رکھیں۔ زیادہ استعمال سے بچیں جو گرنے کا سبب بن سکتا ہے۔',
    diseases: ['disease-050'], // Nitrogen deficiency
  },

  {
    id: 'treatment-009',
    nameEn: 'DAP Fertilizer (Phosphorus)',
    nameUr: 'ڈی اے پی کھاد (فاسفورس)',
    namePa: 'ਡੀ ਏ ਪੀ ਖਾਦ (ਫਾਸਫੋਰਸ)',
    nameSd: 'ڊي اي پي ڪاڻ (فاسفورس)',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.FERTILIZER,
    activeIngredient: 'Di-Ammonium Phosphate (18-46-0)',
    costCategory: COST_CATEGORIES.MEDIUM,
    effectivenessRating: 0.92,
    applicationMethod: APPLICATION_METHODS.SOIL_BROADCAST,
    dosagePerAcre: '25-30 kg per acre',
    timingGuidance: 'Apply at sowing time or as basal dose',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.GLOVES],
    reentryIntervalHours: 0,
    preharvestIntervalDays: 0,
    descriptionEn: 'Phosphorus fertilizer for treating phosphorus deficiency and improving root development',
    descriptionUr: 'فاسفورس کی کمی کے علاج اور جڑوں کی نشوونما کے لیے فاسفورس کھاد',
    instructionsEn: 'Mix with soil at planting time. Can also be applied as side dressing.',
    instructionsUr: 'بوائی کے وقت مٹی میں ملائیں۔ سائیڈ ڈریسنگ کے طور پر بھی لگایا جا سکتا ہے۔',
    precautionsEn: 'Store away from moisture. Avoid direct contact with seeds.',
    precautionsUr: 'نمی سے دور رکھیں۔ بیجوں کے ساتھ براہ راست رابطے سے بچیں۔',
    diseases: ['disease-051'], // Phosphorus deficiency
  },

  {
    id: 'treatment-010',
    nameEn: 'Potash Fertilizer (Potassium)',
    nameUr: 'پوٹاش کھاد (پوٹاشیم)',
    namePa: 'ਪੋਟਾਸ਼ ਖਾਦ (ਪੋਟਾਸ਼ੀਅਮ)',
    nameSd: 'پوٽاش ڪاڻ (پوٽاشيم)',
    type: TREATMENT_TYPES.CHEMICAL,
    category: TREATMENT_CATEGORIES.FERTILIZER,
    activeIngredient: 'Muriate of Potash (KCl 60% K2O)',
    costCategory: COST_CATEGORIES.MEDIUM,
    effectivenessRating: 0.90,
    applicationMethod: APPLICATION_METHODS.SOIL_BROADCAST,
    dosagePerAcre: '15-20 kg per acre',
    timingGuidance: 'Apply at flowering or fruit development stage',
    safetyClass: SAFETY_CLASSES.LOW_RISK,
    ppeRequired: [PPE_TYPES.GLOVES],
    reentryIntervalHours: 0,
    preharvestIntervalDays: 0,
    descriptionEn: 'Potassium fertilizer for improving disease resistance and crop quality',
    descriptionUr: 'بیماری کی مزاحمت اور فصل کے معیار کو بہتر بنانے کے لیے پوٹاشیم کھاد',
    instructionsEn: 'Broadcast and incorporate into soil. Can be applied with irrigation water.',
    instructionsUr: 'پھیلائیں اور مٹی میں شامل کریں۔ آبپاشی کے پانی کے ساتھ لگایا جا سکتا ہے۔',
    precautionsEn: 'Avoid chloride-sensitive crops. Store in dry conditions.',
    precautionsUr: 'کلورائیڈ حساس فصلوں سے بچیں۔ خشک حالات میں رکھیں۔',
    diseases: ['disease-052'], // Potassium deficiency
  },
];

/**
 * Disease-Treatment Mappings
 * Links specific diseases to recommended treatments
 */
export const DISEASE_TREATMENT_MAPPINGS = {
  // Wheat diseases
  'disease-001': ['treatment-001', 'treatment-003', 'treatment-006'], // Wheat Leaf Rust
  'disease-002': ['treatment-001', 'treatment-006', 'treatment-007'], // Wheat Yellow Rust
  'disease-003': ['treatment-001', 'treatment-006'], // Wheat Stem Rust

  // Rice diseases
  'disease-010': ['treatment-002', 'treatment-003', 'treatment-006', 'treatment-007'], // Rice Blast
  'disease-011': ['treatment-002', 'treatment-006'], // Bacterial Blight

  // Cotton pests
  'disease-020': ['treatment-005', 'treatment-003', 'treatment-006'], // Cotton Bollworm
  'disease-021': ['treatment-005', 'treatment-003'], // Whitefly
  'disease-022': ['treatment-005'], // Jassids

  // Nutrient deficiencies
  'disease-050': ['treatment-008'], // Nitrogen deficiency
  'disease-051': ['treatment-009'], // Phosphorus deficiency
  'disease-052': ['treatment-010'], // Potassium deficiency
};

/**
 * Get treatments for a disease
 */
export function getTreatmentsForDisease(diseaseId) {
  const treatmentIds = DISEASE_TREATMENT_MAPPINGS[diseaseId] || [];
  return TREATMENTS.filter(t => treatmentIds.includes(t.id));
}

/**
 * Get treatment by ID
 */
export function getTreatmentById(treatmentId) {
  return TREATMENTS.find(t => t.id === treatmentId);
}

/**
 * Filter treatments by type
 */
export function filterTreatmentsByType(treatments, type) {
  return treatments.filter(t => t.type === type);
}

/**
 * Filter treatments by cost category
 */
export function filterTreatmentsByCost(treatments, costCategory) {
  return treatments.filter(t => t.costCategory === costCategory);
}

export default {
  TREATMENTS,
  DISEASE_TREATMENT_MAPPINGS,
  getTreatmentsForDisease,
  getTreatmentById,
  filterTreatmentsByType,
  filterTreatmentsByCost,
};
