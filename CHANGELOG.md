# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README documentation for mobile app
- Root project README with quick start guide
- Web platform preview support (UI testing only)
- Platform detection throughout codebase
- Mock database implementation for web platform
- Mock storage manager for web platform
- Detailed troubleshooting guides

### Changed
- **BREAKING:** Updated React Native from 0.81.5 to 0.76.3 for Expo 52 compatibility
- Updated React to 18.3.1 (from 19.x which was incompatible)
- Updated React DOM to 18.3.1 for web support
- Made `expo-sqlite` conditionally loaded (native platforms only)
- Made `expo-file-system` conditionally loaded (native platforms only)
- Modified `db.config.js` to be platform-aware
- Modified `StorageManager.js` to handle web platform gracefully

### Fixed
- Resolved peer dependency conflicts between React Native and Expo SDK 52
- Fixed react-native-web version mismatch (0.21.2 → 0.19.13)
- Fixed React DOM version conflict (19.2.0 → 18.3.1)
- Fixed SQLite module loading crashes on web
- Fixed file system access errors on web
- Fixed button functionality by handling storage operations on web
- Fixed Metro bundler compatibility issues

## [1.0.0] - 2025-10-22

### Added
- Initial project setup with Expo SDK 52
- SQLite database implementation with migrations
- Offline-first architecture
- Farm Dashboard screen
- Field and Crop management
- Query history tracking
- Storage management utilities
- Base repository pattern for data access
- Database migrations system (v1-v3)

### Native Features (iOS/Android)
- Full SQLite database persistence
- File system access for image storage
- Background task support
- Location services
- Camera and image picker integration

### Web Preview Features
- UI rendering and navigation
- Component interactions (with mock data)
- Development and testing interface
- No data persistence (mock implementations)

## Project Structure

### Mobile App (`apps/mobile/`)
- React Native with Expo framework
- Offline-first with SQLite
- Repository pattern for data access
- Screen-based navigation

### Documentation (`docs/`)
- Product Requirements (PRD)
- Technical Architecture
- Development Stories
- QA Reports

### Development Workflow (`.bmad-core/`)
- BMAD-METHOD agent system
- Automated task workflows
- Quality gates and checklists

## Platform Compatibility Matrix

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| UI Rendering | ✅ | ✅ | ✅ |
| Navigation | ✅ | ✅ | ✅ |
| SQLite Database | ✅ | ✅ | ⚠️ Mock |
| File System | ✅ | ✅ | ⚠️ Mock |
| Camera | ✅ | ✅ | ❌ |
| Location | ✅ | ✅ | ❌ |
| Background Tasks | ✅ | ✅ | ❌ |
| Native Alerts | ✅ | ✅ | ❌ |

Legend:
- ✅ Fully supported
- ⚠️ Mock implementation (no persistence)
- ❌ Not supported

## Dependencies

### Core Dependencies
- `expo`: ^52.0.17
- `react`: ^18.3.1
- `react-native`: 0.76.3
- `expo-sqlite`: ^15.0.3
- `@react-navigation/native`: ^6.1.18

### Web Support
- `react-dom`: 18.3.1
- `react-native-web`: ~0.19.13

### Utilities
- `expo-file-system`: ^18.0.4
- `expo-image-picker`: ^16.0.2
- `expo-location`: ^18.0.4
- `uuid`: ^11.0.4

### Development
- `jest`: ^29.7.0
- `jest-expo`: ^52.0.1
- `@testing-library/react-native`: ^12.4.0

## Known Issues

### Web Platform
1. **Data Persistence:** Web version uses mock database - data is not saved
2. **Native Alerts:** `Alert.alert()` doesn't work on web - check console instead
3. **File System:** No real file access - mock implementation returns empty data
4. **Camera/Location:** Native features not available on web

### Workarounds
- Use iOS/Android for full functionality
- Web version is for UI testing and development only
- Console logging added for button interactions on web

## Migration Notes

### Upgrading from React Native 0.81.5 to 0.76.3

If you have an existing installation:

```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npm install
npx expo install --fix
npm start -- --clear
```

### Platform-Specific Code Pattern

When adding new features, use this pattern:

```javascript
import { Platform } from 'react-native';

// Platform-specific imports
let NativeModule = null;
if (Platform.OS !== 'web') {
  NativeModule = require('native-module');
}

// Usage
if (Platform.OS === 'web') {
  // Web implementation (often mock)
  return mockData;
} else {
  // Native implementation
  return await NativeModule.doSomething();
}
```

## Acknowledgments

- Expo team for the excellent framework
- React Native community for web support
- BMAD-METHOD for development workflow

---

**For Developers:** When adding new features, always test on:
1. ✅ iOS Simulator/Device
2. ✅ Android Emulator/Device
3. ✅ Web Browser (to ensure it doesn't break)

**For Contributors:** Update this CHANGELOG with your changes following the format above.
