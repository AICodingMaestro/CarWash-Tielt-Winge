import Stripe from 'stripe';

let stripe: Stripe;

export const initializeStripe = (): void => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not defined');
  }

  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  console.log('✅ Stripe initialized successfully');
};

export const getStripe = (): Stripe => {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initializeStripe() first.');
  }
  return stripe;
};

export default getStripe;