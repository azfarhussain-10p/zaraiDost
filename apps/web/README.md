# Zarai Dost Web Dashboard

Progressive Web App (PWA) for Zarai Dost - Admin dashboard and web interface for agricultural advisory platform.

## Overview

The web dashboard provides administrative tools, analytics, and a web-based interface for users who prefer desktop access. Built with React.js and Next.js, it offers data visualization, community management, and system monitoring capabilities.

## Features

- **Admin Dashboard**: User management, content moderation, and system health monitoring
- **Analytics & Insights**: Crop disease trends, user engagement metrics, and AI performance
- **Community Management**: Moderate farmer groups, posts, and discussions
- **Data Visualization**: Interactive charts for weather patterns, market trends, and yield predictions
- **Content Management**: Manage advisory content, crop information, and educational resources
- **Progressive Web App**: Installable, offline-capable web experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile browsers
- **Multi-language Support**: Urdu, Punjabi, Sindhi, and English

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand + React Query (TanStack Query)
- **Charts**: Recharts + D3.js
- **Maps**: Leaflet / Mapbox
- **Forms**: React Hook Form + Zod validation
- **API Client**: GraphQL (Apollo Client) + REST (Axios)
- **Authentication**: NextAuth.js
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Vercel / AWS Amplify / S3 + CloudFront

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start development server
pnpm dev
# Opens http://localhost:3000

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Dashboard routes
│   │   │   ├── analytics/
│   │   │   ├── users/
│   │   │   ├── community/
│   │   │   ├── content/
│   │   │   └── settings/
│   │   ├── api/               # API routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (Shadcn)
│   │   ├── charts/           # Chart components
│   │   ├── maps/             # Map components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── features/         # Feature-specific components
│   ├── lib/                  # Utilities and configurations
│   │   ├── api/             # API clients
│   │   ├── auth/            # Authentication helpers
│   │   ├── utils/           # Helper functions
│   │   └── validations/     # Zod schemas
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── styles/              # Global styles
│   └── locales/             # i18n translations
├── public/                   # Static assets
│   ├── icons/
│   ├── images/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
├── tests/                   # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Configuration

### Environment Variables

Create `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_COMMUNITY=false
```

### PWA Configuration

Edit `public/manifest.json`:

```json
{
  "name": "Zarai Dost Dashboard",
  "short_name": "Zarai Dost",
  "description": "Agricultural Advisory Dashboard",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Key Features Implementation

### Analytics Dashboard

```tsx
// src/app/(dashboard)/analytics/page.tsx
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnalyticsChart
        title="User Growth"
        data={data.userGrowth}
        type="line"
      />
      <AnalyticsChart
        title="Disease Detection Accuracy"
        data={data.aiAccuracy}
        type="bar"
      />
    </div>
  );
}
```

### Data Visualization

```tsx
// src/components/charts/CropHealthChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export function CropHealthChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="healthScore" stroke="#10b981" />
    </LineChart>
  );
}
```

### Real-time Updates

```tsx
// src/hooks/useRealtimeUpdates.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useRealtimeUpdates(userId: string) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL);

    socket.on(`user:${userId}:update`, (data) => {
      // Handle real-time updates
    });

    return () => socket.disconnect();
  }, [userId]);
}
```

### Authentication

```tsx
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Validate credentials against API
        const user = await validateUser(credentials);
        return user;
      }
    })
  ],
  pages: {
    signIn: '/login',
  }
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
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
# Run Playwright tests
pnpm test:e2e

# Run in UI mode
pnpm test:e2e:ui
```

## Building for Production

```bash
# Build optimized production bundle
pnpm build

# Start production server
pnpm start

# Analyze bundle size
pnpm analyze
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### AWS S3 + CloudFront

```bash
# Build static export
pnpm build
pnpm export

# Deploy to S3
aws s3 sync out/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
RUN npm install -g pnpm && pnpm install --prod
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
# Build and run
docker build -t zaraidost-web .
docker run -p 3000:3000 zaraidost-web
```

## Performance Optimization

### Next.js Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  compress: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
};
```

### Code Splitting

```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

## Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader optimization
- High contrast mode
- RTL support for Urdu

## Internationalization

```typescript
// src/lib/i18n.ts
import { createI18n } from 'next-intl';

export const i18n = createI18n({
  locales: ['en', 'ur', 'pa', 'sd'],
  defaultLocale: 'en',
});
```

## Security

- HTTPS only in production
- CSRF protection
- XSS prevention (Content Security Policy)
- SQL injection prevention (parameterized queries)
- Rate limiting on API routes
- JWT token validation

## Monitoring & Analytics

- **Error Tracking**: Sentry
- **Performance Monitoring**: Web Vitals
- **User Analytics**: Google Analytics / Plausible
- **Uptime Monitoring**: Pingdom / UptimeRobot

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
pnpm typecheck
# Fix all type errors before building
```

**Hydration errors**
- Check for server/client mismatch
- Use `suppressHydrationWarning` for dynamic content
- Ensure consistent data between server and client

**Slow page loads**
- Use `next/dynamic` for code splitting
- Optimize images with `next/image`
- Enable caching headers

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [NextAuth.js](https://next-auth.js.org/)

## License

See [LICENSE](../../LICENSE) file in the root directory.

---

**Built with ❤️ for Pakistan's farmers**
