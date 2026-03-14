# 🏃 NOVA COACH

A complete fullstack running coaching application for beginners. Built with React, TypeScript, Supabase, and integrated with Strava and Stripe.

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 4, Zustand, React Router v6
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Integrations**: Strava OAuth, Stripe, Resend Email, Plausible Analytics
- **Monorepo**: Turborepo + pnpm workspaces

## 📋 Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Supabase CLI
- Docker (for local Supabase)

## 🛠️ Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/Franciscorunning/nova-coach.git
cd nova-coach
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your credentials
```

### 3. Start Supabase locally

```bash
cd supabase
supabase start
# Apply migrations
supabase db push
```

### 4. Start development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 🏗️ Project Structure

```
nova-coach/
├── apps/
│   └── web/                  # React frontend application
│       ├── src/
│       │   ├── components/   # Reusable UI components
│       │   ├── pages/        # Route pages
│       │   ├── stores/       # Zustand state stores
│       │   ├── hooks/        # Custom React hooks
│       │   ├── types/        # TypeScript type definitions
│       │   └── utils/        # Utility functions
│       └── ...
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge Functions
│   └── config.toml
├── docs/                     # Documentation
└── .github/workflows/        # CI/CD pipelines
```

## 📱 Features

- **Authentication**: Email/password + OAuth (Google, Strava)
- **Training Plans**: Galloway, 15km, Semi-marathon programs
- **Session Tracking**: Log and track workout sessions
- **Strava Integration**: Auto-sync activities via webhook
- **Nutrition Logging**: Track nutrition and hydration
- **Statistics**: Charts and progress visualization
- **Subscription**: Stripe-powered premium features

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

## 📚 Documentation

- [Architecture](ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Strava Integration](docs/STRAVA_INTEGRATION.md)
- [Stripe Integration](docs/STRIPE_INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 📄 License

MIT