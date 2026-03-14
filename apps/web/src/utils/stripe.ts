import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Lazy-loaded Stripe instance (singleton)
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey ?? '');
  }
  return stripePromise;
}

/**
 * Formats a price in cents to a currency string
 */
export function formatPrice(amountCents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

export const SUBSCRIPTION_PRICES = {
  monthly: {
    amount: 999, // 9.99 EUR
    interval: 'month',
    label: 'Monthly',
  },
  yearly: {
    amount: 7999, // 79.99 EUR
    interval: 'year',
    label: 'Yearly (save 33%)',
  },
} as const;
