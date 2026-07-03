import Stripe from 'stripe';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  BASIC: {
    name: 'Basic',
    price: 799, // $7.99
    screens: 1,
    quality: 'HD',
    features: ['1 Screen', 'HD Quality', 'Mobile + Tablet'],
  },
  STANDARD: {
    name: 'Standard',
    price: 1299, // $12.99
    screens: 2,
    quality: 'Full HD',
    features: ['2 Screens', 'Full HD', 'All Devices', 'Downloads'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 1799, // $17.99
    screens: 4,
    quality: '4K + Dolby Atmos',
    features: ['4 Screens', '4K + HDR', 'Dolby Atmos', 'All Devices', 'Downloads'],
  },
};

logger.info('💳 Stripe config loaded');

export default stripe;
