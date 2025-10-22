# Zarai Dost - AI-Powered Agricultural Advisory Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.9-blue)](ml/requirements.txt)

> Empowering Pakistan's smallholder farmers with offline-first AI guidance for crop health, irrigation, market intelligence, and climate-smart decisions.

## Overview

**Zarai Dost** (Farmer's Friend) is a comprehensive agricultural advisory system designed for Pakistan's small-scale farmers, addressing the critical challenges of declining crop production (13.5% drop in FY2025) and climate variability. Built for the AI Wrapper Competition 2025, it combines cutting-edge AI with cultural relevance and offline-first architecture to serve farmers in low-connectivity rural areas.

### Key Features

- **Offline-First Intelligence**: Full functionality without internet through on-device AI processing
- **Crop Health Monitoring**: Detect 50+ diseases and pests using computer vision (TensorFlow Lite)
- **Smart Irrigation Management**: Predictive moisture analysis with weather integration
- **Market Intelligence**: Price predictions and optimal selling recommendations
- **Climate-Smart Advisory**: Sowing guidance and extreme weather alerts
- **Voice-Powered Accessibility**: Multi-language support (Urdu, Punjabi, Sindhi) for low-literacy users
- **Community Learning Network**: Peer-to-peer knowledge sharing and farmer groups

### Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| User Adoption | 10,000 active users | 6 months |
| Yield Improvement | 20-30% (self-reported) | Per season |
| AI Diagnosis Accuracy | 85% for 50+ diseases | Ongoing |
| NPS Score | >70 | Quarterly |

## Architecture

Zarai Dost uses a modular, offline-first architecture optimized for intermittent connectivity and low-end devices:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interfaces                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │  Mobile App      │  │   Web App (PWA)  │  │  SMS/Voice ││
│  │  (React Native)  │  │   (React.js)     │  │  Gateway   ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬─────┘│
└───────────┼────────────────────┼────────────────────┼──────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API Gateway           │
                    │   (GraphQL/REST)        │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                          │
   ┌────────▼─────────┐                  ┌───────────▼──────────┐
   │  AI Wrapper      │                  │  Core Services       │
   │  (Model Abstraction)                │  (Node.js + Python)  │
   │                  │                  │                      │
   │  • GPT/Claude    │                  │  • Auth & Sync       │
   │  • Gemini/Llama  │                  │  • Weather API       │
   │  • LangChain     │                  │  • Market Data       │
   └──────────────────┘                  └──────────────────────┘
            │                                          │
            └────────────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Data Layer            │
                    │                         │
                    │  PostgreSQL │ Redis     │
                    │  S3 Storage │ SQLite    │
                    └─────────────────────────┘
```

### Tech Stack

#### Frontend
- **Mobile**: React Native + Expo (iOS/Android)
- **Web**: React.js + Next.js (PWA)
- **On-Device AI**: TensorFlow Lite
- **State Management**: Redux Toolkit
- **Offline Storage**: SQLite, AsyncStorage

#### Backend
- **API Server**: Node.js + Express + GraphQL
- **ML Services**: Python + Flask
- **Authentication**: JWT + OAuth 2.0
- **Background Jobs**: Bull Queue

#### AI/ML
- **Model Wrapper**: Custom abstraction layer (LangChain)
- **Base Models**: OpenAI GPT, Anthropic Claude, Google Gemini
- **Image Processing**: TensorFlow, Google AutoML
- **Voice**: Google Speech-to-Text, Festival TTS
- **Weather**: IBM Weather API

#### Infrastructure
- **Cloud**: AWS (Lambda, S3, RDS, ElastiCache)
- **IaC**: AWS CDK (TypeScript)
- **Database**: PostgreSQL 14+, Redis 7+
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

#### Monorepo
- **Build System**: Turborepo
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier, Husky

## Project Structure

```
zaraiDost/
├── apps/
│   ├── mobile/              # React Native mobile app
│   ├── web/                 # React.js web dashboard (PWA)
│   └── api/                 # Node.js GraphQL API server
├── packages/
│   ├── ai-wrapper/          # AI model abstraction layer
│   ├── shared/              # Shared utilities, types, constants
│   ├── ui/                  # Shared UI components
│   └── database/            # Database schemas and migrations
├── ml/
│   ├── models/              # TensorFlow Lite models
│   ├── training/            # Model training scripts
│   └── inference/           # Python inference services
├── infrastructure/
│   ├── cdk/                 # AWS CDK deployment stacks
│   └── terraform/           # Alternative IaC (if needed)
├── docs/
│   ├── prd/                 # Product requirements
│   ├── architecture/        # Architecture documentation
│   └── stories/             # User stories and epics
├── scripts/                 # Build and deployment scripts
├── .github/
│   └── workflows/           # CI/CD pipelines
├── turbo.json              # Turborepo configuration
├── package.json            # Root package manifest
└── pnpm-workspace.yaml     # pnpm workspace config
```

## Getting Started

### Prerequisites

- **Node.js**: >=18.0.0 (LTS recommended)
- **Python**: >=3.9
- **pnpm**: >=8.0.0
- **Docker**: >=20.0 (for local services)
- **PostgreSQL**: >=14.0
- **Redis**: >=7.0
- **AWS CLI**: >=2.0 (for deployment)
- **Expo CLI**: Latest (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zaraiDost.git
   cd zaraiDost
   ```

2. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   pnpm install

   # Install Python dependencies
   cd ml
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp apps/mobile/.env.example apps/mobile/.env
   cp apps/api/.env.example apps/api/.env

   # Edit .env files with your API keys and configuration
   # Required:
   # - OPENAI_API_KEY
   # - ANTHROPIC_API_KEY
   # - GOOGLE_CLOUD_API_KEY
   # - IBM_WEATHER_API_KEY
   # - DATABASE_URL
   # - REDIS_URL
   ```

4. **Start local services**
   ```bash
   # Using Docker Compose
   docker-compose up -d postgres redis

   # Run database migrations
   pnpm --filter @zaraidost/database migrate
   ```

5. **Start development servers**
   ```bash
   # Start all services (uses Turborepo)
   pnpm dev

   # Or start individually:
   pnpm --filter @zaraidost/api dev        # API on http://localhost:4000
   pnpm --filter @zaraidost/web dev        # Web on http://localhost:3000
   pnpm --filter @zaraidost/mobile dev     # Mobile with Expo
   ```

### Development Workflow

#### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @zaraidost/api test

# Run with coverage
pnpm test:coverage
```

#### Code Quality
```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type checking
pnpm typecheck
```

#### Building for Production
```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter @zaraidost/web build
pnpm --filter @zaraidost/mobile build
```

## Deployment

### AWS Deployment (Recommended)

1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure**
   ```bash
   cd infrastructure/cdk
   pnpm install
   pnpm cdk bootstrap  # First time only
   pnpm cdk deploy --all
   ```

3. **Deploy applications**
   ```bash
   # API to Lambda
   pnpm --filter @zaraidost/api deploy

   # Web to S3 + CloudFront
   pnpm --filter @zaraidost/web deploy

   # Mobile to App Store / Play Store
   # See apps/mobile/README.md for detailed instructions
   ```

### Environment-Specific Deployments
```bash
# Staging
pnpm deploy:staging

# Production
pnpm deploy:prod
```

## Configuration

### API Keys & Services

| Service | Purpose | Required | Docs |
|---------|---------|----------|------|
| OpenAI | GPT models for advisory | Yes | [Link](https://platform.openai.com) |
| Anthropic | Claude for advanced reasoning | Optional | [Link](https://console.anthropic.com) |
| Google Cloud | Speech-to-Text, AutoML | Yes | [Link](https://cloud.google.com) |
| IBM Weather | Weather forecasts | Yes | [Link](https://www.ibm.com/weather) |
| AWS | Infrastructure & storage | Yes | [Link](https://aws.amazon.com) |

### Feature Flags

Configure features in `apps/api/config/features.json`:
```json
{
  "offlineMode": true,
  "voiceInput": true,
  "communityNetwork": false,
  "marketIntelligence": true
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `pnpm test`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your fork and submit a Pull Request

### Code Style
- Follow the existing code style
- Use TypeScript for new code
- Write tests for new features
- Update documentation as needed

## Roadmap

### Phase 1 (Months 1-3) - MVP
- [x] Core offline functionality
- [x] Basic crop disease detection (wheat, cotton)
- [x] Weather integration
- [ ] SMS/voice gateway
- [ ] Beta testing with 100 farmers

### Phase 2 (Months 4-6)
- [ ] Multi-language voice support
- [ ] Expand to 5 crops (rice, sugarcane, corn)
- [ ] Market price predictions
- [ ] Community network MVP
- [ ] Scale to 10,000 users

### Phase 3 (Months 7-12)
- [ ] Full crop coverage (20+ crops)
- [ ] Government scheme integration
- [ ] Farmer marketplace
- [ ] Advanced analytics dashboard
- [ ] Regional expansion

## Documentation

- [Product Requirements Document (PRD)](docs/prd.md)
- [Architecture Overview](docs/architecture.md)
- [API Documentation](apps/api/README.md)
- [Mobile App Guide](apps/mobile/README.md)
- [User Stories](docs/stories/)
- [Deployment Guide](docs/deployment.md)

## Performance & Monitoring

- **App Load Time**: <3s
- **AI Inference**: <5s offline, <2s online
- **Uptime Target**: 99.9%
- **Scalability**: Tested for 100,000+ concurrent users

Monitor via:
- Grafana Dashboard: `https://monitoring.zaraidost.com`
- AWS CloudWatch
- Sentry for error tracking

## Security & Compliance

- **Encryption**: AES-256 for data at rest, TLS 1.3 in transit
- **Authentication**: JWT with refresh tokens, OAuth 2.0
- **Compliance**: GDPR, Pakistan Personal Data Protection Act
- **AI Fairness**: Regular bias audits, synthetic data for underrepresented groups
- **Privacy**: Anonymized data sharing, opt-in community features

## Support & Community

- **Documentation**: [docs.zaraidost.com](https://docs.zaraidost.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/zaraiDost/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/zaraiDost/discussions)
- **Email**: support@zaraidost.com
- **Twitter**: [@ZaraiDost](https://twitter.com/zaraidost)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the AI Wrapper Competition 2025
- Inspired by the resilience of Pakistani farmers
- Thanks to all contributors and beta testers
- Weather data powered by IBM Weather API
- AI infrastructure by OpenAI, Anthropic, and Google

## Citation

If you use Zarai Dost in your research or project, please cite:

```bibtex
@software{zaraidost2025,
  title = {Zarai Dost: AI-Powered Agricultural Advisory Platform},
  author = {Your Team},
  year = {2025},
  url = {https://github.com/yourusername/zaraiDost}
}
```

---

**Made with ❤️ for Pakistan's farmers**
