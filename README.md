# Zarai Dost (زرعی دوست) 🌾

**Agricultural Companion for Pakistani Farmers**

An AI-powered mobile application providing agricultural guidance, crop management, and offline support for farmers in Pakistan.

## 🎯 Project Overview

Zarai Dost is a comprehensive farming assistant that works offline-first, helping farmers with:
- **Crop Disease Detection**: AI-powered image analysis (55+ diseases) with on-device and cloud processing
- **Treatment Recommendations**: Comprehensive treatment database with local supplier integration
- **Offline-First Architecture**: Complete offline functionality with intelligent sync
- **Multi-Language Support**: Urdu, Punjabi, and Sindhi language support
- **Field & Crop Management**: Track multiple fields, crops, and health history
- **Weather & Advisory Cache**: Offline access to weather and agricultural advisories
- **Supplier Network**: Location-based supplier search with contact integration

## 📁 Project Structure

```
zaraiDost/
├── apps/
│   └── mobile/              # React Native/Expo mobile app
│       ├── src/
│       │   ├── screens/     # UI screens
│       │   ├── database/    # SQLite data layer
│       │   ├── utils/       # Utility functions
│       │   └── constants/   # App constants
│       └── package.json
│
├── docs/                    # Project documentation
│   ├── prd/                 # Product requirements
│   ├── architecture/        # Technical architecture
│   ├── stories/             # Development stories
│   └── project/             # Project-specific docs
│
└── .bmad-core/             # BMAD development workflow
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**
- **Expo Go** app (for device testing)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd zaraiDost

# Install mobile app dependencies
cd apps/mobile
npm install

# Start development server
npm start
```

### Running the App

See [apps/mobile/README.md](apps/mobile/README.md) for detailed instructions.

**Quick options:**
```bash
cd apps/mobile

# Physical device (recommended)
npm start
# Then scan QR code with Expo Go app

# Android emulator
npm run android

# iOS simulator (Mac only)
npm run ios

# Web browser (limited functionality)
npm run web
```

## 📱 Platform Support

| Platform | Status | Features |
|----------|--------|----------|
| **iOS** | ✅ Full Support | All features including offline SQLite |
| **Android** | ✅ Full Support | All features including offline SQLite |
| **Web** | ✅ UI Preview | Limited - UI testing only, no data persistence |

## 🏗️ Technology Stack

### Mobile App
- **Framework:** React Native with Expo SDK 52
- **Language:** JavaScript (ES6+)
- **Database:** SQLite v3 (expo-sqlite) - 19 tables, version 9
- **Navigation:** React Navigation v6
- **State:** React Hooks
- **Testing:** Jest + React Native Testing Library (25+ test files)
- **Camera:** expo-camera + expo-image-picker
- **Location:** expo-location with GPS integration
- **AI/ML:** TensorFlow Lite architecture (ready for model integration)

### Cloud Services
- **Vision AI:** Google Gemini Vision + OpenAI GPT-4 Vision
- **Storage:** AWS S3 for image uploads (planned)
- **Backend:** Node.js/Express with GraphQL (planned)
- **Database:** PostgreSQL (cloud sync planned)

## 📖 Documentation

- **[Mobile App README](apps/mobile/README.md)** - Detailed mobile app documentation
- **[Architecture](docs/architecture/)** - Technical architecture and design
- **[PRD](docs/prd/)** - Product requirements and specifications
- **[Stories](docs/stories/)** - Development stories and tasks

## 🔧 Development Workflow

This project uses **BMAD-METHOD** for development workflow:

- **PM Agent** - Product management and PRD creation
- **Architect Agent** - System design and architecture
- **SM Agent** - Story creation and sprint planning
- **Dev Agent** - Implementation
- **QA Agent** - Testing and quality assurance

See [AGENTS.md](AGENTS.md) for agent usage details.

## 🌐 Web Platform Notes

The mobile app can run in web browsers for UI testing and development, with the following limitations:

### Web Compatibility Work Done:
1. **Platform-specific imports** for native modules
2. **Mock database** implementation for SQLite
3. **Mock storage** implementation for file system
4. **Platform detection** throughout the codebase

### Files Modified for Web Support:
- `apps/mobile/src/database/config/db.config.js`
- `apps/mobile/src/utils/StorageManager.js`
- `apps/mobile/package.json` (added react-native-web dependencies)

**Note:** Web version is for **development and UI preview only**. Full functionality requires iOS or Android.

## 🧪 Testing

```bash
cd apps/mobile

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

## 📦 Dependencies

### Major Version Compatibility (Updated October 2025)

**Resolved dependency conflicts:**
- React Native: `0.76.3` (updated from 0.81.5)
- React: `18.3.1`
- React DOM: `18.3.1` (for web support)
- Expo SDK: `52.0.17`
- React Native Web: `~0.19.13`

All dependencies are now compatible with Expo SDK 52.

## 🐛 Common Issues & Solutions

### Issue: Expo server error "package.json does not exist"

**Solution:** Always run Expo commands from the mobile app directory:
```bash
cd apps/mobile
npm start
```

### Issue: Dependency conflicts

**Solution:** Use Expo's fix command:
```bash
cd apps/mobile
npx expo install --fix
```

### Issue: Web version buttons not working

**Expected behavior!** Web uses mock database. Check browser console for activity logs. Use iOS/Android for full functionality.

### Issue: "Something went wrong" on Expo Go

**Solution:**
```bash
# 1. Clear Expo Go cache on device
# 2. Restart with clean cache
cd apps/mobile
npm start -- --clear

# 3. Try LAN mode if tunnel fails
npm start -- --lan
```

## 🔐 Environment Variables

Create `.env` files as needed (they're gitignored):

```bash
# apps/mobile/.env.example
EXPO_PUBLIC_API_URL=https://api.zaraidost.com
EXPO_PUBLIC_ENV=development
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Follow the existing code style
3. Write tests for new features
4. Test on both iOS and Android
5. Update documentation
6. Submit pull request

## 📄 License

[Add license information]

## 👥 Team

[Add team information]

## 📞 Support

For issues or questions:
- Check [Troubleshooting sections](#common-issues--solutions)
- Review [mobile app README](apps/mobile/README.md)
- Open an issue with detailed reproduction steps

---

**Made with ❤️ for Pakistani farmers** 🇵🇰

---

## 🎉 Recent Updates

### October 2025 - Major Feature Milestone

**Epic 1 Complete (100%)** - Offline-First Intelligence
- ✅ All 6 stories completed (1.1 through 1.6)
- ✅ Complete offline data storage and sync infrastructure
- ✅ Weather and advisory caching with staleness detection
- ✅ Network monitoring and sync status dashboard
- ✅ 9 database migrations, 19 tables, ~28,000 lines of code

**Epic 3 Progress (44.4%)** - Crop Health Monitoring
- ✅ Image capture with quality validation and GPS (Story 3.1)
- ✅ On-device disease detection for 55+ diseases (Story 3.2)
- ✅ Cloud-based enhanced analysis with Gemini/GPT-4 Vision (Story 3.3)
- ✅ Local supplier integration with 10+ suppliers (Story 3.5)
- 🔄 Treatment recommendations (Story 3.4 - data layer complete)

### Platform Compatibility (October 2025)

- ✅ Fixed React Native version conflicts (0.81.5 → 0.76.3)
- ✅ Added full web platform support with react-native-web
- ✅ Implemented platform-specific code for native modules
- ✅ Created mock database and storage for web preview
- ✅ Updated all dependencies to Expo SDK 52 compatibility

### Current Focus

- 📋 Complete remaining Epic 3 stories (3.4, 3.6, 3.7, 3.8, 3.9)
- 📋 Backend API integration for cloud features
- 📋 Real TensorFlow Lite model training and deployment
- 📋 Beta testing preparation with Pakistani farmers
