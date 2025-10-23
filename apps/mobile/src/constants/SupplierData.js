// Supplier Sample Data
// Story 3.5: Local Supplier Integration
// Sample Pakistani agricultural suppliers for testing and demonstration

import { SUPPLIER_TYPES, AVAILABILITY_STATUS, EQUIVALENCE_TYPES } from './SupplierConstants';

/**
 * Sample Suppliers
 * Covers major Pakistani cities and agricultural regions
 * AC1, AC2, AC3: Supplier database with location and contact info
 */
export const SAMPLE_SUPPLIERS = [
  // Lahore Region
  {
    id: 'supplier-001',
    name: 'Al-Madina Agricultural Store',
    nameUr: 'المدینہ زرعی سٹور',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03001234567',
    whatsappNumber: '03001234567',
    email: 'almadina@example.com',
    address: 'Main Bazar, Township, Lahore',
    addressUr: 'مین بازار، ٹاؤن شپ، لاہور',
    city: 'Lahore',
    cityUr: 'لاہور',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 31.4697,
    longitude: 74.2728,
    businessHours: '8:00 AM - 8:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    rating: 4.5,
    totalRatings: 124,
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'supplier-002',
    name: 'Punjab Agro Wholesalers',
    nameUr: 'پنجاب ایگرو ہول سیلرز',
    type: SUPPLIER_TYPES.WHOLESALER,
    phone: '03217654321',
    whatsappNumber: '03217654321',
    address: 'Ferozepur Road, Near Kalma Chowk, Lahore',
    addressUr: 'فیروز پور روڈ، کلمہ چوک کے قریب، لاہور',
    city: 'Lahore',
    cityUr: 'لاہور',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 31.4504,
    longitude: 74.2595,
    businessHours: '7:00 AM - 7:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    rating: 4.7,
    totalRatings: 89,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },

  // Faisalabad Region
  {
    id: 'supplier-003',
    name: 'Sitara Pesticide Center',
    nameUr: 'ستارہ کیڑے مار سینٹر',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03009876543',
    whatsappNumber: '03009876543',
    address: 'Civil Lines, D Ground, Faisalabad',
    addressUr: 'سول لائنز، ڈی گراؤنڈ، فیصل آباد',
    city: 'Faisalabad',
    cityUr: 'فیصل آباد',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 31.4181,
    longitude: 73.0776,
    businessHours: '8:00 AM - 9:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    rating: 4.3,
    totalRatings: 67,
    createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'supplier-004',
    name: 'Farmers Cooperative Faisalabad',
    nameUr: 'کسان کوآپریٹو فیصل آباد',
    type: SUPPLIER_TYPES.COOPERATIVE,
    phone: '03334445556',
    address: 'Jaranwala Road, Faisalabad',
    addressUr: 'جڑانوالہ روڈ، فیصل آباد',
    city: 'Faisalabad',
    cityUr: 'فیصل آباد',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 31.3690,
    longitude: 73.0600,
    businessHours: '7:00 AM - 6:00 PM (Mon-Sat)',
    isVerified: true,
    verifiedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    rating: 4.8,
    totalRatings: 156,
    createdAt: Date.now() - 500 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },

  // Multan Region
  {
    id: 'supplier-005',
    name: 'Khan Agriculture Products',
    nameUr: 'خان زرعی مصنوعات',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03112223334',
    whatsappNumber: '03112223334',
    address: 'Bosan Road, Multan',
    addressUr: 'بوسن روڈ، ملتان',
    city: 'Multan',
    cityUr: 'ملتان',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 30.1575,
    longitude: 71.5249,
    businessHours: '8:00 AM - 8:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    rating: 4.4,
    totalRatings: 92,
    createdAt: Date.now() - 250 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },

  // Sahiwal Region
  {
    id: 'supplier-006',
    name: 'Green Valley Pesticides',
    nameUr: 'گرین ویلی کیڑے مار ادویات',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03451112233',
    whatsappNumber: '03451112233',
    address: 'Railway Road, Sahiwal',
    addressUr: 'ریلوے روڈ، ساہیوال',
    city: 'Sahiwal',
    cityUr: 'ساہیوال',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 30.6704,
    longitude: 73.1062,
    businessHours: '7:30 AM - 8:30 PM',
    isVerified: true,
    verifiedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    rating: 4.2,
    totalRatings: 45,
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },

  // Bahawalpur Region
  {
    id: 'supplier-007',
    name: 'Cholistan Agricultural Store',
    nameUr: 'چولستان زرعی سٹور',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03026667778',
    address: 'Circular Road, Bahawalpur',
    addressUr: 'سرکلر روڈ، بہاولپور',
    city: 'Bahawalpur',
    cityUr: 'بہاولپور',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 29.3956,
    longitude: 71.6836,
    businessHours: '8:00 AM - 7:00 PM',
    isVerified: false,
    rating: 4.0,
    totalRatings: 23,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },

  // Gujranwala Region
  {
    id: 'supplier-008',
    name: 'Model Town Agro Center',
    nameUr: 'ماڈل ٹاؤن ایگرو سینٹر',
    type: SUPPLIER_TYPES.WHOLESALER,
    phone: '03335554443',
    whatsappNumber: '03335554443',
    address: 'GT Road, Gujranwala',
    addressUr: 'جی ٹی روڈ، گجرانوالہ',
    city: 'Gujranwala',
    cityUr: 'گجرانوالہ',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 32.1617,
    longitude: 74.1883,
    businessHours: '6:00 AM - 8:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    rating: 4.6,
    totalRatings: 78,
    createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },

  // Sialkot Region
  {
    id: 'supplier-009',
    name: 'Sialkot Farming Solutions',
    nameUr: 'سیالکوٹ فارمنگ سلوشنز',
    type: SUPPLIER_TYPES.SHOP,
    phone: '03129998887',
    address: 'Paris Road, Sialkot',
    addressUr: 'پیرس روڈ، سیالکوٹ',
    city: 'Sialkot',
    cityUr: 'سیالکوٹ',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 32.4922,
    longitude: 74.5319,
    businessHours: '8:00 AM - 7:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
    rating: 4.1,
    totalRatings: 34,
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },

  // Rawalpindi Region
  {
    id: 'supplier-010',
    name: 'Capital Agri Supplies',
    nameUr: 'کیپیٹل ایگری سپلائیز',
    type: SUPPLIER_TYPES.WHOLESALER,
    phone: '03007776665',
    whatsappNumber: '03007776665',
    address: 'Saddar Bazaar, Rawalpindi',
    addressUr: 'صدر بازار، راولپنڈی',
    city: 'Rawalpindi',
    cityUr: 'راولپنڈی',
    province: 'Punjab',
    provinceUr: 'پنجاب',
    latitude: 33.5974,
    longitude: 73.0479,
    businessHours: '7:00 AM - 8:00 PM',
    isVerified: true,
    verifiedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    rating: 4.5,
    totalRatings: 102,
    createdAt: Date.now() - 400 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
];

/**
 * Sample Supplier Products
 * Links suppliers to treatment products with availability
 * AC1, AC4: Product availability at suppliers
 *
 * Note: Product IDs should match treatment products from TreatmentData.js
 */
export const SAMPLE_SUPPLIER_PRODUCTS = [
  // Al-Madina Agricultural Store (supplier-001) - Lahore
  {
    supplierId: 'supplier-001',
    productId: 'product-001', // Propiconazole Fungicide
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    updatedBy: 'admin',
    estimatedPricePkr: 1500,
  },
  {
    supplierId: 'supplier-001',
    productId: 'product-002', // Neem Oil Spray
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 800,
  },
  {
    supplierId: 'supplier-001',
    productId: 'product-003', // Imidacloprid Insecticide
    availabilityStatus: AVAILABILITY_STATUS.LOW_STOCK,
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedBy: 'farmer-001',
    estimatedPricePkr: 1200,
  },

  // Punjab Agro Wholesalers (supplier-002) - Lahore
  {
    supplierId: 'supplier-002',
    productId: 'product-001',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1400, // Wholesaler - cheaper
  },
  {
    supplierId: 'supplier-002',
    productId: 'product-003',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1100,
  },
  {
    supplierId: 'supplier-002',
    productId: 'product-004', // Zinc Sulfate
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 600,
  },

  // Sitara Pesticide Center (supplier-003) - Faisalabad
  {
    supplierId: 'supplier-003',
    productId: 'product-001',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1550,
  },
  {
    supplierId: 'supplier-003',
    productId: 'product-002',
    availabilityStatus: AVAILABILITY_STATUS.OUT_OF_STOCK,
    lastUpdated: Date.now() - 8 * 24 * 60 * 60 * 1000,
    updatedBy: 'farmer-002',
  },

  // Farmers Cooperative (supplier-004) - Faisalabad
  {
    supplierId: 'supplier-004',
    productId: 'product-001',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1350, // Cooperative - subsidized
  },
  {
    supplierId: 'supplier-004',
    productId: 'product-002',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 750,
  },
  {
    supplierId: 'supplier-004',
    productId: 'product-004',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 550,
  },

  // Khan Agriculture Products (supplier-005) - Multan
  {
    supplierId: 'supplier-005',
    productId: 'product-001',
    availabilityStatus: AVAILABILITY_STATUS.LOW_STOCK,
    lastUpdated: Date.now() - 15 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1600,
  },
  {
    supplierId: 'supplier-005',
    productId: 'product-003',
    availabilityStatus: AVAILABILITY_STATUS.IN_STOCK,
    lastUpdated: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedBy: 'admin',
    estimatedPricePkr: 1250,
  },
];

/**
 * Sample Product Alternatives
 * AC5: Alternative products suggested if primary unavailable
 *
 * Note: This is a sample mapping. Real data would come from agricultural experts
 */
export const SAMPLE_PRODUCT_ALTERNATIVES = [
  {
    productId: 'product-001', // Propiconazole Fungicide
    alternativeProductId: 'product-005', // Tebuconazole (similar fungicide)
    equivalenceType: EQUIVALENCE_TYPES.SIMILAR_EFFECT,
    effectivenessRatio: 0.95,
    notes: 'Similar broad-spectrum fungicide, slightly different mechanism',
  },
  {
    productId: 'product-002', // Neem Oil Spray
    alternativeProductId: 'product-006', // Garlic extract (organic alternative)
    equivalenceType: EQUIVALENCE_TYPES.SIMILAR_EFFECT,
    effectivenessRatio: 0.80,
    notes: 'Another organic fungicide option, lower effectiveness',
  },
  {
    productId: 'product-003', // Imidacloprid Insecticide
    alternativeProductId: 'product-007', // Acetamiprid (same class)
    equivalenceType: EQUIVALENCE_TYPES.SAME_INGREDIENT,
    effectivenessRatio: 1.0,
    notes: 'Neonicotinoid insecticide, same active ingredient class',
  },
];

export default {
  SAMPLE_SUPPLIERS,
  SAMPLE_SUPPLIER_PRODUCTS,
  SAMPLE_PRODUCT_ALTERNATIVES,
};
