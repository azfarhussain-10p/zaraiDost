# Zarai Dost Mobile App

React Native mobile application for Zarai Dost - AI-powered agricultural advisory platform.

## Overview

The mobile app is the primary interface for farmers to access Zarai Dost's features. Built with React Native and Expo, it provides offline-first functionality, voice input in regional languages, and on-device AI processing for crop disease detection.

## Features

- **Offline-First Architecture**: Full functionality without internet connectivity
- **On-Device AI**: TensorFlow Lite models for crop disease detection
- **Voice Interface**: Speech-to-text in Urdu, Punjabi, and Sindhi
- **Camera Integration**: Image capture for crop health analysis
- **Weather Forecasts**: Location-based agricultural weather data
- **Market Prices**: Real-time and predicted crop prices
- **Community Network**: Farmer-to-farmer knowledge sharing
- **SMS Fallback**: Advisory delivery via SMS for feature phones

## Tech Stack

- **Framework**: React Native 0.73+ with Expo SDK 50+
- **Language**: TypeScript 5.0+
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation 6+
- **UI Components**: React Native Paper + Custom components
- **Offline Storage**: SQLite + AsyncStorage + MMKV
- **AI/ML**: TensorFlow Lite React Native
- **Maps**: React Native Maps
- **Voice**: Expo Speech / Google Speech-to-Text
- **Camera**: Expo Camera + Image Picker
- **Networking**: Axios + Socket.io
- **Push Notifications**: Expo Notifications
- **Testing**: Jest + React Native Testing Library
- **E2E Testing**: Detox

## Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio + Android SDK 33+
- EAS CLI (for building): `npm install -g eas-cli`

## Installation

```bash
# Install dependencies
pnpm install

# iOS only: Install CocoaPods dependencies
cd ios && pod install && cd ..
```

## Development

### Running the App

```bash
# Start Metro bundler
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run on physical device (requires Expo Go app)
pnpm start
# Scan QR code with Expo Go
```

### Development Build

```bash
# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Install development build on device
# Then run:
pnpm start --dev-client
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components (Button, Card, etc.)
│   │   ├── crop/            # Crop-related components
│   │   ├── voice/           # Voice input components
│   │   └── camera/          # Camera and image components
│   ├── screens/             # App screens
│   │   ├── Home/
│   │   ├── CropHealth/
│   │   ├── Weather/
│   │   ├── Market/
│   │   ├── Community/
│   │   └── Profile/
│   ├── navigation/          # Navigation configuration
│   ├── store/               # Redux store and slices
│   │   ├── slices/
│   │   ├── api/            # RTK Query API definitions
│   │   └── index.ts
│   ├── services/            # Business logic services
│   │   ├── ai/             # On-device AI inference
│   │   ├── sync/           # Background sync service
│   │   ├── voice/          # Voice processing
│   │   └── location/       # GPS and location services
│   ├── models/              # TensorFlow Lite models
│   │   ├── crop-disease.tflite
│   │   ├── pest-detection.tflite
│   │   └── nutrient-deficiency.tflite
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── constants/           # App constants
│   ├── types/               # TypeScript type definitions
│   ├── localization/        # i18n translations
│   │   ├── en.json
│   │   ├── ur.json         # Urdu
│   │   ├── pa.json         # Punjabi
│   │   └── sd.json         # Sindhi
│   └── theme/               # Theme configuration
├── assets/                  # Static assets
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── sounds/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── __tests__/              # Unit tests
├── e2e/                    # End-to-end tests
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### Environment Variables

Create `.env` file in this directory:

```bash
# API Configuration
API_URL=https://api.zaraidost.com
API_URL_DEV=http://localhost:4000
WS_URL=wss://api.zaraidost.com

# AI Services
OPENAI_API_KEY=your_openai_key
GOOGLE_CLOUD_API_KEY=your_google_key

# Maps
GOOGLE_MAPS_API_KEY=your_maps_key

# Analytics
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_VOICE_INPUT=true
ENABLE_COMMUNITY=false
```

### App Configuration

Edit `app.json` for app metadata:

```json
{
  "expo": {
    "name": "Zarai Dost",
    "slug": "zarai-dost",
    "version": "1.0.0",
    "scheme": "zaraidost",
    "platforms": ["ios", "android"]
  }
}
```

## Key Features Implementation

### Offline-First Architecture

The app uses a multi-layer caching strategy:

```typescript
// src/services/sync/syncManager.ts
import { syncCropData, syncWeatherData } from './syncService';

// Background sync every 6 hours when online
const syncManager = {
  async performSync() {
    await syncCropData();
    await syncWeatherData();
    await syncMarketPrices();
  }
};
```

### On-Device AI Inference

```typescript
// src/services/ai/diseaseDetection.ts
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const model = await tf.loadGraphModel(
  bundleResourceIO(modelJSON, modelWeights)
);

export async function detectDisease(imageUri: string) {
  const imageTensor = await imageToTensor(imageUri);
  const predictions = await model.predict(imageTensor);
  return processPredictions(predictions);
}
```

### Voice Input

```typescript
// src/services/voice/voiceService.ts
import Voice from '@react-native-voice/voice';

export async function startVoiceRecognition(language: 'ur' | 'pa' | 'sd') {
  await Voice.start(`${language}-PK`);

  Voice.onSpeechResults = (e) => {
    const text = e.value[0];
    processVoiceCommand(text);
  };
}
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Build app for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

## Building for Production

### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Over-the-Air Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

## Performance Optimization

### Bundle Size
- Code splitting for screens
- Dynamic imports for heavy libraries
- Image optimization (WebP format)
- Remove console.logs in production

### AI Model Optimization
- Use quantized TensorFlow Lite models (8-bit)
- Model size: <10MB per model
- Lazy load models only when needed

### Memory Management
- Image compression before upload
- Clear cache periodically
- Limit SQLite database size

## Troubleshooting

### Common Issues

**Metro bundler won't start**
```bash
pnpm start -- --reset-cache
```

**iOS build fails**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Android build fails**
```bash
cd android
./gradlew clean
cd ..
```

**TensorFlow Lite model not loading**
- Ensure models are in `src/models/` directory
- Check model file size (<50MB)
- Verify model format is `.tflite`

## Deployment Checklist

- [ ] Update version in `app.json` and `package.json`
- [ ] Run full test suite
- [ ] Test on physical devices (low-end Android, older iPhones)
- [ ] Verify offline functionality
- [ ] Test voice input in all languages
- [ ] Check AI model accuracy
- [ ] Update change log
- [ ] Create release notes
- [ ] Build production binaries
- [ ] Submit to app stores
- [ ] Monitor crash reports

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new features
- Use meaningful variable names
- Add JSDoc comments for complex functions

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

## License

See [LICENSE](../../LICENSE) file in the root directory.

## Support

For issues specific to the mobile app:
- Create an issue with label `mobile`
- Include device info, OS version, and app version
- Provide reproduction steps and logs

---

**Built with ❤️ for Pakistan's farmers**
