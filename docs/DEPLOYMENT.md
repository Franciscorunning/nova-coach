# NOVA COACH - Deployment Guide

## Architecture

```
Browser → Vercel (React app) → Supabase (API + Auth + DB)
                            → Strava API (OAuth + Webhooks)
                            → Stripe (Payments)
```

## Prerequisites

- Vercel account
- Supabase project (cloud)
- Strava Developer App
- Stripe account

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your `Project URL` and `Anon Key` from Settings → API

### Run Migrations
```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Configure Auth
1. Go to Authentication → Providers
2. Enable **Google**: Add Client ID and Secret from Google Cloud Console
3. Enable **Strava**: Add Client ID and Secret from Strava Developer portal
4. Set Site URL to your Vercel deployment URL
5. Add your Vercel URL to Additional Redirect URLs

### Deploy Edge Functions
```bash
supabase functions deploy strava-sync
supabase functions deploy stripe-webhook
```

### Set Edge Function Secrets
```bash
supabase secrets set STRAVA_CLIENT_SECRET=your_secret
supabase secrets set STRAVA_WEBHOOK_VERIFY_TOKEN=your_token
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 2. Strava Integration

### Create Strava App
1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application
3. Set Authorization Callback Domain to your Vercel domain
4. Note your `Client ID` and `Client Secret`

### Register Webhook
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F callback_url=https://your-project.supabase.co/functions/v1/strava-sync \
  -F verify_token=YOUR_VERIFY_TOKEN
```

## 3. Stripe Setup

### Create Products
1. Go to Stripe Dashboard → Products
2. Create "NOVA COACH Premium" product
3. Add monthly price (e.g. €9.99/month) and yearly price (e.g. €79.99/year)
4. Note the Price IDs

### Configure Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Note the Webhook Secret

## 4. Vercel Deployment

### Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel
```

### Environment Variables
Set in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRAVA_CLIENT_ID=your-strava-client-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_APP_URL=https://your-app.vercel.app
VITE_PLAUSIBLE_DOMAIN=your-domain.com
```

## 5. Verify Deployment

- [ ] Auth flows work (email, Google, Strava OAuth)
- [ ] Training plans load from database
- [ ] Sessions can be created and updated
- [ ] Strava webhook receives activities
- [ ] Stripe subscription flow works
- [ ] Email confirmations sent (if enabled)
