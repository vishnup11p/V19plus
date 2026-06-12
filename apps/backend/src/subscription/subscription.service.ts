import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

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

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private stripe: Stripe | null = null;
  private razorpay: InstanceType<typeof Razorpay> | null = null;
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(private readonly prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey !== 'sk_test_xxx' && stripeKey !== 'sk_test_placeholder') {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16' as any,
      });
      this.logger.log('Stripe client initialized');
    } else if (!this.isProduction) {
      this.logger.log('Stripe client running in simulation mode (dev only)');
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isPlaceholderKey =
      !razorpayKeyId ||
      !razorpayKeySecret ||
      razorpayKeyId === 'rzp_test_mockkey' ||
      razorpayKeyId === 'rzp_test_xxx' ||
      razorpayKeySecret === 'your_razorpay_secret';

    if (!isPlaceholderKey) {
      this.razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
      this.logger.log('Razorpay client initialized');
    } else if (!this.isProduction) {
      this.logger.log('Razorpay running in simulation mode (dev only)');
    }
  }

  getPlans() {
    return PLANS;
  }

  async getCurrentSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async createCheckoutSession(userId: string, plan: PlanId) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const planConfig = PLANS.find((p) => p.id === plan);
    if (!planConfig) throw new BadRequestException('Invalid plan');

    if (!this.stripe) {
      if (this.isProduction) {
        throw new BadRequestException('Stripe is not configured');
      }
      // Dev-only simulation
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.subscription.upsert({
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

      // Write a simulated successful payment record
      await this.prisma.payment.create({
        data: {
          userId,
          amount: planConfig.price,
          currency: planConfig.currency,
          status: 'SUCCESS',
          provider: 'STRIPE_SIMULATION',
          transactionId: `txn_sim_${Math.random().toString(36).substring(2, 11)}`,
        },
      });

      return { url: `${this.frontendUrl}/subscription?success=true`, demo: true };
    }

    // Generate real Stripe Session
    try {
      let subscription = await this.prisma.subscription.findUnique({ where: { userId } });
      let customerId = subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await this.stripe.customers.create({ email: user.email, name: user.name });
        customerId = customer.id;
      }

      const session = await this.stripe.checkout.sessions.create({
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
        success_url: `${this.frontendUrl}/subscription?success=true`,
        cancel_url: `${this.frontendUrl}/subscription?cancelled=true`,
        metadata: { userId, plan },
      });

      return { url: session.url };
    } catch (err: any) {
      this.logger.error('Stripe session creation failed:', err);
      throw new BadRequestException('Stripe checkout failed');
    }
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new NotFoundException('No active subscription');

    if (subscription.stripeSubscriptionId && this.stripe) {
      try {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (err) {
        this.logger.error('Failed to cancel subscription in Stripe:', err);
      }
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Subscription cancelled successfully' };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'whsec_xxx') {
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { userId, plan } = session.metadata;
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.subscription.upsert({
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

        // Save real payment details
        await this.prisma.payment.create({
          data: {
            userId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'inr',
            status: 'SUCCESS',
            provider: 'STRIPE',
            transactionId: session.id,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELLED' },
        });
        break;
      }
    }

    return { received: true };
  }

  async createRazorpayOrder(userId: string, plan: PlanId) {
    const planConfig = PLANS.find((p) => p.id === plan);
    if (!planConfig) throw new BadRequestException('Invalid plan');

    if (this.razorpay) {
      const order = await this.razorpay.orders.create({
        amount: planConfig.price * 100,
        currency: 'INR',
        receipt: `sub_${userId}_${Date.now()}`,
        notes: { userId, plan },
      });
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      };
    }

    if (this.isProduction) {
      throw new BadRequestException('Razorpay is not configured');
    }

    const orderId = `order_razor_${Math.random().toString(36).substring(2, 11)}`;
    return {
      orderId,
      amount: planConfig.price * 100,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
    };
  }

  async verifyRazorpayPayment(userId: string, data: { orderId: string; paymentId: string; signature: string; plan: PlanId }) {
    const planConfig = PLANS.find((p) => p.id === data.plan);
    if (!planConfig) throw new BadRequestException('Invalid plan');

    if (this.razorpay) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${data.orderId}|${data.paymentId}`)
        .digest('hex');
      if (expected !== data.signature) {
        throw new BadRequestException('Invalid payment signature');
      }
    } else if (this.isProduction) {
      throw new BadRequestException('Razorpay is not configured');
    }
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        amount: planConfig.price,
        currency: 'INR',
        status: 'SUCCESS',
        provider: 'RAZORPAY',
        transactionId: data.paymentId,
      },
    });

    return { success: true };
  }
}
