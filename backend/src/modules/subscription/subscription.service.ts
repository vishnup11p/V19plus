import prisma from '../../config/db';
import stripe from '../../config/stripe';
import { AppError } from '../../middleware/errorHandler';

export type PlanId = 'BASIC' | 'STANDARD' | 'PREMIUM';

export const PLANS = [
  {
    id: 'BASIC' as PlanId,
    name: 'Basic',
    price: 499,
    currency: 'inr',
    screens: 1,
    quality: 'HD',
    features: ['1 screen', 'HD quality', 'Mobile & tablet'],
  },
  {
    id: 'STANDARD' as PlanId,
    name: 'Standard',
    price: 799,
    currency: 'inr',
    screens: 2,
    quality: 'Full HD',
    features: ['2 screens', 'Full HD', 'All devices'],
  },
  {
    id: 'PREMIUM' as PlanId,
    name: 'Premium',
    price: 1299,
    currency: 'inr',
    screens: 4,
    quality: '4K + Dolby Atmos',
    features: ['4 screens', '4K + Dolby Atmos', 'All devices', 'Downloads'],
  },
];

export function getPlans() {
  return PLANS;
}

export async function getCurrentSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function createCheckoutSession(userId: string, plan: PlanId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const planConfig = PLANS.find((p) => p.id === plan);
  if (!planConfig) throw new AppError('Invalid plan', 400);

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_xxx') {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
    return { url: `${process.env.FRONTEND_URL}/subscription?success=true`, demo: true };
  }

  let subscription = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: planConfig.currency,
        product_data: { name: `V19+ ${planConfig.name}` },
        unit_amount: planConfig.price * 100,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription?cancelled=true`,
    metadata: { userId, plan },
  });

  return { url: session.url };
}

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) throw new AppError('No active subscription', 404);

  if (subscription.stripeSubscriptionId && stripe) {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  }

  await prisma.subscription.update({
    where: { userId },
    data: { status: 'CANCELLED' },
  });

  return { message: 'Subscription cancelled' };
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_xxx') {
    return { received: true };
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const { userId, plan } = session.metadata;
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: 'ACTIVE',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan,
          status: 'ACTIVE',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'CANCELLED' },
      });
      break;
    }
  }

  return { received: true };
}
