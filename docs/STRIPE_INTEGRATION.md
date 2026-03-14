# Stripe Integration

## Subscription Flow

```
1. User clicks "Upgrade to Premium" in Settings
2. Create Stripe Checkout Session (Edge Function)
   - customer: existing or new Stripe customer
   - price: monthly or yearly price ID
   - client_reference_id: Supabase user UUID
   - success_url / cancel_url
3. Redirect user to Stripe Checkout
4. On successful payment, Stripe fires checkout.session.completed
5. Webhook updates subscription_status to 'premium'
6. User gets access to premium features
```

## Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set subscription_status = 'premium', link stripe_customer_id |
| `customer.subscription.updated` | Update subscription_status based on status |
| `customer.subscription.deleted` | Set subscription_status = 'free' |

## Customer Portal

Users can manage their subscription via Stripe Customer Portal:
- Update payment method
- Cancel subscription
- View billing history

Link is generated server-side via the Stripe Billing Portal API.
