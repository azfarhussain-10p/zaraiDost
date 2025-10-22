# Epic 2: Voice-Powered Accessibility

## Epic Overview
Enable voice-based interaction in multiple local languages (Urdu, Punjabi, Sindhi) to support farmers with low literacy or elderly users who prefer voice commands.

**Goal**: Support elderly/low-literacy users with voice interface
**Success Metric**: >90% voice recognition accuracy; offline basics functional
**Priority**: Must-have

## User Stories

### Story 2.1: Voice Input Foundation (Urdu)
**As a** farmer who is more comfortable speaking than typing
**I want** to ask questions using my voice in Urdu
**So that** I can interact with the app without typing

**Acceptance Criteria**:
- AC1: Voice input button available on main query interface
- AC2: Google Speech-to-Text API integration for Urdu (ur-PK)
- AC3: Audio recording captures minimum 1 second, maximum 30 seconds
- AC4: Transcribed text displayed for user confirmation
- AC5: Edit option available for correcting transcription errors
- AC6: Voice input accuracy >90% for clear speech
- AC7: Microphone permissions requested and handled gracefully

**Technical Notes**:
- [Source: architecture/component-definitions.md] Integrations: Google Speech-to-Text
- [Source: architecture/component-definitions.md] Mobile App: React Native for voice UI
- React Native Voice or Expo Audio APIs for recording

---

### Story 2.2: Multi-Language Voice Support (Punjabi & Sindhi)
**As a** farmer speaking Punjabi or Sindhi
**I want** to use voice input in my native language
**So that** I can communicate naturally with the app

**Acceptance Criteria**:
- AC1: Language selection in settings (Urdu, Punjabi, Sindhi)
- AC2: Voice input adapts to selected language
- AC3: Google Speech-to-Text supports pa-IN (Punjabi) and sd-IN (Sindhi)
- AC4: Language-specific accuracy >90% for each supported language
- AC5: Voice button shows current language indicator
- AC6: Quick language switcher accessible during voice input

**Technical Notes**:
- [Source: architecture/component-definitions.md] Output localization in data layer
- Language codes: ur-PK (Urdu), pa-IN (Punjabi), sd-IN (Sindhi)

---

### Story 2.3: Voice Response Output
**As a** farmer using voice input
**I want** the app to read responses back to me
**So that** I don't need to read text on screen

**Acceptance Criteria**:
- AC1: Text-to-speech (TTS) enabled for AI responses
- AC2: TTS supports Urdu, Punjabi, and Sindhi
- AC3: Playback controls: play, pause, replay
- AC4: Adjustable speech rate in settings (0.75x to 1.5x)
- AC5: Auto-play option configurable in settings
- AC6: TTS works offline using device's native TTS engine

**Technical Notes**:
- [Source: architecture/component-definitions.md] Mobile App: Voice UI capability
- React Native TTS library or Expo Speech for text-to-speech
- Fallback to device system TTS if online service unavailable

---

### Story 2.4: Contextual Voice Commands
**As a** farmer using voice regularly
**I want** to use natural commands like "check my wheat crop" or "when should I water"
**So that** I can navigate the app without touching the screen

**Acceptance Criteria**:
- AC1: Voice commands parsed for intent (crop health check, irrigation, market prices)
- AC2: Natural language understanding handles variations in phrasing
- AC3: Contextual follow-up questions supported ("what about my corn field?")
- AC4: Command confirmation for destructive actions
- AC5: Help command ("what can I ask?") provides voice-guided examples
- AC6: Command history accessible via voice ("repeat last query")

**Technical Notes**:
- [Source: architecture/component-definitions.md] AI Wrapper: LangChain for orchestration (multi-agent workflows)
- [Source: architecture/system-overview.md] Wrapper layer abstracts models for extensibility
- Intent classification using AI wrapper's NLP capabilities

---

### Story 2.5: Offline Voice Basics
**As a** farmer working in areas without connectivity
**I want** basic voice commands to work offline
**So that** I can still use voice when no internet is available

**Acceptance Criteria**:
- AC1: On-device speech recognition for common commands (10-20 phrases)
- AC2: Offline commands: "show my crops", "last advice", "sync now", "settings"
- AC3: Clear indication when offline vs online voice is active
- AC4: Offline model <20MB in size
- AC5: Automatic fallback to offline mode when network unavailable
- AC6: Online mode automatically resumes when connection restored

**Technical Notes**:
- [Source: architecture/architectural-principles-and-best-practices.md] Offline-First: Local data sources
- [Source: architecture/component-definitions.md] TensorFlow Lite for on-device ML
- Consider lightweight on-device ASR model or keyword spotting

---

### Story 2.6: Voice Clarifications and Error Handling
**As a** farmer using voice input
**I want** the app to ask for clarification when it doesn't understand
**So that** I get accurate responses to my questions

**Acceptance Criteria**:
- AC1: Low-confidence transcriptions trigger confirmation prompt
- AC2: Multiple interpretations presented for user selection
- AC3: Voice prompt asks for clarification: "Did you say X or Y?"
- AC4: User can repeat their input if not understood
- AC5: Background noise detection warns user to speak in quieter environment
- AC6: Timeout after 5 seconds of silence returns to main screen

**Technical Notes**:
- [Source: architecture/component-definitions.md] LangChain for multi-agent workflows (conversational flow)
- Confidence thresholds configurable (default: <0.7 triggers clarification)

---

### Story 2.7: Voice Accessibility Settings
**As a** farmer with specific voice needs
**I want** to customize voice settings for my preferences
**So that** the voice experience works best for me

**Acceptance Criteria**:
- AC1: Settings page for voice configuration
- AC2: Toggle for auto-play responses (on/off)
- AC3: Speech rate adjustment (slow/normal/fast)
- AC4: Voice gender selection where available
- AC5: Microphone sensitivity adjustment
- AC6: Option to disable voice features entirely
- AC7: Voice tutorial/onboarding accessible from settings

**Technical Notes**:
- React Native AsyncStorage for persisting voice preferences
- Settings sync via backend when online

---

## Epic Dependencies
- Google Cloud Speech-to-Text API account and credentials
- TTS engine licensing or native device TTS availability
- Language-specific training data for intent classification
- Microphone permissions and audio recording infrastructure
- AI Wrapper NLP capabilities for intent parsing

## Epic Risks
- **Risk**: Speech recognition accuracy below 90% in noisy environments
  - **Mitigation**: Noise cancellation; user guidance for quiet environment
- **Risk**: Language support limited or poor quality for regional dialects
  - **Mitigation**: Test with actual users; fallback to Urdu; user feedback mechanism
- **Risk**: Offline voice severely limited without large models
  - **Mitigation**: Hybrid approach; most common phrases only; clear user expectations
- **Risk**: TTS voices sound robotic or unclear
  - **Mitigation**: Test multiple TTS engines; allow user voice selection
