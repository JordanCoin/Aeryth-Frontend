import { loadStripe } from '@stripe/stripe-js';

// In Vite, we use import.meta.env instead of process.env
const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  PRO_MONTHLY_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
};

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!(
    STRIPE_CONFIG.PUBLISHABLE_KEY &&
    STRIPE_CONFIG.PRO_MONTHLY_PRICE_ID &&
    STRIPE_CONFIG.PRO_YEARLY_PRICE_ID
  );
};

// Only initialize Stripe if configured
let stripePromise: Promise<any> | null = null;
export const getStripe = () => {
  if (!isStripeConfigured()) {
    return null;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const STRIPE_PRICES = {
  PRO_MONTHLY: STRIPE_CONFIG.PRO_MONTHLY_PRICE_ID,
  PRO_YEARLY: STRIPE_CONFIG.PRO_YEARLY_PRICE_ID,
} as const;
