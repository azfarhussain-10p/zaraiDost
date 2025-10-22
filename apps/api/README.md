# Zarai Dost API Server

Node.js GraphQL/REST API backend for Zarai Dost - AI-powered agricultural advisory platform.

## Overview

The API server provides a unified backend for the Zarai Dost platform, handling authentication, data synchronization, AI orchestration, and third-party integrations. Built with Node.js, Express, and GraphQL, it supports both real-time and batch operations with offline-first considerations.

## Features

- **GraphQL API**: Flexible, efficient data querying with Apollo Server
- **REST API**: RESTful endpoints for legacy clients and webhooks
- **Authentication**: JWT-based auth with refresh tokens and OAuth 2.0
- **Real-time Updates**: WebSocket subscriptions for live data
- **Background Jobs**: Bull Queue for async processing (image analysis, sync, notifications)
- **Caching**: Redis-based caching for performance
- **Rate Limiting**: Protect against abuse
- **API Documentation**: Auto-generated docs with GraphQL Playground
- **Third-party Integrations**: Weather API, SMS gateway, market data providers
- **Monitoring**: Health checks, metrics, and logging

## Tech Stack

- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript 5.0+
- **Framework**: Express.js 4+
- **GraphQL**: Apollo Server 4+
- **Database**: PostgreSQL 14+ with TypeORM
- **Caching**: Redis 7+
- **Queue**: Bull (Redis-based)
- **Authentication**: Passport.js + JWT
- **Validation**: Joi / Zod
- **Testing**: Jest + Supertest
- **Documentation**: GraphQL Playground / GraphiQL
- **Deployment**: AWS Lambda / ECS / EC2

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14.0
- Redis >= 7.0
- Docker (optional, for local services)

## Installation

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:setup

# Run migrations
pnpm migrate
```

## Development

```bash
# Start development server with hot reload
pnpm dev
# Server runs on http://localhost:4000
# GraphQL Playground: http://localhost:4000/graphql

# Run database migrations
pnpm migrate

# Seed database with sample data
pnpm db:seed

# Start Redis (if not using Docker)
redis-server
```

### Using Docker Compose

```bash
# Start all services (API, PostgreSQL, Redis)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Project Structure

```
apps/api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── environment.ts
│   ├── graphql/             # GraphQL schema and resolvers
│   │   ├── schema/
│   │   │   ├── user.graphql
│   │   │   ├── crop.graphql
│   │   │   ├── weather.graphql
│   │   │   └── market.graphql
│   │   ├── resolvers/
│   │   │   ├── user.resolver.ts
│   │   │   ├── crop.resolver.ts
│   │   │   └── query.resolver.ts
│   │   ├── directives/
│   │   └── scalars/
│   ├── rest/                # REST API routes
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── crops.routes.ts
│   │   │   ├── weather.routes.ts
│   │   │   └── webhooks.routes.ts
│   │   └── controllers/
│   ├── entities/            # TypeORM entities
│   │   ├── User.entity.ts
│   │   ├── Crop.entity.ts
│   │   ├── CropHealth.entity.ts
│   │   ├── Weather.entity.ts
│   │   └── MarketPrice.entity.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── crop.service.ts
│   │   ├── weather.service.ts
│   │   ├── market.service.ts
│   │   └── ai.service.ts
│   ├── jobs/                # Background jobs
│   │   ├── image-processing.job.ts
│   │   ├── sync.job.ts
│   │   ├── notification.job.ts
│   │   └── weather-update.job.ts
│   ├── integrations/        # Third-party integrations
│   │   ├── ibm-weather/
│   │   ├── google-speech/
│   │   ├── sms-gateway/
│   │   └── market-api/
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── utils/               # Utility functions
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   └── validators.ts
│   ├── types/               # TypeScript types
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Database seeders
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── migrate.sh
│   └── seed.sh
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── package.json
└── README.md
```

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/zaraidost
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLOUD_API_KEY=

# Third-party Integrations
IBM_WEATHER_API_KEY=
IBM_WEATHER_API_URL=https://api.weather.com/v3
SMS_GATEWAY_API_KEY=
SMS_GATEWAY_URL=
MARKET_API_KEY=
MARKET_API_URL=

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=zaraidost-uploads

# Monitoring
SENTRY_DSN=
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Documentation

### GraphQL Schema

#### User Queries

```graphql
type Query {
  me: User
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  updateProfile(input: UpdateProfileInput!): User!
}

type User {
  id: ID!
  name: String!
  email: String!
  phone: String
  language: Language!
  location: Location
  crops: [Crop!]!
  createdAt: DateTime!
}
```

#### Crop Health

```graphql
type Query {
  cropHealth(cropId: ID!): CropHealth
  detectDisease(imageUrl: String!): DiseaseDetectionResult!
}

type Mutation {
  reportCropIssue(input: CropIssueInput!): CropHealth!
  updateCropHealth(id: ID!, input: CropHealthInput!): CropHealth!
}

type CropHealth {
  id: ID!
  crop: Crop!
  status: HealthStatus!
  diseases: [Disease!]!
  recommendations: [Recommendation!]!
  images: [String!]!
  reportedAt: DateTime!
}
```

#### Weather

```graphql
type Query {
  weather(location: LocationInput!): Weather!
  weatherForecast(location: LocationInput!, days: Int): [WeatherForecast!]!
}

type Weather {
  temperature: Float!
  humidity: Float!
  precipitation: Float!
  windSpeed: Float!
  conditions: String!
  uvIndex: Int!
}
```

### REST Endpoints

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Logout

GET    /api/crops                  # List crops
GET    /api/crops/:id              # Get crop details
POST   /api/crops                  # Create crop record
PUT    /api/crops/:id              # Update crop
DELETE /api/crops/:id              # Delete crop

POST   /api/crops/:id/diagnose     # Upload image for diagnosis
GET    /api/crops/:id/health       # Get crop health history

GET    /api/weather                # Get current weather
GET    /api/weather/forecast       # Get weather forecast

GET    /api/market/prices          # Get market prices
GET    /api/market/predictions     # Get price predictions

POST   /api/webhooks/sms           # SMS webhook
POST   /api/webhooks/payment       # Payment webhook

GET    /api/health                 # Health check
GET    /api/metrics                # Prometheus metrics
```

## Authentication

### JWT Authentication

```typescript
// Login request
POST /api/auth/login
{
  "email": "farmer@example.com",
  "password": "securepassword"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "name": "Ahmed Khan",
    "email": "farmer@example.com"
  }
}
```

### Protected Routes

```typescript
// Add Authorization header
Authorization: Bearer <access_token>
```

## Background Jobs

### Image Processing Job

```typescript
// src/jobs/image-processing.job.ts
import { Queue } from 'bull';

const imageQueue = new Queue('image-processing', {
  redis: redisConfig
});

imageQueue.process(async (job) => {
  const { imageUrl, userId } = job.data;

  // Process image with AI
  const result = await detectDisease(imageUrl);

  // Save results
  await saveDiagnosisResult(userId, result);

  // Send notification
  await sendNotification(userId, result);
});
```

### Weather Update Job

```typescript
// Scheduled job (runs every 6 hours)
import cron from 'node-cron';

cron.schedule('0 */6 * * *', async () => {
  await updateWeatherData();
});
```

## Database

### Running Migrations

```bash
# Create a new migration
pnpm migration:create AddCropHealthTable

# Run pending migrations
pnpm migrate

# Revert last migration
pnpm migrate:revert
```

### Example Migration

```typescript
// src/migrations/1234567890-CreateUsersTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users;`);
  }
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test user.service.test.ts

# E2E tests
pnpm test:e2e
```

### Example Test

```typescript
// tests/integration/auth.test.ts
describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

## Deployment

### AWS Lambda (Serverless)

```bash
# Build for Lambda
pnpm build

# Deploy with Serverless Framework
serverless deploy --stage production
```

### Docker

```bash
# Build image
docker build -t zaraidost-api .

# Run container
docker run -p 4000:4000 --env-file .env zaraidost-api
```

### AWS ECS

```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag zaraidost-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/zaraidost-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/zaraidost-api:latest

# Update ECS service
aws ecs update-service --cluster zaraidost --service api --force-new-deployment
```

## Performance & Optimization

### Caching Strategy

```typescript
// Cache weather data for 1 hour
const cachedWeather = await cache.get(`weather:${location}`);
if (cachedWeather) return cachedWeather;

const weather = await fetchWeatherFromAPI(location);
await cache.set(`weather:${location}`, weather, 3600);
```

### Database Optimization

- Use indexes on frequently queried fields
- Implement pagination for large datasets
- Use database connection pooling
- Optimize N+1 queries with DataLoader

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Monitoring

### Health Check

```bash
GET /api/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "services": {
    "database": "up",
    "redis": "up",
    "weather_api": "up"
  }
}
```

### Metrics

```bash
GET /api/metrics

# Prometheus format output
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",path="/api/crops"} 1234
```

## Security Best Practices

- Use HTTPS in production
- Sanitize user inputs
- Implement CORS properly
- Use parameterized queries (prevent SQL injection)
- Hash passwords with bcrypt
- Rotate JWT secrets regularly
- Implement rate limiting
- Log security events

## Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check credentials in .env
```

**Redis connection fails**
```bash
# Check Redis is running
redis-cli ping
# Should return PONG
```

**GraphQL queries slow**
- Check for N+1 query problems
- Implement DataLoader
- Add database indexes
- Use query complexity analysis

## Contributing

See main [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [TypeORM Documentation](https://typeorm.io/)
- [Bull Queue](https://github.com/OptimalBits/bull)

## License

See [LICENSE](../../LICENSE)

---

**Built with ❤️ for Pakistan's farmers**
