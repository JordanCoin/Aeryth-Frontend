import { getStripe } from '@/config/stripe';
import { logger } from '@/utils/logger';

export class StripeService {
  private static instance: StripeService;

  private constructor() {
    // Private constructor for singleton pattern
    logger.debug('StripeService instance created');
  }

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async createCheckoutSession(priceId: string) {
    try {
      const response = await fetch('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await response.json();
      const stripe = await getStripe();

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      logger.error('Stripe checkout error', { error });
      throw error;
    }
  }

  async createPortalSession() {
    try {
      const response = await fetch('/api/v1/stripe/create-portal-session', {
        method: 'POST',
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      logger.error('Stripe portal error', { error });
      throw error;
    }
  }
}

export const stripeService = StripeService.getInstance();
