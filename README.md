# 🌾 Zarai Dost (زرعی دوست) - Smart Agriculture Platform

> **"Your Farming Friend"** - An offline-first, AI-powered agriculture assistant for smallholder farmers in Pakistan

[![Status](https://img.shields.io/badge/Status-Active%20Development-green)]()
[![Stories Complete](https://img.shields.io/badge/Stories-2%2F22%20Complete-yellow)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Project Status](#project-status)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

Zarai Dost is a comprehensive smart agriculture platform designed specifically for smallholder farmers in Pakistan. The platform provides:

- **Offline-First Operation**: Works without internet connectivity
- **Multilingual Support**: Urdu, Punjabi, Sindhi with voice interaction
- **AI-Powered Insights**: Crop disease detection, irrigation recommendations, market intelligence
- **Voice Accessibility**: Voice commands for low-literacy users
- **Climate Intelligence**: Weather forecasting and climate-smart recommendations

### Target Users
- Smallholder farmers in rural Pakistan
- Limited internet connectivity (2G/3G in remote areas)
- Low digital literacy
- Urdu/regional language speakers

---

## 📊 Project Status

### ✅ Completed (13.6% - 3/22 stories)

#### Epic 1: Offline-First Intelligence
- ✅ **Story 1.1: Local Data Storage Foundation** - COMPLETE
  - SQLite database with 5 tables (farmers, fields, crops, queries, images)
  - Repository pattern (Base + 5 specialized repositories)
  - Storage Manager (<100MB limit enforcement)
  - 3 offline screens (Farm Dashboard, Query History, Crop Details)
  - Migration system with version management

- ✅ **Story 1.2: Background Synchronization Service** - COMPLETE
  - Network monitoring (WiFi/cellular detection, real-time updates)
  - Priority-based sync orchestration (manual > auto > background)
  - Exponential backoff retry (1s→60s max)
  - Conflict resolution (last-write-wins strategy)
  - Sync UI components (SyncButton, SyncStatusIndicator)
  - SyncSettings screen with full sync control panel
  - Background sync (15min intervals)
  - Mock GraphQL API layer (ready for backend)
  - Comprehensive testing infrastructure

- ✅ **Story 1.3: Offline AI Model Storage** - COMPLETE
  - TensorFlow Lite infrastructure (ready for real models)
  - Model download with progress tracking and WiFi-only option
  - Model versioning and update management
  - SHA256 checksum validation for integrity
  - Inference caching with perceptual hashing
  - ModelSettings UI for full model management
  - Support for 50+ disease classes
  - Mock mode for development without trained models
  - Comprehensive testing infrastructure

### 🚧 In Progress

**None** - Ready for Story 1.4 or 3.1!

### 📋 Remaining Stories (19/22)

#### Epic 1: Offline-First Intelligence (3 stories remaining)
- [ ] 1.4: Offline Image Processing Queue
- [ ] 1.5: Offline Weather and Advisory Cache
- [ ] 1.6: Network Status and Sync Monitoring

#### Epic 2: Voice-Powered Accessibility (7 stories)
- [ ] 2.1: Voice Input Foundation (Urdu)
- [ ] 2.2: Multi-Language Voice Support
- [ ] 2.3: Voice Response Output
- [ ] 2.4: Contextual Voice Commands
- [ ] 2.5: Offline Voice Basics
- [ ] 2.6: Voice Clarifications and Error Handling
- [ ] 2.7: Voice Accessibility Settings

#### Epic 3: Crop Health Monitoring (9 stories - ALL APPROVED)
- [ ] 3.1: Image Capture and Upload Interface
- [ ] 3.2: On-Device Disease Detection Model
- [ ] 3.3: Cloud-Based Enhanced Analysis
- [ ] 3.4: Treatment Recommendations Engine
- [ ] 3.5: Local Supplier Integration
- [ ] 3.6: Disease History and Tracking
- [ ] 3.7: Multi-Crop and Field Management
- [ ] 3.8: Multilingual Disease Information
- [ ] 3.9: Confidence and Accuracy Feedback Loop

**Note**: Epics 4-7 (37 additional stories) are documented in PRD but not yet in development sprint.

---

## ✨ Features

### Currently Implemented ✅

#### Local Data Storage
- Offline SQLite database with full CRUD operations
- 5 core entities: Farmers, Fields, Crops, Queries, Images
- Foreign key relationships and indexes
- Automatic data cleanup (90-day query retention, 50-image limit)
- Storage monitoring (<100MB enforcement)

#### Synchronization
- Background sync service with priority queue
- Network monitoring (WiFi/cellular detection)
- Auto-sync on connectivity restoration
- Manual sync controls
- Exponential backoff retry (6 attempts, 1s→60s)
- Conflict resolution (last-write-wins)
- Sync history and statistics
- WiFi-only sync option

#### Mobile UI
- Farm Dashboard with field/crop management
- Query History with search and filtering
- Crop Details with image gallery
- Sync Settings screen with full controls
- Sync status indicator (real-time)
- Manual sync button
- Offline mode indicator
- Empty state handling
- Real-time statistics

#### Data Management
- Repository pattern for data access
- Transaction support for multi-table operations
- Sync status tracking (pending/synced/conflict/failed)
- Timestamp-based conflict detection
- Pending sync counter
- Event-driven sync updates

### Planned Features 🚀

- AI-powered crop disease detection (TensorFlow Lite)
- Voice input/output in Urdu and regional languages
- Weather forecasting and irrigation recommendations
- Market price intelligence
- Climate-smart crop advisory
- Community knowledge sharing

---

## 🏗️ Architecture

### Technology Stack

#### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Local Database**: SQLite (expo-sqlite)
- **State Management**: React Hooks
- **Network**: NetInfo for connectivity detection
- **Testing**: Jest + React Native Testing Library

#### Backend (Planned)
- **API**: Node.js + Express + GraphQL
- **Database**: PostgreSQL
- **Storage**: AWS S3
- **AI/ML**: TensorFlow Serving
- **Cache**: Redis

#### Infrastructure (Planned)
- **Cloud**: AWS CDK
- **Deployment**: AWS ECS/Fargate
- **CI/CD**: GitHub Actions

### Architecture Principles

1. **Offline-First**: All core functionality works without internet
2. **Progressive Enhancement**: Online features enhance but don't block
3. **Data Sovereignty**: User data stored locally first
4. **Sync When Possible**: Background sync when connectivity available
5. **Modular Design**: Microservices for scalability

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (v20.19.4+ recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Studio

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/zarai-dost.git
cd zarai-dost

# Install mobile app dependencies
cd apps/mobile
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (for testing)
npm run web
```

### Running Tests

```bash
cd apps/mobile
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

---

## 💻 Development

### Project Structure

```
zarai-dost/
├── apps/
│   ├── mobile/              # React Native mobile app
│   │   ├── src/
│   │   │   ├── constants/   # App constants
│   │   │   ├── database/    # SQLite layer
│   │   │   │   ├── config/      # DB configuration
│   │   │   │   ├── migrations/  # Schema migrations
│   │   │   │   ├── models/      # Data models
│   │   │   │   └── repositories/ # Data access layer
│   │   │   ├── screens/     # UI screens
│   │   │   ├── components/  # Reusable components
│   │   │   ├── services/    # Business logic
│   │   │   │   └── sync/        # Sync services
│   │   │   ├── utils/       # Utilities
│   │   │   └── __tests__/   # Unit tests
│   │   ├── App.js           # App entry point
│   │   └── package.json
│   ├── api/                 # Backend API (planned)
│   └── web/                 # Web dashboard (planned)
├── packages/
│   ├── ai-wrapper/          # AI model wrapper (planned)
│   └── shared/              # Shared utilities (planned)
├── infrastructure/
│   └── cdk/                 # AWS CDK infrastructure (planned)
├── ml/                      # ML models and training (planned)
├── docs/
│   ├── architecture/        # Architecture documentation
│   ├── prd/                 # Product requirements
│   └── stories/             # User stories (59 stories)
├── .bmad-core/              # BMAD-METHOD agent configs
├── PROGRESS.md              # Detailed progress tracking
└── README.md                # This file
```

### Development Workflow

1. **Story-Driven Development**: Each feature follows a user story
2. **Test-Driven**: Write tests before/with implementation
3. **Code Review**: All changes reviewed before merge
4. **Documentation**: Update docs with each story completion

### Code Standards

- **Language**: JavaScript (React Native)
- **Style**: ESLint + Prettier
- **Testing**: Jest for unit/integration tests
- **Database**: SQLite with migration versioning
- **Commits**: Conventional commits (feat/fix/docs/etc.)

---

## 📚 Documentation

### Available Documentation

- **Product Requirements**: `/docs/prd/` - Detailed PRD with 7 epics
- **Architecture**: `/docs/architecture/` - System architecture and decisions
- **User Stories**: `/docs/stories/` - 59 user stories with acceptance criteria
- **Progress Tracking**: `PROGRESS.md` - Detailed development progress

### Key Documents

- [Product Requirements Document](docs/prd.md)
- [Architecture Document](docs/architecture.md)
- [Progress & Status](PROGRESS.md)
- [Story Index](docs/stories/)

---

## 🤝 Contributing

### Development Team Roles (BMAD-METHOD)

This project uses the BMAD-METHOD with AI agent roles:

- **Product Manager (John)**: PRD creation, product strategy
- **Architect (Winston)**: System design, technology decisions
- **Scrum Master (Bob)**: Story creation, sprint planning
- **Developer (James)**: Implementation, testing
- **QA (Quinn)**: Quality assurance, testing strategy
- **UX Expert (Sally)**: UI/UX design, accessibility

### Getting Help

- Review existing documentation in `/docs/`
- Check user stories in `/docs/stories/`
- See BMAD agents in `AGENTS.md`

---

## 📈 Metrics & Progress

### Code Statistics (as of October 22, 2024)

- **Stories Completed**: 3 / 22 (13.6%)
- **Files Created**: 50
- **Lines of Code**: ~8,000
- **Test Coverage**: ModelManager, ModelMetadataRepository, InferenceCacheRepository, ChecksumValidator, NetworkMonitor, ConflictResolver, FarmerRepository
- **Database Tables**: 7
- **UI Screens**: 5
- **Services**: 12
- **UI Components**: 2

### Sprint Velocity

- **Story 1.1**: 1 day (complete with tests & docs)
- **Story 1.2**: 1 day (complete with tests & docs)
- **Story 1.3**: 1 day (complete with tests & docs)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with React Native and Expo
- Uses TensorFlow Lite for on-device AI
- Inspired by offline-first agriculture platforms
- Designed for smallholder farmers in Pakistan

---

## 📞 Contact

- **Project Lead**: [Your Name]
- **Email**: [your-email]
- **Repository**: [GitHub URL]

---

**Last Updated**: October 22, 2024  
**Version**: 0.1.0-alpha  
**Status**: Active Development
