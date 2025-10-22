# Epic 5: Market Intelligence

## Epic Overview
Provide farmers with market price predictions, optimal selling times, and buyer connections to maximize profitability and reduce post-harvest losses.

**Goal**: Boost profitability by 10-25% through informed selling decisions
**Success Metric**: Mandi API integration; price predictions (30/60/90 days); factors degradation/storage
**Priority**: Should-have

## User Stories

### Story 5.1: Mandi Price Data Integration
**As a** farmer planning to sell crops
**I want** current market prices from nearby mandis (wholesale markets)
**So that** I know the fair price for my produce

**Acceptance Criteria**:
- AC1: Integration with government mandi price APIs (e.g., Agmarknet Pakistan, provincial agriculture departments)
- AC2: Current prices displayed for user's crops at nearest mandis
- AC3: Price data updated daily (minimum)
- AC4: Historical price trends (last 3 months) displayed
- AC5: Multiple mandis comparison for best price
- AC6: Price units match local conventions (per 40kg, per maund, per kg)
- AC7: Offline access to last cached prices

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Mandi API integration required
- APIs: Pakistan Agricultural Marketing Information Service, provincial APIs
- Price data: crop name, mandi location, min/max/modal price, date
- Conversion: 1 maund = 40 kg (Pakistani convention)

---

### Story 5.2: Price Prediction Model (30/60/90 Days)
**As a** farmer deciding when to sell
**I want** price predictions for the next 30, 60, and 90 days
**So that** I can choose the optimal selling time

**Acceptance Criteria**:
- AC1: Price prediction model using historical data, seasonality, supply forecasts
- AC2: 30-day, 60-day, and 90-day price forecasts displayed
- AC3: Prediction confidence level shown (high/medium/low)
- AC4: Price trend indicator (rising/stable/falling)
- AC5: Factors affecting prediction explained (e.g., harvest season, demand)
- AC6: Prediction accuracy tracked and displayed to users
- AC7: Model updated weekly with new market data

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Predicts prices 30/60/90 days
- Time series forecasting: ARIMA, Prophet, or LSTM models
- Features: historical prices, seasonality, weather, crop area planted
- Backend Python service for model training and inference

---

### Story 5.3: Optimal Selling Time Recommendations
**As a** farmer with harvested crops
**I want** recommendations on the best time to sell
**So that** I can maximize my profit

**Acceptance Criteria**:
- AC1: Selling recommendation generated: "Sell now", "Wait X days", "Sell urgently"
- AC2: Recommendation considers price predictions, crop degradation, storage costs
- AC3: Expected profit difference shown (sell now vs wait)
- AC4: Risk assessment: probability of price increase vs degradation loss
- AC5: Personalized for user's storage capacity and crop condition
- AC6: Alert sent when optimal selling window opens
- AC7: User can input actual selling price for feedback loop

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Recommends selling times
- Decision factors: price forecast, storage cost, degradation rate, transport cost
- Optimization: maximize (expected_price - storage_cost - degradation_loss - transport)

---

### Story 5.4: Crop Degradation and Storage Cost Modeling
**As a** farmer storing produce
**I want** the app to account for storage costs and crop degradation
**So that** selling recommendations are realistic

**Acceptance Criteria**:
- AC1: Degradation rates defined for major crops (wheat, rice, vegetables, fruits)
- AC2: User can input storage type (cold storage, warehouse, home)
- AC3: Storage cost per day calculated based on facility type
- AC4: Degradation timeline displayed (e.g., "tomatoes degrade 10% per 3 days")
- AC5: Quality loss factored into price predictions
- AC6: Break-even point calculated (when storage cost = expected price gain)
- AC7: Urgent selling alerts for highly perishable crops

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Factors degradation/storage
- Degradation rates by crop type (perishables vs grains)
- Storage costs: cold storage (Rs. 50-100/day), warehouse (Rs. 20-40/day), home (Rs. 5-10/day)
- Integration with Crop data from Story 1.1

---

### Story 5.5: Supply and Demand Alerts
**As a** farmer growing seasonal crops
**I want** alerts about market oversupply or high demand
**So that** I can adjust my selling strategy

**Acceptance Criteria**:
- AC1: Supply forecast based on crop area data (government agricultural statistics)
- AC2: Demand indicators from historical consumption patterns
- AC3: Oversupply alert: "25% onion price drop expected due to oversupply"
- AC4: High demand alert: "Wheat demand high - favorable selling conditions"
- AC5: Regional supply/demand variations highlighted
- AC6: Export demand opportunities flagged
- AC7: Alerts sent 2 weeks before harvest season

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Use case: alerts on oversupply
- Data sources: Ministry of Agriculture area under cultivation reports
- Export data: Pakistan Bureau of Statistics trade data
- Supply index calculation: (current_year_area / average_area) * 100

---

### Story 5.6: Buyer Connection Platform
**As a** farmer selling produce
**I want** to connect with verified buyers
**So that** I can get better prices and avoid middlemen

**Acceptance Criteria**:
- AC1: Buyer directory with contact information (traders, wholesalers, exporters)
- AC2: Buyer profiles show: crops interested in, location, payment terms
- AC3: User can send selling inquiries to buyers via app
- AC4: Buyer ratings and reviews from other farmers
- AC5: Negotiation chat/messaging within app (optional)
- AC6: Transaction history tracked (for farmer records)
- AC7: Buyer verification system (government registration, trade license)

**Technical Notes**:
- Buyer database: name, location, crops, contact (phone/WhatsApp)
- Verification: CNIC, trade license number
- Privacy: farmers can choose to share contact or communicate through app
- Messaging: in-app chat or redirect to WhatsApp/phone

---

### Story 5.7: Transport Cost Optimization
**As a** farmer selling to distant mandis
**I want** transport cost estimates and route optimization
**So that** I can maximize my net profit

**Acceptance Criteria**:
- AC1: Transport cost calculator based on distance and crop quantity
- AC2: Route optimization to nearest profitable mandi
- AC3: Shared transport opportunities (multiple farmers to same mandi)
- AC4: Transport provider directory with contact information
- AC5: Cost-benefit analysis: (mandi_price - transport_cost) comparison
- AC6: Fuel price updates factored into transport costs
- AC7: Historical transport cost data for user's routes

**Technical Notes**:
- [Source: prd/features-and-requirements-prioritized-with-moscow.md] Optimizes transport
- Transport cost formula: base_rate + (distance_km * per_km_rate) + (weight_kg * per_kg_rate)
- Google Maps API for distance calculation
- Shared transport: match farmers with same destination and timing

---

### Story 5.8: Market Intelligence Dashboard
**As a** farmer monitoring market conditions
**I want** a comprehensive market dashboard
**So that** I can make informed decisions quickly

**Acceptance Criteria**:
- AC1: Dashboard displays: current prices, price trends, predictions, recommendations
- AC2: Multiple crops monitored simultaneously
- AC3: Favorite mandis quick view
- AC4: Price alerts configurable (notify when price > X)
- AC5: Market news and updates displayed
- AC6: Seasonal calendar showing typical price patterns
- AC7: Export market dashboard with weekly insights

**Technical Notes**:
- Dashboard widgets: price cards, trend charts, recommendation panel
- Real-time price updates (if available)
- Market news aggregation from agricultural news sources
- Integration with all previous Epic 5 stories

---

### Story 5.9: Government Scheme and Subsidy Integration
**As a** farmer eligible for government support
**I want** information about minimum support prices and subsidies
**So that** I can take advantage of government schemes

**Acceptance Criteria**:
- AC1: Minimum Support Price (MSP) displayed for supported crops
- AC2: Government procurement center locations shown
- AC3: Subsidy schemes listed with eligibility criteria
- AC4: Application process guidance for schemes
- AC5: Deadline alerts for scheme registrations
- AC6: User eligibility check based on profile (land size, crop type)
- AC7: Contact information for agricultural extension offices

**Technical Notes**:
- MSP data: Pakistan Agriculture Storage and Services Corporation
- Provincial schemes: Punjab, Sindh, KPK, Balochistan agriculture departments
- Subsidy types: input subsidies (fertilizer, seed), procurement, crop insurance
- Integration with user profile from Story 1.1

---

## Epic Dependencies
- Mandi price APIs (government or third-party)
- Historical price database (3+ years for ML models)
- Crop degradation database
- Buyer verification system
- Transport cost data
- Google Maps API for distance calculation
- Field and crop data from Epic 1 (Story 1.1)
- SMS gateway for price alerts (Story 4.6)

## Epic Risks
- **Risk**: Mandi price APIs may be unreliable or delayed
  - **Mitigation**: Multiple API sources; manual crowdsourced prices; cache last known prices
- **Risk**: Price prediction accuracy may be low (<60%)
  - **Mitigation**: Show confidence levels; collect feedback; refine model; conservative recommendations
- **Risk**: Buyer directory may attract spam or fraudulent buyers
  - **Mitigation**: Verification system; user ratings; moderation; report/block functionality
- **Risk**: Transport cost data may be outdated
  - **Mitigation**: Allow user input; crowdsource transport rates; periodic surveys
- **Risk**: Government schemes data may be fragmented across provinces
  - **Mitigation**: Manual aggregation initially; partnerships with agriculture departments
- **Risk**: Farmers may not trust price predictions
  - **Mitigation**: Show historical accuracy; explain methodology; start with simpler "trend" indicators
