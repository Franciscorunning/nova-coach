# 🏗️ NOVA COACH - Architecture Decisions

## Overview

NOVA COACH is a fullstack monorepo application built with modern tooling and best practices.

## Monorepo Structure

We use **Turborepo** with **pnpm workspaces** for the monorepo setup:
- Efficient caching and task orchestration
- Shared TypeScript configurations
- Independent deployable packages

## Frontend Architecture

### React 18 + TypeScript
- Strict TypeScript for type safety
- React 18 concurrent features for performance
- Component-based architecture

### State Management (Zustand)
Modular stores for different domains:
- `auth` - Authentication state and session management
- `sessions` - Training sessions state
- `nutrition` - Nutrition log state
- `ui` - UI state (modals, notifications, loading)

### Routing (React Router v6)
- Nested routing with layouts
- Protected routes via `AuthGuard` component
- Lazy loading for code splitting

### Styling (Tailwind CSS 4)
- Utility-first CSS framework
- Custom design system tokens
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance

## Backend Architecture

### Supabase
- **Auth**: JWT-based authentication with Row Level Security
- **Database**: PostgreSQL with RLS policies per-table
- **Storage**: File uploads (avatars, exports)
- **Edge Functions**: Serverless functions for webhooks

### Security
- Row Level Security (RLS) on all user tables
- Environment variables for secrets (never in source)
- HTTPS everywhere
- Input validation with Zod schemas

## Integrations

### Strava OAuth
- OAuth 2.0 PKCE flow
- Webhook for real-time activity sync
- Token refresh handled server-side

### Stripe
- Checkout Sessions for subscription flow
- Customer Portal for billing management
- Webhooks for subscription lifecycle

### Resend
- Transactional emails (registration, reminders)
- HTML email templates

## Data Flow

```
User Action → React Component → Zustand Store → Supabase Client → PostgreSQL (with RLS)
                                                      ↓
                                              Edge Function (for webhooks)
                                                      ↓
                                          External APIs (Strava, Stripe)
```

## Performance

- Code splitting via React Router lazy loading
- Optimistic UI updates in Zustand stores
- Supabase real-time subscriptions for live data
- Turbo caching for fast builds

## Testing Strategy

- Unit tests: Vitest for utility functions and stores
- Integration tests: Testing Library for components
- E2E tests: Playwright for critical user flows
