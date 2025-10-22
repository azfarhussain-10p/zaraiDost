# Epic 3: Crop Health Monitoring

## Epic Overview
Enable farmers to diagnose crop diseases, pest infestations, and nutrient deficiencies through AI-powered image analysis, providing localized treatment recommendations with local availability considerations.

**Goal**: Reduce yield losses by 15-20% through early disease detection
**Success Metric**: 85% accuracy in disease identification; <5s offline processing; multilingual output
**Priority**: Must-have

## User Stories

### Story 3.1: Image Capture and Upload Interface
**As a** farmer observing potential crop problems
**I want** to take a photo of my crop through the app
**So that** the AI can analyze what's wrong

**Acceptance Criteria**:
- AC1: Camera interface accessible from main dashboard
- AC2: Photo capture with crop type selection (dropdown or voice)
- AC3: Image preview with retake/confirm options
- AC4: Support for gallery upload (existing photos)
- AC5: Image quality validation (minimum resolution, not blurry)
- AC6: Multiple images uploadable for same crop issue (max 5)
- AC7: Location data (GPS) captured with image for regional analysis

**Technical Notes**:
- [Source: architecture/component-definitions.md] Data Layer: S3 for images; Image augmentation in pre-processing
- [Source: architecture/component-definitions.md] Mobile App: React Native for cross-platform camera
- React Native Camera or Expo Camera APIs
- Image compression before local storage and upload

---

### Story 3.2: On-Device Disease Detection Model
**As a** farmer in a remote area
**I want** the app to analyze my crop images without internet
**So that** I get immediate feedback in the field

**Acceptance Criteria**:
- AC1: TensorFlow Lite model runs on-device for disease detection
- AC2: Model recognizes 50+ diseases, pests, and nutrient deficiencies
- AC3: Processing completes within 5 seconds
- AC4: Confidence score displayed for top 3 predictions
- AC5: Model covers major Pakistani crops (wheat, rice, cotton, sugarcane, corn)
- AC6: Results include disease name in English and local language
- AC7: Image pre-processing (resize, normalize) automated

**Technical Notes**:
- [Source: architecture/component-definitions.md] Mobile App: TensorFlow Lite for on-device ML
- [Source: architecture/system-overview.md] Offline-first, multimodal AI for agricultural advisory
- Model training dataset should include Pakistani crop varieties and regional diseases
- Model size optimization critical (target <50MB)

---

### Story 3.3: Cloud-Based Enhanced Analysis
**As a** farmer with internet access
**I want** more accurate analysis using cloud AI
**So that** I get the best possible diagnosis

**Acceptance Criteria**:
- AC1: Cloud analysis automatically triggered when online
- AC2: More comprehensive model in cloud (higher accuracy than on-device)
- AC3: Multi-image analysis for better diagnosis
- AC4: Results compare on-device vs cloud predictions if different
- AC5: Cloud analysis completes within 10 seconds
- AC6: Fallback to on-device if cloud times out
- AC7: User notified when cloud provides different/updated diagnosis

**Technical Notes**:
- [Source: architecture/component-definitions.md] Backend: Python for AI tasks
- [Source: architecture/component-definitions.md] AI Wrapper: Abstraction for models; multi-agent workflows
- [Source: architecture/system-overview.md] Wrapper layer abstracts models (GPT/Claude/Gemini/Llama)
- Vision model API integration (GPT-4 Vision, Gemini Vision, or custom trained model)

---

### Story 3.4: Treatment Recommendations Engine
**As a** farmer who has identified a crop problem
**I want** specific treatment recommendations
**So that** I know exactly what actions to take

**Acceptance Criteria**:
- AC1: Treatment recommendations linked to each disease/pest/deficiency
- AC2: Multiple treatment options presented (chemical, organic, cultural practices)
- AC3: Recommendations consider user's organic preference (from profile)
- AC4: Budget-friendly options highlighted for low-income farmers
- AC5: Local product availability indicated where known
- AC6: Application instructions included (timing, quantity, method)
- AC7: Safety precautions and protective equipment recommendations

**Technical Notes**:
- [Source: architecture/component-definitions.md] AI Wrapper: LangChain for orchestration (vision + advisory agents)
- [Source: architecture/component-definitions.md] Database: PostgreSQL for structured treatment data
- Treatment database with Pakistani market-available products
- User profile includes: organic preference, budget level, location

---

### Story 3.5: Local Supplier Integration
**As a** farmer needing treatment products
**I want** to know where I can buy recommended products locally
**So that** I can quickly obtain what I need

**Acceptance Criteria**:
- AC1: Supplier database linked to treatment recommendations
- AC2: Nearest suppliers displayed based on farmer location
- AC3: Supplier contact information (phone, address) provided
- AC4: Product availability status when known
- AC5: Alternative products suggested if primary unavailable
- AC6: Option to call supplier directly from app
- AC7: User can mark suppliers as favorites

**Technical Notes**:
- [Source: architecture/component-definitions.md] Database: PostgreSQL for supplier data
- Geolocation matching for nearest supplier lookup
- Supplier database: name, location, products, contact info
- Future integration: Direct supplier inventory APIs

---

### Story 3.6: Disease History and Tracking
**As a** farmer managing crop health over time
**I want** to see history of all detected issues and their outcomes
**So that** I can track patterns and treatment effectiveness

**Acceptance Criteria**:
- AC1: All diagnoses saved with timestamps and images
- AC2: Treatment applied tracked (which option farmer chose)
- AC3: Follow-up image comparison for same issue
- AC4: Timeline view of crop health by field/crop type
- AC5: Treatment effectiveness ratings (farmer can rate outcome)
- AC6: Export history as PDF report
- AC7: Seasonal patterns highlighted (e.g., "rust common in February")

**Technical Notes**:
- [Source: architecture/component-definitions.md] Database: PostgreSQL for structured health records
- [Source: architecture/architectural-principles-and-best-practices.md] Offline-First: Local SQLite storage syncs with PostgreSQL
- Data relationships: Farmer → Fields → Crops → Health Records → Treatments → Outcomes

---

### Story 3.7: Multi-Crop and Field Management
**As a** farmer growing multiple crops in different fields
**I want** to organize my diagnoses by field and crop
**So that** I can manage each crop's health separately

**Acceptance Criteria**:
- AC1: Farmer profile includes multiple fields (user-defined names)
- AC2: Each field can have multiple crops/seasons
- AC3: Image analysis associated with specific field and crop
- AC4: Field-level health dashboard showing all crops
- AC5: Crop rotation history visible per field
- AC6: Field-specific recommendations based on soil type and history
- AC7: Bulk actions: view all wheat issues across all fields

**Technical Notes**:
- [Source: architecture/component-definitions.md] Database: PostgreSQL for data modeling
- Data model: Farmer → Fields (name, size, soil_type, location) → Crops (type, planting_date, expected_harvest) → Health Records
- Field and crop management UI components

---

### Story 3.8: Multilingual Disease Information
**As a** farmer who reads Urdu/Punjabi/Sindhi
**I want** disease names and treatments in my language
**So that** I fully understand the diagnosis and treatment

**Acceptance Criteria**:
- AC1: Disease names translated to Urdu, Punjabi, Sindhi
- AC2: Treatment recommendations localized
- AC3: Application instructions in local language
- AC4: Language selection persisted from user profile
- AC5: Images with labels/annotations in selected language
- AC6: Consistent terminology across app (disease names match advisory)

**Technical Notes**:
- [Source: architecture/component-definitions.md] Data Layer: Output localization in post-processing
- Translation database: disease_id → language_code → localized_name/description
- Use of i18n library (react-i18next) for mobile app

---

### Story 3.9: Confidence and Accuracy Feedback Loop
**As a** farmer receiving a diagnosis
**I want** to confirm if the diagnosis was correct
**So that** the AI can improve over time

**Acceptance Criteria**:
- AC1: User can mark diagnosis as correct/incorrect/unsure
- AC2: If incorrect, user can select correct issue from list
- AC3: Feedback submitted to improve model training
- AC4: Aggregate accuracy metrics visible to development team
- AC5: High-confidence incorrect predictions flagged for review
- AC6: User receives acknowledgment when feedback improves model
- AC7: Opt-in to share images for model training

**Technical Notes**:
- [Source: architecture/component-definitions.md] Monitoring: Prometheus/Grafana for metrics
- Feedback data: prediction_id, user_feedback (correct/incorrect), correct_label, confidence_score
- Model retraining pipeline triggers on feedback accumulation
- Privacy: User consent for sharing images/data

---

## Epic Dependencies
- Disease recognition model training (50+ classes)
- Treatment database compilation (products, suppliers, instructions)
- Image storage infrastructure (S3 or equivalent)
- GPS/location services on mobile
- Supplier database with contact information
- Multilingual translation resources

## Epic Risks
- **Risk**: Disease recognition accuracy below 85% target
  - **Mitigation**: Extensive training data from Pakistani farms; hybrid on-device + cloud approach; user feedback loop
- **Risk**: Model size exceeds device capacity
  - **Mitigation**: Model quantization and pruning; progressive model downloads
- **Risk**: Supplier data becomes stale or inaccurate
  - **Mitigation**: Crowdsourced updates from farmers; periodic supplier verification calls
- **Risk**: Rare diseases not covered by 50+ disease set
  - **Mitigation**: "Unknown/Other" category; option to submit for expert review; regular model updates
- **Risk**: Image quality in field conditions insufficient for analysis
  - **Mitigation**: Real-time quality feedback; image capture tips; multiple image support
