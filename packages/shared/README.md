# Shared Package

Common utilities, types, constants, and helpers used across Zarai Dost monorepo.

## Overview

This package contains reusable code shared between mobile, web, and API applications. It ensures consistency, reduces code duplication, and provides a single source of truth for common functionality.

## Features

- **TypeScript Types**: Shared interfaces and type definitions
- **Constants**: App-wide constants (crop types, disease lists, etc.)
- **Utility Functions**: Common helpers (date formatting, validation, etc.)
- **Validation Schemas**: Zod schemas for data validation
- **Localization**: Multi-language support utilities
- **Error Handling**: Custom error classes
- **API Types**: Request/response type definitions

## Installation

```bash
# In monorepo
pnpm add @zaraidost/shared
```

## Usage

```typescript
import {
  CropType,
  DiseaseType,
  formatDate,
  validateEmail,
  ApiResponse
} from '@zaraidost/shared';

// Use shared types
const crop: CropType = 'wheat';

// Use utilities
const formatted = formatDate(new Date(), 'ur');

// Use validation
if (validateEmail(email)) {
  // Valid email
}
```

## Project Structure

```
packages/shared/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── user.types.ts
│   │   ├── crop.types.ts
│   │   ├── weather.types.ts
│   │   └── api.types.ts
│   ├── constants/          # App constants
│   │   ├── crops.ts
│   │   ├── diseases.ts
│   │   ├── languages.ts
│   │   └── regions.ts
│   ├── utils/              # Utility functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── conversion.ts
│   ├── schemas/            # Validation schemas
│   │   └── zod/
│   ├── errors/             # Custom error classes
│   │   └── AppError.ts
│   ├── locales/            # Translation utilities
│   │   └── i18n.ts
│   └── index.ts            # Main exports
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## Exports

### Types

```typescript
// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  language: Language;
  location?: Location;
}

// Crop types
export interface Crop {
  id: string;
  type: CropType;
  variety?: string;
  area: number; // acres
  plantingDate: Date;
  expectedHarvest?: Date;
}

// Disease types
export interface Disease {
  id: string;
  name: string;
  scientificName: string;
  crops: CropType[];
  symptoms: string[];
  treatment: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

### Constants

```typescript
// Crop types
export const CROP_TYPES = [
  'wheat', 'rice', 'cotton', 'sugarcane', 'corn', 'barley'
] as const;
export type CropType = typeof CROP_TYPES[number];

// Languages
export const LANGUAGES = ['en', 'ur', 'pa', 'sd'] as const;
export type Language = typeof LANGUAGES[number];

// Regions
export const REGIONS = {
  PUNJAB: 'punjab',
  SINDH: 'sindh',
  KPK: 'kpk',
  BALOCHISTAN: 'balochistan',
} as const;

// Common diseases
export const COMMON_DISEASES = {
  WHEAT_RUST: 'wheat-yellow-rust',
  COTTON_BOLL_ROT: 'cotton-boll-rot',
  RICE_BLAST: 'rice-blast',
} as const;
```

### Utilities

```typescript
// Date formatting
export function formatDate(
  date: Date,
  language: Language = 'en',
  format?: string
): string;

// Validation
export function validateEmail(email: string): boolean;
export function validatePhone(phone: string): boolean;
export function validateCoordinates(lat: number, lng: number): boolean;

// Formatting
export function formatCurrency(
  amount: number,
  currency: 'PKR' | 'USD' = 'PKR'
): string;

export function formatArea(acres: number, unit: 'acres' | 'hectares'): string;

// Conversion
export function acresToHectares(acres: number): number;
export function celsiusToFahrenheit(celsius: number): number;
```

### Validation Schemas

```typescript
import { z } from 'zod';

// User registration schema
export const userRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().regex(/^\+92\d{10}$/).optional(),
  language: z.enum(['en', 'ur', 'pa', 'sd'])
});

// Crop creation schema
export const cropCreationSchema = z.object({
  type: z.enum(['wheat', 'rice', 'cotton', 'sugarcane', 'corn']),
  variety: z.string().optional(),
  area: z.number().positive(),
  plantingDate: z.date(),
});
```

### Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('AUTH_ERROR', message, 401);
  }
}
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## Adding New Shared Code

1. Determine if the code is truly shared (used by 2+ apps)
2. Add to appropriate directory (types, utils, constants)
3. Export from `src/index.ts`
4. Add tests
5. Update this README

## Best Practices

- Keep functions pure and side-effect free
- Use TypeScript for type safety
- Write comprehensive tests
- Document complex utilities
- Version breaking changes carefully

## License

MIT - See [LICENSE](../../LICENSE)
