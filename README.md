# Zarai Dost (زرعی دوست) 🌾

**Agricultural Companion for Pakistani Farmers**

An AI-powered mobile application providing agricultural guidance, crop management, and offline support for farmers in Pakistan.

## 🎯 Project Overview

Zarai Dost is a comprehensive farming assistant that works offline-first, helping farmers with:
- Crop disease identification through image recognition
- Agricultural guidance and best practices
- Field and crop management
- Weather and soil information
- Offline data persistence

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
- **Database:** SQLite (expo-sqlite)
- **Navigation:** React Navigation
- **State:** React Hooks
- **Testing:** Jest + React Native Testing Library

### Future Services
- **Backend:** AWS Lambda + API Gateway (planned)
- **AI/ML:** TensorFlow Lite for on-device inference
- **Cloud:** AWS S3, DynamoDB (planned)

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

### October 2025 - Web Platform Compatibility

- ✅ Fixed React Native version conflicts (0.81.5 → 0.76.3)
- ✅ Added full web platform support with react-native-web
- ✅ Implemented platform-specific code for native modules
- ✅ Created mock database and storage for web preview
- ✅ Updated all dependencies to Expo SDK 52 compatibility

### Current Focus

- Epic 1.1: Local Data Storage Foundation ✅
- Epic 1.2-1.4: Offline capabilities (in progress)
- Future: Backend integration and AI features
