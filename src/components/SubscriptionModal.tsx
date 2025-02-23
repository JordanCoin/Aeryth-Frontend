import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, Shield, Star, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stripeService } from '@/services/stripe.service';
import { STRIPE_PRICES } from '@/config/stripe';
import { toast } from 'sonner';
import { isStripeConfigured } from '@/config/stripe';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  description: string;
  highlight?: boolean;
  savings?: number;
  stripePriceId: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => Promise<void>;
}

const PLANS: Plan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro',
    price: 10,
    interval: 'month',
    stripePriceId: STRIPE_PRICES.PRO_MONTHLY!,
    description: 'Perfect for individuals and small teams',
    features: [
      'Unlimited task extraction',
      'AI-powered suggestions',
      'Basic integrations',
      'Email support',
    ],
  },
  {
    id: 'pro-yearly',
    name: 'Pro',
    price: 96,
    interval: 'year',
    stripePriceId: STRIPE_PRICES.PRO_YEARLY!,
    description: 'Perfect for individuals and small teams',
    savings: 24,
    features: [
      'Unlimited task extraction',
      'AI-powered suggestions',
      'Basic integrations',
      'Email support',
    ],
  },
  // ... other plans
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
}) => {
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);

  // Skip if in test environment or Stripe is not configured
  if (process.env.NODE_ENV === 'test' || !isStripeConfigured()) {
    return null;
  }

  const handleSubscribe = async (plan: Plan) => {
    try {
      setIsLoading(true);
      await stripeService.createCheckoutSession(plan.stripePriceId);
      await onSubscribe(plan.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlans = PLANS.filter(plan => plan.interval === selectedInterval);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with modern blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 overflow-y-auto"
            onClick={onClose}
          >
            {/* Center modal container */}
            <div className="min-h-screen px-4 text-center">
              {/* This element centers the modal */}
              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="inline-block w-full max-w-4xl my-8 text-left align-middle 
                  transform transition-all"
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                  overflow-hidden border border-gray-200 dark:border-gray-800"
                >
                  {/* Header */}
                  <div className="relative px-6 py-8 text-center">
                    <button
                      onClick={onClose}
                      className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                        transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Upgrade Your Workflow
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Take your productivity to the next level with our premium features
                    </p>

                    {/* Interval Toggle */}
                    <div className="mt-6 inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                      {['month', 'year'].map(interval => (
                        <button
                          key={interval}
                          onClick={() => setSelectedInterval(interval as 'month' | 'year')}
                          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                            selectedInterval === interval
                              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {interval.charAt(0).toUpperCase() + interval.slice(1)}ly
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plans */}
                  <div className="grid md:grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
                    {activePlans.map(plan => (
                      <motion.div
                        key={plan.id}
                        initial={false}
                        animate={{ scale: plan.highlight ? 1.02 : 1 }}
                        className={`relative bg-white dark:bg-gray-900 rounded-xl p-6 ${
                          plan.highlight
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                            : 'border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {plan.highlight && (
                          <div
                            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white 
                            text-sm font-medium px-3 py-1 rounded-full"
                          >
                            Most Popular
                          </div>
                        )}

                        <div className="flex items-baseline justify-between">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          {plan.savings && plan.savings > 0 && (
                            <span className="text-green-500 text-sm font-medium">
                              Save ${plan.savings}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            ${plan.price}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            /{plan.interval}
                          </span>
                        </div>

                        <ul className="mt-6 space-y-3">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center text-gray-700 dark:text-gray-300"
                            >
                              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSubscribe(plan)}
                          disabled={isLoading}
                          className={`w-full mt-6 py-3 flex items-center justify-center space-x-2 ${
                            plan.highlight
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Choose {plan.name}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div
                    className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t 
                    border-gray-200 dark:border-gray-700"
                  >
                    <div
                      className="flex items-center justify-center space-x-8 text-sm text-gray-500 
                      dark:text-gray-400"
                    >
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        <span>30-day money back</span>
                      </div>
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        <span>Instant access</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        <span>Premium support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
