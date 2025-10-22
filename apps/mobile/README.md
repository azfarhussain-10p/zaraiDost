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

**Current schema version:** 3

**Tables:**
- `farmers` - Farmer profiles
- `fields` - Agricultural fields
- `crops` - Crop records
- `queries` - AI query history
- `images` - Image metadata and cache
- `ai_models` - AI model metadata
- `image_upload_queue` - Offline sync queue

### Web Platform

Uses a **mock database** that:
- Returns empty arrays for queries
- Accepts all writes (but doesn't persist)
- Prevents crashes with stub implementations

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
- `expo` - Development framework
- `react-native` - Mobile framework
- `expo-sqlite` - Database (native only)
- `@react-navigation/native` - Navigation

### Web Support
- `react-native-web` - Web compatibility layer
- `react-dom` - React DOM renderer

### Storage & Files
- `expo-file-system` - File operations (native only)
- `expo-image-picker` - Image selection
- `expo-location` - GPS services

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
