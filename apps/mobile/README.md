# 📱 Zarai Dost Mobile App

> Offline-first mobile application for smallholder farmers in Pakistan

---

## 📋 Overview

The Zarai Dost mobile app is built with React Native and Expo, designed to work primarily offline with smart synchronization when connectivity is available.

### Key Features

#### Currently Implemented ✅
- **Local Data Storage**: SQLite database with 5 tables
- **Offline Viewing**: Farm dashboard, query history, crop details, sync settings
- **Storage Management**: <100MB enforcement with automatic cleanup
- **Network Monitoring**: WiFi/cellular detection with real-time updates
- **Background Synchronization**: Priority-based sync with conflict resolution
- **Sync UI**: Manual sync controls, status indicators, history tracking
- **Conflict Resolution**: Last-write-wins with timestamp comparison
- **Mock API Layer**: GraphQL client ready for backend integration

#### Planned 📋
- Voice input/output (Urdu, Punjabi, Sindhi)
- Crop disease detection with on-device AI
- Weather forecasting and irrigation recommendations
- Market price intelligence

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (v20.19.4+ recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Studio

### Installation

```bash
# Navigate to mobile app
cd apps/mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS (Mac only)
npm run ios

# Run on Android
npm run android

# Run on web (testing only)
npm run web
```

### First Time Setup

The app will automatically:
1. Initialize SQLite database on first launch
2. Create initial schema (version 1)
3. Set up storage management (<100MB)

---

## 📁 Project Structure

```
apps/mobile/
├── App.js                      # Main app entry point
├── package.json                # Dependencies
├── src/
│   ├── constants/              # App constants
│   │   └── DatabaseConstants.js
│   ├── database/               # Data layer
│   │   ├── config/
│   │   │   └── db.config.js    # DB initialization
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.js
│   │   ├── models/             # Data models (5 models)
│   │   │   ├── Farmer.js
│   │   │   ├── Field.js
│   │   │   ├── Crop.js
│   │   │   ├── Query.js
│   │   │   └── Image.js
│   │   └── repositories/       # Data access layer
│   │       ├── BaseRepository.js
│   │       ├── FarmerRepository.js
│   │       ├── FieldRepository.js
│   │       ├── CropRepository.js
│   │       ├── QueryRepository.js
│   │       └── ImageRepository.js
│   ├── screens/                # UI screens
│   │   └── offline/
│   │       ├── FarmDashboard.js
│   │       ├── QueryHistory.js
│   │       └── CropDetails.js
│   ├── services/               # Business logic
│   │   └── sync/               # Sync services (in progress)
│   │       ├── NetworkMonitor.js
│   │       └── SyncService.js
│   ├── utils/                  # Utilities
│   │   └── StorageManager.js
│   └── __tests__/              # Tests
│       └── database/
│           └── FarmerRepository.test.js
└── assets/                     # Images, fonts, etc.
```

---

## 🗃️ Database Schema

### Tables (Version 1)

#### farmers
- `id` (TEXT PRIMARY KEY, UUID)
- `name` (TEXT NOT NULL)
- `phone` (TEXT)
- `location` (TEXT)
- `sync_status` (TEXT, pending/synced/conflict)
- `last_synced_at` (INTEGER)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

#### fields
- `id` (TEXT PRIMARY KEY, UUID)
- `farmer_id` (TEXT, FK → farmers)
- `name` (TEXT NOT NULL)
- `acreage` (REAL)
- `coordinates` (TEXT, JSON)
- `sync_status` (TEXT)
- `last_synced_at` (INTEGER)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

#### crops
- `id` (TEXT PRIMARY KEY, UUID)
- `field_id` (TEXT, FK → fields)
- `crop_type` (TEXT NOT NULL)
- `variety` (TEXT)
- `planting_date` (INTEGER)
- `expected_harvest` (INTEGER)
- `status` (TEXT)
- `sync_status` (TEXT)
- `last_synced_at` (INTEGER)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

#### queries
- `id` (TEXT PRIMARY KEY, UUID)
- `farmer_id` (TEXT, FK → farmers)
- `query_text` (TEXT)
- `query_type` (TEXT)
- `response` (TEXT)
- `sync_status` (TEXT)
- `last_synced_at` (INTEGER)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

#### images
- `id` (TEXT PRIMARY KEY, UUID)
- `crop_id` (TEXT, FK → crops)
- `local_uri` (TEXT NOT NULL)
- `remote_url` (TEXT)
- `analysis_result` (TEXT, JSON)
- `sync_status` (TEXT)
- `last_synced_at` (INTEGER)
- `created_at` (INTEGER)
- `updated_at` (INTEGER)

### Indexes
- `idx_farmer_sync` on `farmers(sync_status, last_synced_at)`
- `idx_field_farmer` on `fields(farmer_id)`
- `idx_crop_field` on `crops(field_id, status)`
- `idx_query_farmer` on `queries(farmer_id, created_at)`
- `idx_image_crop` on `images(crop_id)`

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Files

- `src/__tests__/database/FarmerRepository.test.js` - Repository CRUD operations

### Test Coverage Goal
- Target: 80% coverage for core business logic
- Current: Basic coverage (Story 1.1 only)

---

## 📦 Dependencies

### Core
- `react-native`: ^0.81.5
- `expo`: ^52.0.17
- `react`: ^18.3.1

### Navigation
- `@react-navigation/native`: ^6.1.18
- `@react-navigation/native-stack`: ^6.11.0

### Database
- `expo-sqlite`: ^15.0.3
- `uuid`: ^11.0.3

### Network & Sync (Story 1.2)
- `@react-native-community/netinfo`: ^11.4.1
- `expo-background-fetch`: ^14.0.7
- `expo-task-manager`: ^14.0.8

### Future Dependencies
- `expo-camera`: For image capture (Story 3.1)
- `@tensorflow/tfjs-react-native`: For on-device AI (Story 3.2)
- `apollo-client`: For GraphQL sync (Story 1.2)
- `expo-speech`: For text-to-speech (Story 2.3)

---

## 🔧 Configuration

### Database Configuration

```javascript
// src/database/config/db.config.js
export const DATABASE_NAME = 'zaraiDost.db';
export const DATABASE_VERSION = 1;
```

### Storage Limits

```javascript
// src/constants/DatabaseConstants.js
export const STORAGE_LIMITS = {
  MAX_DB_SIZE_MB: 100,
  QUERY_RETENTION_DAYS: 90,
  MAX_IMAGES_PER_CROP: 50,
};
```

---

## 🐛 Troubleshooting

### Database Issues

**Problem**: Database not initializing
```bash
# Clear app data and restart
expo start -c
```

**Problem**: Migration errors
```bash
# Check database version in logs
# Uninstall and reinstall app to reset DB
```

### Dependency Issues

**Problem**: npm install fails
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps
```

---

## 📊 Performance

### Current Metrics
- App size: ~50MB (without AI models)
- Database size: <10MB (test data)
- Cold start: ~3s
- Database queries: <50ms average

### Storage Usage
- SQLite database: <100MB limit enforced
- Image cache: 50 images max per crop
- Query history: 90-day retention

---

## 🚀 Deployment

### Build Commands

```bash
# Development build
expo build:android -t apk
expo build:ios -t simulator

# Production build
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Environment Variables

```bash
# .env (not in git)
API_URL=https://api.zaraidost.com/graphql
GOOGLE_CLOUD_API_KEY=your_key_here
AWS_S3_BUCKET=zaraidost-images
```

---

## 📝 Development Notes

### Code Standards
- **Language**: JavaScript (React Native)
- **Style**: ESLint + Prettier
- **Commits**: Conventional commits (feat/fix/docs)
- **Testing**: Jest + React Native Testing Library

### Architecture Patterns
- **Repository Pattern**: For data access abstraction
- **Service Layer**: For business logic (sync, storage)
- **Singleton Services**: NetworkMonitor, SyncService
- **Functional Components**: React hooks for state

### Known Issues
1. Story 1.2 sync uses mock GraphQL API (backend not implemented yet)
   - Real GraphQL endpoints will replace mock when backend is ready
   - All GraphQL mutations and queries are defined and ready
2. Background sync requires platform permissions setup
3. Additional integration tests needed for full sync flow

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Project Architecture](../../docs/architecture.md)
- [User Stories](../../docs/stories/)

---

**Version**: 0.1.0  
**Last Updated**: October 22, 2024  
**Status**: Active Development
