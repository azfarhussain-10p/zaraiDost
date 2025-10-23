# Zarai Dost Mobile App 🌾

A React Native mobile application for Pakistani farmers, providing agricultural guidance and crop management tools.

## 📱 Platform Support

- ✅ **iOS** - Full native support with SQLite
- ✅ **Android** - Full native support with SQLite
- ✅ **Web** - UI preview mode (limited functionality)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo Go app (for device testing)
- Android Studio (for Android emulator) - Optional
- Xcode (for iOS simulator - Mac only) - Optional

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Running on Devices

#### Option 1: Physical Device (Recommended) 📱

1. Install **Expo Go** app:
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Make sure your phone and computer are on the **same WiFi network**

3. Run the development server:
   ```bash
   npm start
   ```

4. **Scan the QR code** displayed in terminal with Expo Go app

5. App loads with **full SQLite database** support! 🎉

#### Option 2: Android Emulator 🤖

```bash
# Start Android emulator first, then:
npm run android
```

#### Option 3: iOS Simulator 🍎 (Mac only)

```bash
npm run ios
```

#### Option 4: Web Browser 🌐

```bash
npm run web
# Or press 'w' in the terminal where npm start is running
```

**Note:** Web version has limited functionality (no SQLite, file system, or native alerts).

## 🌐 Web Platform Compatibility

### What Works on Web:
- ✅ UI rendering and navigation
- ✅ Component interactions
- ✅ Mock database operations (no persistence)
- ✅ All React Native components via react-native-web

### What Doesn't Work on Web:
- ❌ SQLite database persistence (uses mock database)
- ❌ File system access (expo-file-system)
- ❌ Native alerts (Alert.alert)
- ❌ Camera and location services
- ❌ Background tasks

### Platform-Specific Code

The app automatically detects the platform and uses appropriate implementations:

```javascript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code (mock implementations)
} else {
  // Native code (iOS/Android with full features)
}
```

**Modified files for web compatibility:**
- `src/database/config/db.config.js` - Mock database for web
- `src/utils/StorageManager.js` - Mock storage for web

## 📂 Project Structure

```
apps/mobile/
├── src/
│   ├── screens/          # Screen components
│   │   └── offline/      # Offline-capable screens
│   ├── database/         # SQLite database layer
│   │   ├── config/       # DB initialization & config
│   │   ├── repositories/ # Data access layer
│   │   └── migrations/   # Schema migrations
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── assets/               # Images, fonts, etc.
├── App.js               # Root component
├── index.js             # Entry point
└── package.json         # Dependencies

```

## 🛠️ Available Scripts

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator
npm run ios           # Run on iOS simulator (Mac only)
npm run web           # Run in web browser
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
```

## 🗄️ Database

### SQLite (Native Platforms)

The app uses **expo-sqlite** for local data persistence on iOS and Android.

**Database file location:**
- iOS: `~/Library/Application Support/Expo/SQLite/zarai_dost.db`
- Android: `/data/data/host.exp.exponent/databases/zarai_dost.db`

**Current schema version:** 9

**Tables (19 total):**

**Core Data (Story 1.1)**
- `farmers` - Farmer profiles
- `fields` - Agricultural fields
- `crops` - Crop records
- `queries` - AI query history
- `images` - Image metadata and cache

**AI & Models (Stories 1.3, 3.2)**
- `model_metadata` - AI model versioning
- `inference_cache` - Cached inference results
- `diseases` - Disease taxonomy (55 classes)

**Caching (Story 1.5)**
- `weather_cache` - 7-day weather forecasts
- `advisories_cache` - Agricultural advisories
- `cache_metadata` - Cache management

**Sync & Monitoring (Stories 1.2, 1.6)**
- `sync_history` - Sync operation logs
- `data_usage` - Data consumption tracking
- `sync_preferences` - User sync settings
- `sync_state_metadata` - Sync system state

**Crop Health (Stories 3.1, 3.3)**
- `health_checks` - Health check sessions
- `cloud_analysis_queue` - Cloud analysis queue

**Suppliers (Story 3.5)**
- `suppliers` - Supplier directory
- `supplier_products` - Product catalog
- `farmer_favorite_suppliers` - Favorites
- `product_alternatives` - Alternative products
- `farmer_contributions` - Crowdsourced data
- `supplier_contact_attempts` - Contact tracking

### Web Platform

Uses a **mock database** that:
- Returns empty arrays for queries
- Accepts all writes (but doesn't persist)
- Prevents crashes with stub implementations

## ✨ Implemented Features

### Offline-First Intelligence (Epic 1 - 100% Complete)
- ✅ Local SQLite data storage with 19 tables
- ✅ Background synchronization with conflict resolution
- ✅ Offline AI model infrastructure
- ✅ Image processing queue with prioritization
- ✅ Weather and advisory caching (7-day retention)
- ✅ Network monitoring and sync status dashboard
- ✅ Data usage tracking (WiFi/cellular)

### Crop Health Monitoring (Epic 3 - 44% Complete)
- ✅ Camera integration with quality validation
- ✅ Multi-image capture (up to 5 per check)
- ✅ GPS location tagging
- ✅ Crop type selection (12 crops, multilingual)
- ✅ Disease detection (55+ classes)
- ✅ On-device AI analysis (mock-ready)
- ✅ Cloud vision analysis (Gemini, GPT-4V)
- ✅ Multi-image consensus analysis
- ✅ Local supplier search (10+ suppliers)
- ✅ Phone/WhatsApp/SMS integration
- ✅ Product availability tracking
- 🔄 Treatment recommendations (data layer complete)
- 📋 Disease history tracking (planned)
- 📋 Multi-field management (planned)

### Key Capabilities
- **Multilingual**: English, Urdu, Punjabi, Sindhi
- **Offline Operation**: Full functionality without internet
- **Smart Sync**: WiFi-only option, automatic retry
- **Quality Validation**: Blur detection, resolution checks
- **Location Services**: GPS capture with accuracy tracking
- **Crowdsourced Data**: Community availability updates
- **Contact Integration**: Direct calling, WhatsApp, maps

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm test -- --coverage
```

## 📦 Key Dependencies

### Core
- `expo` ^52.0.17 - Development framework
- `react-native` 0.76.9 - Mobile framework
- `react` ^18.3.1 - React library
- `expo-sqlite` ~15.1.4 - Database (native only)
- `@react-navigation/native` ^6.1.18 - Navigation
- `@react-navigation/native-stack` ^6.11.0 - Stack navigation

### Web Support
- `react-native-web` ~0.19.13 - Web compatibility layer
- `react-dom` 18.3.1 - React DOM renderer

### Camera & Images
- `expo-camera` (for camera capture)
- `expo-image-picker` ~16.0.6 - Gallery selection
- `expo-image-manipulator` ~13.0.6 - Image processing
- `expo-file-system` ^18.0.4 - File operations (native only)

### Location & Network
- `expo-location` ~18.0.10 - GPS services
- `@react-native-community/netinfo` ^11.4.1 - Network monitoring

### Background Tasks
- `expo-background-fetch` ~13.0.6 - Background sync
- `expo-task-manager` ~12.0.6 - Task scheduling

### Utilities
- `uuid` ^11.0.4 - Unique ID generation
- `expo-crypto` ~14.0.2 - Cryptographic operations

### Testing
- `jest` ^29.7.0 - Test framework
- `jest-expo` ^52.0.1 - Expo Jest preset
- `@testing-library/react-native` ^12.4.0 - Component testing

## 🐛 Troubleshooting

### "Something went wrong" on Expo Go

**Solution:**
1. Clear Expo Go cache (Profile → Clear cache)
2. Restart Metro bundler: `npm start -- --clear`
3. Try reloading 2-3 times in Expo Go

### Buttons not working on web

**This is expected!** The web version uses mock implementations. Buttons work but won't show visual changes because data isn't persisted. Check browser console for activity logs:

```
[FarmDashboard] 🌾 Creating sample field...
[DB Mock] runAsync called
[FarmDashboard] ✅ Sample field created successfully!
```

### Cannot find module errors

**Solution:**
```bash
# Clear all caches and reinstall
rm -rf node_modules
npm install
npm start -- --clear
```

### Port 8081 already in use

**Solution:**
```bash
# Kill the process using port 8081
# Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8081 | xargs kill -9
```

## 📝 Development Notes

### Adding New Features

1. **Check platform compatibility** - Use `Platform.OS` checks
2. **Test on real devices** - Emulators don't catch all issues
3. **Handle offline scenarios** - App should work without internet
4. **Update migrations** - Increment `DATABASE_VERSION` for schema changes

### Code Style

- Use **functional components** with hooks
- Follow **React Native best practices**
- Add **PropTypes** or TypeScript for type safety
- Write **tests** for business logic
- Document **platform-specific** code clearly

## 🤝 Contributing

1. Create a feature branch
2. Make changes with tests
3. Test on both platforms (iOS & Android)
4. Submit pull request

## 📄 License

[Add license information]

## 🆘 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review console logs for detailed error messages
- Open an issue with reproduction steps

---

**Built with ❤️ for Pakistani farmers** 🇵🇰🌾
